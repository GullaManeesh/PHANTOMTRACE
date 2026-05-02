import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt

from mongodb_db import MongoDBConnection


JWT_ALGORITHM = "HS256"
PASSWORD_HASH_ITERATIONS = 210_000
API_KEY_PREFIX_LENGTH = 20


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "").strip()
    if secret:
        return secret
    return "change-me-in-production-phantom-trace"


def _jwt_exp_hours() -> int:
    raw = os.getenv("JWT_EXPIRE_HOURS", "24").strip()
    try:
        value = int(raw)
        return value if value > 0 else 24
    except ValueError:
        return 24


def _derive_hash(secret: str, salt_hex: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        secret.encode("utf-8"),
        bytes.fromhex(salt_hex),
        PASSWORD_HASH_ITERATIONS,
    )
    return digest.hex()


def _new_salt_hex() -> str:
    return secrets.token_bytes(16).hex()


def _issue_api_key() -> str:
    token = secrets.token_urlsafe(32).replace("-", "").replace("_", "")
    return f"pt_live_{token}"


def _api_key_prefix(api_key: str) -> str:
    return api_key[:API_KEY_PREFIX_LENGTH]


def _api_key_last4(api_key: str) -> str:
    return api_key[-4:]


def _iso_or_none(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat()


def _auth_collection():
    db = MongoDBConnection.get_database("phantom_trace")
    return db["auth"]


def _new_api_key_record(api_key: str) -> Dict[str, Any]:
    api_key_info = hash_secret(api_key)
    return {
        "id": str(uuid.uuid4()),
        "api_key_hash": api_key_info["hash"],
        "api_key_salt": api_key_info["salt"],
        "api_key_prefix": _api_key_prefix(api_key),
        "api_key_last4": _api_key_last4(api_key),
        "api_key_value": api_key,
        "created_at": _utc_now(),
        "last_used_at": None,
        "is_active": True,
    }


def _user_api_keys(doc: Dict[str, Any]) -> list[Dict[str, Any]]:
    keys = doc.get("api_keys")
    if isinstance(keys, list):
        return keys

    # Backward-compatible fallback for older users with a single legacy key shape.
    if doc.get("api_key_hash") and doc.get("api_key_salt"):
        return [{
            "id": "legacy",
            "api_key_hash": doc.get("api_key_hash"),
            "api_key_salt": doc.get("api_key_salt"),
            "api_key_prefix": doc.get("api_key_prefix", ""),
            "api_key_last4": doc.get("api_key_last4", ""),
            "api_key_value": doc.get("api_key_value"),
            "created_at": doc.get("created_at"),
            "last_used_at": doc.get("last_login_at"),
            "is_active": True,
        }]

    return []


def _active_api_key_hint(doc: Dict[str, Any]) -> str:
    for key in _user_api_keys(doc):
        if key.get("is_active", True):
            return f"{key.get('api_key_prefix', '')}...{key.get('api_key_last4', '')}"

    return f"{doc.get('api_key_prefix', '')}...{doc.get('api_key_last4', '')}"


def _public_user_view(doc: Dict[str, Any], include_plain_api_key: Optional[str] = None) -> Dict[str, Any]:
    created_at = doc.get("created_at")
    last_login_at = doc.get("last_login_at")
    api_keys = _user_api_keys(doc)
    return {
        "id": str(doc.get("_id")),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "website_name": doc.get("website_name", ""),
        "website_url": doc.get("website_url", ""),
        "api_key_hint": _active_api_key_hint(doc),
        "api_keys_count": len(api_keys),
        "api_key": include_plain_api_key,
        "created_at": created_at.isoformat() if created_at else None,
        "last_login_at": last_login_at.isoformat() if last_login_at else None,
    }


def hash_secret(secret: str) -> Dict[str, str]:
    salt_hex = _new_salt_hex()
    return {
        "salt": salt_hex,
        "hash": _derive_hash(secret, salt_hex),
    }


def verify_secret(secret: str, salt_hex: str, expected_hash_hex: str) -> bool:
    computed = _derive_hash(secret, salt_hex)
    return hmac.compare_digest(computed, expected_hash_hex)


def create_access_token(user_doc: Dict[str, Any]) -> str:
    now = _utc_now()
    payload = {
        "sub": str(user_doc.get("_id")),
        "email": user_doc.get("email"),
        "iat": now,
        "exp": now + timedelta(hours=_jwt_exp_hours()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token has expired", status_code=401) from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError("Invalid token", status_code=401) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Token payload is invalid", status_code=401)

    collection = _auth_collection()
    user_doc = collection.find_one({"_id": _try_object_id(user_id)})
    if not user_doc:
        raise AuthError("User not found for token", status_code=401)

    if not user_doc.get("is_active", True):
        raise AuthError("User is inactive", status_code=403)

    return user_doc


def _try_object_id(value: str):
    try:
        from bson import ObjectId
        return ObjectId(value)
    except Exception:
        return value


def register_user(*, name: str, email: str, password: str, website_name: str = "", website_url: str = "") -> Dict[str, Any]:
    clean_email = email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise AuthError("A valid email is required", status_code=400)
    if len(password.strip()) < 8:
        raise AuthError("Password must be at least 8 characters", status_code=400)

    collection = _auth_collection()
    existing = collection.find_one({"email": clean_email})
    if existing:
        raise AuthError("An account with this email already exists", status_code=409)

    password_info = hash_secret(password)
    api_key = _issue_api_key()
    primary_api_key = _new_api_key_record(api_key)

    now = _utc_now()
    record = {
        "name": (name or "").strip(),
        "email": clean_email,
        "website_name": (website_name or "").strip(),
        "website_url": (website_url or "").strip(),
        "password_hash": password_info["hash"],
        "password_salt": password_info["salt"],
        "api_keys": [primary_api_key],
        "api_key_hash": primary_api_key["api_key_hash"],
        "api_key_salt": primary_api_key["api_key_salt"],
        "api_key_prefix": primary_api_key["api_key_prefix"],
        "api_key_last4": primary_api_key["api_key_last4"],
        "api_key_value": primary_api_key["api_key_value"],
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }

    inserted = collection.insert_one(record)
    record["_id"] = inserted.inserted_id

    token = create_access_token(record)
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "api_key": api_key,
        "user": _public_user_view(record, include_plain_api_key=api_key),
    }


def login_user(*, email: str, password: str) -> Dict[str, Any]:
    clean_email = email.strip().lower()
    collection = _auth_collection()
    user_doc = collection.find_one({"email": clean_email})

    if not user_doc:
        raise AuthError("Invalid email or password", status_code=401)

    if not user_doc.get("is_active", True):
        raise AuthError("User is inactive", status_code=403)

    if not verify_secret(password, user_doc.get("password_salt", ""), user_doc.get("password_hash", "")):
        raise AuthError("Invalid email or password", status_code=401)

    now = _utc_now()
    collection.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login_at": now, "updated_at": now}},
    )
    user_doc["last_login_at"] = now
    user_doc["updated_at"] = now

    token = create_access_token(user_doc)
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "api_key": None,
        "user": _public_user_view(user_doc),
    }


