// ThreatSense — All dummy data
// Import from here in every component — never hardcode data inside components

// ─── DUMMY CLIENT (logged-in user) ──────────────────────────────────────────
export const DUMMY_CLIENT = {
  _id: "client_001",
  name: "Maneesh Kumar",
  email: "maneesh@ecomstore.com",
  website_name: "EcomStore",
  website_url: "https://ecomstore.com",
  api_key: "ts_live_k9x2mq7rtp4j8nve",
  plan: "pro",
  created_at: "2026-02-01T10:00:00Z",
  alerts_this_month: 47,
  logs_this_month: 12483,
}

// ─── ALERTS ─────────────────────────────────────────────────────────────────
export const DUMMY_ALERTS = [
  {
    _id: "alert_001",
    client_id: "client_001",
    severity_label: "CRITICAL",
    severity_score: 9.2,
    attack_classification: "Coordinated Attack",
    attack_narrative: "A coordinated attack was detected originating from IP 185.220.101.45 (known TOR exit node, Russia). The Network Agent identified a horizontal port scan across 200 unique ports within 60 seconds. Simultaneously, the Auth Agent flagged 47 failed SSH login attempts targeting user_42 from the same IP — well above the brute force threshold of 5 per minute. Cross-agent correlation elevated this from individual MEDIUM findings to CRITICAL. The Behavioral Agent subsequently flagged user_42 downloading 2.1 GB of data, 42x their daily baseline of 50 MB. Immediate containment is recommended.",
    mitre_techniques: [
      { id: "T1046",  name: "Network Service Scanning",   tactic: "Discovery",          url: "https://attack.mitre.org/techniques/T1046"     },
      { id: "T1110",  name: "Brute Force",                tactic: "Credential Access",  url: "https://attack.mitre.org/techniques/T1110"     },
      { id: "T1041",  name: "Exfiltration Over C2",       tactic: "Exfiltration",       url: "https://attack.mitre.org/techniques/T1041"     },
    ],
    recommended_actions: [
      "Block IP 185.220.101.45 at the firewall immediately",
      "Suspend user_42 account pending investigation",
      "Review all files accessed by user_42 in the last 2 hours",
      "Enable MFA enforcement for all SSH access",
      "Preserve all logs for forensic analysis",
    ],
    affected_entities: ["185.220.101.45", "user_42", "WS-042", "10.0.0.5"],
    timeline: [
      { timestamp: "2026-03-19T01:45:00Z", event: "Port scan on 200 ports initiated",           agent_source: "Network Agent"    },
      { timestamp: "2026-03-19T01:47:00Z", event: "47 failed SSH login attempts detected",      agent_source: "Auth Agent"       },
      { timestamp: "2026-03-19T01:52:00Z", event: "Successful login after brute force",          agent_source: "Auth Agent"       },
      { timestamp: "2026-03-19T01:53:00Z", event: "2.1 GB data download — 42x user baseline",   agent_source: "Behavioral Agent" },
    ],
    agent_findings: {
      network_agent:    { anomaly_flags: ["port_scan", "known_bad_ip", "geo_anomaly"],        confidence: 0.96, severity: 8.5, source_ip: "185.220.101.45", country: "Russia"  },
      auth_agent:       { anomaly_flags: ["brute_force", "off_hours", "new_country"],         confidence: 0.94, severity: 8.8, user_id: "user_42", failed_attempts: 47         },
      malware_agent:    { anomaly_flags: [],                                                   confidence: 0.10, severity: 0.5                                                  },
      behavioral_agent: { anomaly_flags: ["data_exfiltration", "baseline_deviation"],         confidence: 0.91, severity: 8.2, entity_id: "user_42", bytes_ratio: 42           },
    },
    severity_breakdown: { network: 8.5, auth: 8.8, malware: 0.5, behavioral: 8.2 },
    acknowledged: false,
    created_at: "2026-03-19T01:45:00Z",
  },
  {
    _id: "alert_002",
    client_id: "client_001",
    severity_label: "HIGH",
    severity_score: 7.8,
    attack_classification: "Malware Execution",
    attack_narrative: "Malware execution detected on workstation WS-042. Microsoft Word spawned PowerShell with a base64-encoded command — a classic Office macro attack pattern. The Malware Agent matched the parent-child process relationship against known suspicious lineage rules. The spawned PowerShell process immediately established an outbound connection to 194.165.16.15, a known C2 server.",
    mitre_techniques: [
      { id: "T1059.001", name: "PowerShell",                   tactic: "Execution",         url: "https://attack.mitre.org/techniques/T1059/001" },
      { id: "T1218",     name: "System Binary Proxy Execution", tactic: "Defense Evasion",   url: "https://attack.mitre.org/techniques/T1218"     },
      { id: "T1071.001", name: "Web Protocols C2",             tactic: "Command & Control",  url: "https://attack.mitre.org/techniques/T1071/001" },
    ],
    recommended_actions: [
      "Isolate WS-042 from the network immediately",
      "Kill the PowerShell process tree (PID 4821 and children)",
      "Block outbound connections to 194.165.16.15",
      "Capture memory dump of WS-042 for forensic analysis",
    ],
    affected_entities: ["WS-042", "194.165.16.15", "user_07"],
    timeline: [
      { timestamp: "2026-03-19T09:12:00Z", event: "winword.exe opened suspicious document",    agent_source: "Malware Agent"  },
      { timestamp: "2026-03-19T09:12:15Z", event: "PowerShell spawned with encoded command",   agent_source: "Malware Agent"  },
      { timestamp: "2026-03-19T09:12:18Z", event: "C2 connection to 194.165.16.15:4444",       agent_source: "Network Agent"  },
    ],
    agent_findings: {
      network_agent:    { anomaly_flags: ["c2_beacon", "known_bad_ip"],                  confidence: 0.88, severity: 7.5, dest_ip: "194.165.16.15"                    },
      auth_agent:       { anomaly_flags: [],                                              confidence: 0.10, severity: 0.2                                              },
      malware_agent:    { anomaly_flags: ["suspicious_lineage", "lolbas", "encoded_cmd"],confidence: 0.95, severity: 8.8, process_name: "powershell.exe", parent: "winword.exe" },
      behavioral_agent: { anomaly_flags: ["new_process_pattern"],                        confidence: 0.72, severity: 5.5, entity_id: "user_07"                        },
    },
    severity_breakdown: { network: 7.5, auth: 0.2, malware: 8.8, behavioral: 5.5 },
    acknowledged: false,
    created_at: "2026-03-19T09:12:00Z",
  },
  {
    _id: "alert_003",
    client_id: "client_001",
    severity_label: "MEDIUM",
    severity_score: 5.4,
    attack_classification: "Brute Force Login",
    attack_narrative: "A brute force login attempt was detected against user_15 from IP 45.142.212.100 (Ukraine). 23 failed password attempts were recorded within 90 seconds. The attempt occurred at 03:20 AM, outside user_15's normal working hours. No successful login was recorded.",
    mitre_techniques: [
      { id: "T1110", name: "Brute Force", tactic: "Credential Access", url: "https://attack.mitre.org/techniques/T1110" },
    ],
    recommended_actions: [
      "Block IP 45.142.212.100 at firewall",
      "Force password reset for user_15",
      "Enable account lockout after 5 failed attempts",
    ],
    affected_entities: ["45.142.212.100", "user_15"],
    timeline: [
      { timestamp: "2026-03-19T03:20:00Z", event: "23 failed login attempts in 90 seconds", agent_source: "Auth Agent" },
      { timestamp: "2026-03-19T03:21:30Z", event: "Account temporarily locked by system",   agent_source: "Auth Agent" },
    ],
    agent_findings: {
      network_agent:    { anomaly_flags: ["known_bad_ip"],              confidence: 0.75, severity: 5.0, source_ip: "45.142.212.100"            },
      auth_agent:       { anomaly_flags: ["brute_force", "off_hours"],  confidence: 0.92, severity: 6.5, user_id: "user_15", failed_attempts: 23 },
      malware_agent:    { anomaly_flags: [],                            confidence: 0.05, severity: 0.1                                          },
      behavioral_agent: { anomaly_flags: ["off_hours", "repeat_pattern"],confidence: 0.68, severity: 4.5, entity_id: "user_15"                  },
    },
    severity_breakdown: { network: 5.0, auth: 6.5, malware: 0.1, behavioral: 4.5 },
    acknowledged: true,
    created_at: "2026-03-19T03:20:00Z",
  },
  {
    _id: "alert_004",
    client_id: "client_001",
    severity_label: "HIGH",
    severity_score: 7.1,
    attack_classification: "DNS Tunneling",
    attack_narrative: "DNS tunneling activity detected from internal host 10.0.0.42. The Network Agent identified 20 consecutive DNS TXT queries to tunnel.evil-c2-server.com with high-entropy subdomains (avg 64 chars, entropy 4.2 — above the 3.5 threshold). This pattern is consistent with C2 communication encoded in DNS query strings to bypass firewall inspection.",
    mitre_techniques: [
      { id: "T1071.004", name: "DNS C2", tactic: "Command & Control", url: "https://attack.mitre.org/techniques/T1071/004" },
    ],
    recommended_actions: [
      "Block all DNS queries to tunnel.evil-c2-server.com",
      "Identify and isolate host 10.0.0.42",
      "Enable DNS inspection on firewall",
    ],
    affected_entities: ["10.0.0.42", "tunnel.evil-c2-server.com"],
    timeline: [
      { timestamp: "2026-03-19T11:30:00Z", event: "20 high-entropy DNS TXT queries detected",  agent_source: "Network Agent" },
      { timestamp: "2026-03-19T11:31:00Z", event: "Query entropy 4.2 exceeds threshold 3.5",   agent_source: "Network Agent" },
    ],
    agent_findings: {
      network_agent:    { anomaly_flags: ["dns_tunneling", "high_entropy"],  confidence: 0.89, severity: 7.8, source_ip: "10.0.0.42" },
      auth_agent:       { anomaly_flags: [],                                 confidence: 0.05, severity: 0.1                         },
      malware_agent:    { anomaly_flags: [],                                 confidence: 0.15, severity: 1.0                         },
      behavioral_agent: { anomaly_flags: ["unusual_dns_pattern"],            confidence: 0.61, severity: 5.0, entity_id: "10.0.0.42" },
    },
    severity_breakdown: { network: 7.8, auth: 0.1, malware: 1.0, behavioral: 5.0 },
    acknowledged: false,
    created_at: "2026-03-19T11:30:00Z",
  },
  {
    _id: "alert_005",
    client_id: "client_001",
    severity_label: "LOW",
    severity_score: 2.8,
    attack_classification: "Anomalous Login",
    attack_narrative: "user_33 logged in at 11:45 PM from a new IP address (10.0.0.201) not seen in their login history. The login was successful with MFA. While individually low severity, the Behavioral Agent flagged this as the user's first login from this IP and outside their usual 8 AM to 8 PM window. No suspicious post-login activity observed.",
    mitre_techniques: [
      { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", url: "https://attack.mitre.org/techniques/T1078" },
    ],
    recommended_actions: [
      "Confirm with user_33 if this login was legitimate",
      "Monitor subsequent activity from this session",
    ],
    affected_entities: ["user_33", "10.0.0.201"],
    timeline: [
      { timestamp: "2026-03-18T23:45:00Z", event: "Successful login from new IP at off-hours", agent_source: "Auth Agent" },
    ],
    agent_findings: {
      network_agent:    { anomaly_flags: [],                   confidence: 0.20, severity: 1.0                          },
      auth_agent:       { anomaly_flags: ["off_hours","new_ip"],confidence: 0.65, severity: 3.5, user_id: "user_33"    },
      malware_agent:    { anomaly_flags: [],                   confidence: 0.05, severity: 0.1                          },
      behavioral_agent: { anomaly_flags: ["new_ip","off_hours"],confidence: 0.58, severity: 3.0, entity_id: "user_33"  },
    },
    severity_breakdown: { network: 1.0, auth: 3.5, malware: 0.1, behavioral: 3.0 },
    acknowledged: false,
    created_at: "2026-03-18T23:45:00Z",
  },
]

// ─── LOGS ───────────────────────────────────────────────────────────────────
export const DUMMY_LOGS = [
  { _id: "log_001", client_id: "client_001", log_type: "auth",       source: "ecomstore",  source_ip: "185.220.101.45", user_id: "user_42",  status: "failure", processed: true,  timestamp: "2026-03-19T01:47:00Z", raw_payload: { user_id: "user_42", source_ip: "185.220.101.45", auth_method: "password", auth_result: "failure", path: "/login" } },
  { _id: "log_002", client_id: "client_001", log_type: "network",    source: "ecomstore",  source_ip: "185.220.101.45", user_id: null,       status: "flagged", processed: true,  timestamp: "2026-03-19T01:45:00Z", raw_payload: { source_ip: "185.220.101.45", destination_ip: "10.0.0.5", destination_port: 22, protocol: "TCP", bytes_out: 64 } },
  { _id: "log_003", client_id: "client_001", log_type: "process",    source: "ecomstore",  source_ip: "10.0.0.12",      user_id: "user_07",  status: "flagged", processed: true,  timestamp: "2026-03-19T09:12:00Z", raw_payload: { process_name: "powershell.exe", parent_process: "winword.exe", command_line: "powershell -enc SGVsbG8=" } },
  { _id: "log_004", client_id: "client_001", log_type: "dns",        source: "ecomstore",  source_ip: "10.0.0.42",      user_id: null,       status: "flagged", processed: true,  timestamp: "2026-03-19T11:30:00Z", raw_payload: { query: "aGVsbG8gd29ybGQ=.tunnel.evil-c2-server.com", query_type: "TXT", query_length: 68 } },
  { _id: "log_005", client_id: "client_001", log_type: "auth",       source: "ecomstore",  source_ip: "45.142.212.100", user_id: "user_15",  status: "failure", processed: true,  timestamp: "2026-03-19T03:20:00Z", raw_payload: { user_id: "user_15", source_ip: "45.142.212.100", auth_method: "password", auth_result: "failure", path: "/login" } },
  { _id: "log_006", client_id: "client_001", log_type: "behavioral", source: "ecomstore",  source_ip: "10.0.0.5",       user_id: "user_42",  status: "flagged", processed: true,  timestamp: "2026-03-19T01:53:00Z", raw_payload: { entity_id: "user_42", bytes_transferred: 2000000000, resources_accessed: ["/api/backup", "/api/users/export"] } },
  { _id: "log_007", client_id: "client_001", log_type: "auth",       source: "ecomstore",  source_ip: "192.168.1.100",  user_id: "user_01",  status: "success", processed: true,  timestamp: "2026-03-19T08:32:00Z", raw_payload: { user_id: "user_01", source_ip: "192.168.1.100", auth_method: "mfa", auth_result: "success", path: "/login" } },
  { _id: "log_008", client_id: "client_001", log_type: "network",    source: "ecomstore",  source_ip: "192.168.1.105",  user_id: null,       status: "normal",  processed: true,  timestamp: "2026-03-19T08:33:00Z", raw_payload: { source_ip: "192.168.1.105", destination_ip: "8.8.8.8", destination_port: 443, protocol: "TCP", bytes_out: 1200 } },
  { _id: "log_009", client_id: "client_001", log_type: "auth",       source: "ecomstore",  source_ip: "10.0.0.201",     user_id: "user_33",  status: "success", processed: true,  timestamp: "2026-03-18T23:45:00Z", raw_payload: { user_id: "user_33", source_ip: "10.0.0.201", auth_method: "mfa", auth_result: "success", mfa_used: true } },
  { _id: "log_010", client_id: "client_001", log_type: "process",    source: "ecomstore",  source_ip: "10.0.0.22",      user_id: "user_05",  status: "normal",  processed: false, timestamp: "2026-03-19T14:01:00Z", raw_payload: { process_name: "chrome.exe", parent_process: "explorer.exe", command_line: "chrome.exe --new-window" } },
]

// ─── STATS ──────────────────────────────────────────────────────────────────
export const DUMMY_STATS = {
  counts: { critical: 1, high: 2, medium: 1, low: 1 },
  logs_today: 847,
  agents_active: 5,
  alerts_by_hour: [
    { hour: "00:00", count: 0 }, { hour: "01:00", count: 2 }, { hour: "02:00", count: 1 },
    { hour: "03:00", count: 1 }, { hour: "04:00", count: 0 }, { hour: "05:00", count: 0 },
    { hour: "06:00", count: 0 }, { hour: "07:00", count: 0 }, { hour: "08:00", count: 1 },
    { hour: "09:00", count: 1 }, { hour: "10:00", count: 0 }, { hour: "11:00", count: 1 },
    { hour: "12:00", count: 0 }, { hour: "13:00", count: 0 }, { hour: "14:00", count: 0 },
  ],
  alerts_by_type: [
    { type: "Coordinated Attack", count: 1 },
    { type: "Malware Execution",  count: 1 },
    { type: "Brute Force Login",  count: 2 },
    { type: "DNS Tunneling",      count: 1 },
    { type: "Anomalous Login",    count: 1 },
  ],
}

// ─── AGENT STATUS ───────────────────────────────────────────────────────────
export const DUMMY_AGENT_STATUS = [
  { name: "Network Anomaly Agent",      key: "network_agent",    status: "idle",       findings_today: 8,  top_flag: "port_scan",          avg_confidence: 0.87, last_active: "2026-03-19T11:31:00Z", avg_processing_ms: 420  },
  { name: "Auth & Access Agent",        key: "auth_agent",       status: "idle",       findings_today: 12, top_flag: "brute_force",        avg_confidence: 0.91, last_active: "2026-03-19T03:21:00Z", avg_processing_ms: 310  },
  { name: "Malware & Process Agent",    key: "malware_agent",    status: "processing", findings_today: 3,  top_flag: "suspicious_lineage", avg_confidence: 0.93, last_active: "2026-03-19T09:12:00Z", avg_processing_ms: 680  },
  { name: "Behavioral Analytics Agent", key: "behavioral_agent", status: "idle",       findings_today: 9,  top_flag: "data_exfiltration",  avg_confidence: 0.79, last_active: "2026-03-19T01:53:00Z", avg_processing_ms: 890  },
]

// ─── THREAT MAP ─────────────────────────────────────────────────────────────
export const DUMMY_THREAT_MAP = [
  { lat: 55.7558, lon: 37.6176, country: "Russia",  city: "Moscow",    alert_count: 2, top_severity: "CRITICAL" },
  { lat: 50.4501, lon: 30.5234, country: "Ukraine", city: "Kyiv",      alert_count: 1, top_severity: "MEDIUM"   },
  { lat: 51.1657, lon: 10.4515, country: "Germany", city: "Frankfurt", alert_count: 1, top_severity: "HIGH"     },
  { lat: 39.9042, lon: 116.407, country: "China",   city: "Beijing",   alert_count: 1, top_severity: "HIGH"     },
  { lat: 17.3850, lon: 78.4867, country: "India",   city: "Hyderabad", alert_count: 3, top_severity: "LOW"      },
]

// ─── MITRE ──────────────────────────────────────────────────────────────────
export const MITRE_TECHNIQUES = [
  { id: "T1046",     name: "Network Service Scanning",   tactic: "Discovery",          detected: true,  alert_ids: ["alert_001"]             },
  { id: "T1110",     name: "Brute Force",                tactic: "Credential Access",  detected: true,  alert_ids: ["alert_001", "alert_003"] },
  { id: "T1041",     name: "Exfiltration Over C2",       tactic: "Exfiltration",       detected: true,  alert_ids: ["alert_001"]             },
  { id: "T1059.001", name: "PowerShell",                 tactic: "Execution",          detected: true,  alert_ids: ["alert_002"]             },
  { id: "T1218",     name: "System Binary Proxy Exec",   tactic: "Defense Evasion",    detected: true,  alert_ids: ["alert_002"]             },
  { id: "T1071.001", name: "Web Protocols C2",           tactic: "Command & Control",  detected: true,  alert_ids: ["alert_002"]             },
  { id: "T1071.004", name: "DNS C2",                     tactic: "Command & Control",  detected: true,  alert_ids: ["alert_004"]             },
  { id: "T1078",     name: "Valid Accounts",             tactic: "Initial Access",      detected: true,  alert_ids: ["alert_005"]             },
  { id: "T1055",     name: "Process Injection",          tactic: "Defense Evasion",    detected: false, alert_ids: []                        },
  { id: "T1021",     name: "Remote Services",            tactic: "Lateral Movement",   detected: false, alert_ids: []                        },
]

// ─── CHAT ───────────────────────────────────────────────────────────────────
export const DUMMY_CHAT_RESPONSES = {
  critical:   "You have 1 CRITICAL alert right now — ALERT-alert_001 shows a coordinated attack from 185.220.101.45 (TOR exit node, Russia). Port scan on 200 ports was followed by 47 SSH brute force attempts targeting user_42. Severity 9.2/10. Immediate action: block this IP at the firewall and suspend user_42's account.",
  user:       "user_42 has 2 alerts in the past 2 hours. The Auth Agent flagged 47 failed logins at 1:47 AM from a TOR exit node — outside their normal 9 AM–6 PM window. The Behavioral Agent then detected 2.1 GB downloaded (42x their baseline). This pattern is consistent with account takeover followed by data exfiltration. Recommend disabling user_42 immediately.",
  summary:    "Security Summary — March 19, 2026. ThreatSense detected 5 alerts today for EcomStore: 1 critical, 2 high, 1 medium, 1 low. Key incidents: (1) Coordinated attack from Russian TOR IP — blocked. (2) Malware execution on WS-042 — host isolated. (3) DNS tunneling from 10.0.0.42 — traffic blocked. All critical alerts have been actioned.",
  default:    "Based on today's data, ThreatSense has detected 5 alerts for EcomStore — 1 critical, 2 high, 1 medium, 1 low. The most serious is ALERT-alert_001 involving a coordinated attack from IP 185.220.101.45. The Auth Agent has been the most active today with 12 findings. Would you like me to elaborate on any specific alert or incident?",
}

export const SUGGESTED_PROMPTS = [
  { text: "What are today's critical alerts?",        icon: "AlertTriangle" },
  { text: "Which user had the most failed logins?",   icon: "User"          },
  { text: "Summarize latest attack for my manager",   icon: "FileText"      },
  { text: "Any signs of lateral movement?",           icon: "GitBranch"     },
  { text: "Which IP is most suspicious right now?",   icon: "Globe"         },
  { text: "Which agent flagged the most threats?",    icon: "Cpu"           },
]