def verify_api_key(api_key: str) -> Dict[str, Any]:
    cleaned = (api_key or "").strip()
    if not cleaned:
        raise AuthError("API key is required", status_code=401)

    prefix = _api_key_prefix(cleaned)
    collection = _auth_collection()
    candidates = list(
        collection.find(
            {
                "$and": [
                    {"is_active": True},
                    {
                        "$or": [
                            {"api_key_prefix": prefix},
                            {"api_keys.api_key_prefix": prefix},
                        ]
                    },
                ]
            }
        )
    )

    for candidate in candidates:
        keys = _user_api_keys(candidate)
        now = _utc_now()

        for index, key in enumerate(keys):
            if not key.get("is_active", True):
                continue
            if key.get("api_key_prefix") != prefix:
                continue
            if verify_secret(cleaned, key.get("api_key_salt", ""), key.get("api_key_hash", "")):
                update_data: Dict[str, Any] = {"updated_at": now}
                key_id = key.get("id")
                if key_id == "legacy":
                    update_data["last_login_at"] = now
                else:
                    update_data[f"api_keys.{index}.last_used_at"] = now

                collection.update_one({"_id": candidate["_id"]}, {"$set": update_data})
                candidate["updated_at"] = now
                return candidate

        # Legacy fallback remains for pre-migration users.
        if verify_secret(cleaned, candidate.get("api_key_salt", ""), candidate.get("api_key_hash", "")):
            collection.update_one(
                {"_id": candidate["_id"]},
                {"$set": {"updated_at": now, "last_login_at": now}},
            )
            candidate["updated_at"] = now
            candidate["last_login_at"] = now
            return candidate

    raise AuthError("Invalid API key", status_code=401)


def get_authenticated_user(*, bearer_token: Optional[str], api_key: Optional[str]) -> Dict[str, Any]:
    if bearer_token:
        return verify_access_token(bearer_token)
    if api_key:
        return verify_api_key(api_key)
    raise AuthError("Authentication required", status_code=401)


def get_me_payload(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "status": "success",
        "user": _public_user_view(user_doc),
    }


def _ensure_api_key_ids(user_doc: Dict[str, Any]) -> list[Dict[str, Any]]:
    keys = _user_api_keys(user_doc)
    if not keys:
        return keys

    updated = False
    normalized_keys: list[Dict[str, Any]] = []
    for key in keys:
        normalized_key = dict(key)
        if not normalized_key.get("id"):
            normalized_key["id"] = str(uuid.uuid4())
            updated = True
        normalized_keys.append(normalized_key)

    if updated:
        collection = _auth_collection()
        now = _utc_now()
        collection.update_one(
            {"_id": user_doc["_id"]},
            {
                "$set": {
                    "api_keys": normalized_keys,
                    "updated_at": now,
                }
            },
        )
        user_doc["api_keys"] = normalized_keys
        user_doc["updated_at"] = now

    return normalized_keys


def get_user_api_keys(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    api_keys = []
    for key in _ensure_api_key_ids(user_doc):
        if not key.get("is_active", True):
            continue
        api_keys.append(
            {
                "id": key.get("id"),
                "hint": f"{key.get('api_key_prefix', '')}...{key.get('api_key_last4', '')}",
                "api_key": key.get("api_key_value"),
                "created_at": _iso_or_none(key.get("created_at")),
                "last_used_at": _iso_or_none(key.get("last_used_at")),
            }
        )

    api_keys.sort(key=lambda key: key.get("created_at") or "", reverse=True)
    return {
        "status": "success",
        "api_keys": api_keys,
    }


def create_user_api_key(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    collection = _auth_collection()
    now = _utc_now()
    api_key = _issue_api_key()
    key_record = _new_api_key_record(api_key)

    collection.update_one(
        {"_id": user_doc["_id"]},
        {
            "$push": {"api_keys": key_record},
            "$set": {"updated_at": now},
        },
    )

    return {
        "status": "success",
        "api_key": api_key,
        "api_key_record": {
            "id": key_record["id"],
            "hint": f"{key_record.get('api_key_prefix', '')}...{key_record.get('api_key_last4', '')}",
            "api_key": key_record.get("api_key_value"),
            "created_at": _iso_or_none(key_record.get("created_at")),
            "last_used_at": _iso_or_none(key_record.get("last_used_at")),
        },
    }


def delete_user_api_key(user_doc: Dict[str, Any], key_id: str) -> Dict[str, Any]:
    clean_key_id = (key_id or "").strip()
    if not clean_key_id:
        raise AuthError("API key ID is required", status_code=400)

    keys = _ensure_api_key_ids(user_doc)
    remaining_keys = [key for key in keys if key.get("id") != clean_key_id]

    if len(remaining_keys) == len(keys):
        raise AuthError("API key not found", status_code=404)

    collection = _auth_collection()
    now = _utc_now()
    collection.update_one(
        {"_id": user_doc["_id"]},
        {
            "$set": {
                "api_keys": remaining_keys,
                "updated_at": now,
            }
        },
    )

    return {
        "status": "success",
        "deleted": True,
    }
