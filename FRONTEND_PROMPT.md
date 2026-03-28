# ThreatSense — Frontend Build Prompt for GitHub Copilot

## What to Build

A complete React frontend for **ThreatSense** — a multi-tenant AI-powered cybersecurity threat detection SaaS platform. Each registered client (website owner) logs in and sees only their own alerts, logs, and agent findings.

**Stack:** Vite + React 18, Tailwind CSS, React Router v6, Recharts, react-simple-maps, lucide-react
**Data:** All dummy/hardcoded data — no real API calls anywhere
**Theme:** Light mode only — warm beige, orange, white color palette

---

## Color Palette (use these exact values everywhere)

| Role | Hex | Where used |
|---|---|---|
| Page background | `#FAF7F2` | Body, page bg |
| Card background | `#FFFFFF` | All cards, panels |
| Card border | `#EDE8E0` | All card borders, dividers |
| Sidebar bg | `#2C1810` | Sidebar only |
| Sidebar text | `#F5ECD7` | Sidebar nav text |
| Primary orange | `#E8631A` | Buttons, active states, accents |
| Orange hover | `#C4511A` | Button hover |
| Orange light tint | `#FEF0E7` | Active nav bg, highlight bg |
| Text primary | `#1C1410` | Headings, main text |
| Text secondary | `#6B5B4E` | Subtitles, labels, muted text |
| CRITICAL | `#DC2626` | Red severity |
| HIGH | `#EA580C` | Orange-red severity |
| MEDIUM | `#D97706` | Amber severity |
| LOW | `#0D9488` | Teal severity |
| Success | `#65A86A` | Acknowledged, safe, active |
| Chart orange | `#E8631A` | Primary chart bars |
| Chart amber | `#F5A623` | Secondary chart color |
| Chart teal | `#0D9488` | Third chart color |

---

## Design Rules (apply to every file)

- All cards: `background #FFFFFF`, `border 1px solid #EDE8E0`, `border-radius 12px`, `padding 24px`, subtle box-shadow
- Page background: `#FAF7F2` on body and all page wrappers
- Every page starts with: page title (`text-2xl font-bold #1C1410`) + subtitle (`#6B5B4E text-sm`)
- Buttons: `#E8631A` bg, white text, `border-radius 8px`, hover `#C4511A`
- All inputs: `#FAF7F2` bg, `#EDE8E0` border, `border-radius 8px`, orange focus ring
- Fonts: Inter for all text, JetBrains Mono for IPs, hashes, timestamps, IDs, code
- Hover states: `150ms ease` transition on all interactive elements
- Empty states: centered icon + message in all lists and tables
- Loading states: animated beige pulse skeleton before data shows
- Timestamps: show relative time ("2 hours ago") using a `timeAgo()` helper function
- No dark mode — light theme only
- Internal navigation: always React Router `<Link>` — never `<a href>`
- Responsive: sidebar collapses on mobile with hamburger menu

---

## File Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── dummyData.js
    ├── utils/
    │   └── helpers.js
    ├── context/
    │   └── AuthContext.jsx
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── ApiKeySetup.jsx
    │   ├── Dashboard.jsx
    │   ├── AlertDetail.jsx
    │   ├── LogExplorer.jsx
    │   ├── AgentMonitor.jsx
    │   ├── ThreatMap.jsx
    │   ├── MitreView.jsx
    │   ├── Chat.jsx
    │   └── Reports.jsx
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   ├── auth/
    │   │   └── ProtectedRoute.jsx
    │   ├── alerts/
    │   │   ├── AlertFeed.jsx
    │   │   ├── AlertCard.jsx
    │   │   └── SeverityBadge.jsx
    │   ├── agents/
    │   │   ├── AgentCard.jsx
    │   │   └── AgentPipeline.jsx
    │   ├── charts/
    │   │   ├── SeverityGauge.jsx
    │   │   ├── AlertsOverTime.jsx
    │   │   └── ThreatTypeBar.jsx
    │   └── chat/
    │       ├── ChatWindow.jsx
    │       ├── ChatMessage.jsx
    │       └── SuggestedPrompts.jsx
    └── hooks/
        └── useAuth.js
```

---

## package.json

```json
{
  "name": "threatsense-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.3",
    "react-simple-maps": "^3.0.0",
    "lucide-react": "^0.309.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## tailwind.config.js

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        beige:   '#FAF7F2',
        surface: '#FFFFFF',
        border:  '#EDE8E0',
        sidebar: '#2C1810',
        cream:   '#F5ECD7',
        orange:  {
          DEFAULT: '#E8631A',
          hover:   '#C4511A',
          tint:    '#FEF0E7',
        },
        brown: {
          primary:   '#1C1410',
          secondary: '#6B5B4E',
        },
        severity: {
          critical: '#DC2626',
          high:     '#EA580C',
          medium:   '#D97706',
          low:      '#0D9488',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'pulse-slow':   'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-dot':   'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-6px)' },
        }
      }
    }
  },
  plugins: []
}
```

---

## index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  background-color: #FAF7F2;
  color: #1C1410;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #FAF7F2; }
::-webkit-scrollbar-thumb { background: #EDE8E0; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #D4C9BB; }

/* Card utility */
.card {
  background: #FFFFFF;
  border: 1px solid #EDE8E0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(28,20,16,0.06);
}

/* Severity border utilities */
.border-critical { border-left: 4px solid #DC2626; }
.border-high      { border-left: 4px solid #EA580C; }
.border-medium    { border-left: 4px solid #D97706; }
.border-low       { border-left: 4px solid #0D9488; }

/* Skeleton loader */
.skeleton {
  background: linear-gradient(90deg, #EDE8E0 25%, #FAF7F2 50%, #EDE8E0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## src/utils/helpers.js

```js
// ThreatSense — Utility helper functions
// Used across all components

// Convert ISO timestamp to relative time string
// e.g. "2026-03-19T01:45:00Z" → "2 hours ago"
export function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1)    return 'just now'
  if (diffMins < 60)   return `${diffMins}m ago`
  if (diffHours < 24)  return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Returns Tailwind color classes for severity label
// Usage: const { bg, text, border } = severityColors('CRITICAL')
export function severityColors(label) {
  const map = {
    CRITICAL: { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-500',    dot: 'bg-red-500'    },
    HIGH:     { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', dot: 'bg-orange-500' },
    MEDIUM:   { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-500',  dot: 'bg-amber-500'  },
    LOW:      { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-500',   dot: 'bg-teal-500'   },
  }
  return map[label] || map['LOW']
}

// Returns left-border class for severity
export function severityBorderClass(label) {
  const map = {
    CRITICAL: 'border-l-4 border-l-red-500',
    HIGH:     'border-l-4 border-l-orange-500',
    MEDIUM:   'border-l-4 border-l-amber-500',
    LOW:      'border-l-4 border-l-teal-500',
  }
  return map[label] || ''
}

// Returns color for log type pill
export function logTypeColors(type) {
  const map = {
    auth:       { bg: 'bg-orange-50', text: 'text-orange-700' },
    network:    { bg: 'bg-blue-50',   text: 'text-blue-700'   },
    process:    { bg: 'bg-red-50',    text: 'text-red-700'    },
    dns:        { bg: 'bg-teal-50',   text: 'text-teal-700'   },
    behavioral: { bg: 'bg-purple-50', text: 'text-purple-700' },
  }
  return map[type] || { bg: 'bg-gray-50', text: 'text-gray-700' }
}

// Truncate string with ellipsis
export function truncate(str, maxLen = 30) {
  return str?.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

// Format number with commas
export function formatNumber(n) {
  return n?.toLocaleString() ?? '0'
}

// Generate random API key for dummy data
export function generateApiKey() {
  return 'ts_live_' + Math.random().toString(36).slice(2, 18)
}
```

---

## src/data/dummyData.js

```js
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
```

---

## src/context/AuthContext.jsx

```jsx
// ThreatSense — Auth context
// Simulates logged-in state with dummy client data
// In production this would handle JWT tokens and real login API calls
// For dummy version: isAuthenticated starts true so dashboard loads immediately

import { createContext, useContext, useState } from 'react'
import { DUMMY_CLIENT } from '../data/dummyData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Set to false to test login flow, true to skip straight to dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [client, setClient] = useState(null)

  function login(email, password) {
    // Dummy login — accept any credentials
    // In production: POST /api/auth/login → get JWT → store in localStorage
    setClient(DUMMY_CLIENT)
    setIsAuthenticated(true)
  }

  function register(data) {
    // Dummy register — always succeeds
    // In production: POST /api/auth/register → get JWT + api_key
    setClient({ ...DUMMY_CLIENT, ...data })
    setIsAuthenticated(true)
  }

  function logout() {
    setClient(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, client, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

---

## Build Each File — Detailed Specs

### App.jsx
```
Wrap everything in AuthProvider.
Two route groups:
  Public routes (no layout): /login, /register
  Protected routes (with Layout): everything else
ProtectedRoute checks isAuthenticated — if false, redirect to /login.
```

### pages/auth/Login.jsx
```
Full page centered layout, beige background.
Left side (60%): large orange gradient panel with:
  ThreatSense logo (shield icon + name) in cream
  Tagline: "AI-Powered Threat Detection for Your Website"
  3 feature bullets with checkmarks:
    "Real-time threat monitoring"
    "5-agent AI analysis pipeline"
    "Claude AI powered insights"

Right side (40%): white card, centered:
  "Welcome back" heading
  "Sign in to your dashboard" subtitle in #6B5B4E
  Email input with Mail icon
  Password input with Lock icon + show/hide toggle
  "Sign in" button (full width, orange)
  "Don't have an account? Register" link → /register
  
On submit: call auth.login(email, password) → navigate to /
Show loading spinner on button while "loading" (simulate 800ms delay).
No validation required for dummy version.
```

### pages/auth/Register.jsx
```
Same split layout as Login.

Right side form:
  "Create your account" heading
  Your name input
  Email input
  Website name input (e.g. "EcomStore")
  Website URL input
  Password input
  "Create Account" button (orange, full width)
  "Already have an account? Sign in" link → /login

On submit: call auth.register(data) → navigate to /api-key-setup
```

### pages/auth/ApiKeySetup.jsx
```
Shown once after registration.
Centered card layout, beige background.

Content:
  Green checkmark circle at top
  "Your account is ready!" heading
  "Here is your unique API key. Add it to your website to start sending logs." subtitle

API key display box:
  Monospace font, beige bg, orange border
  Key text: "ts_live_k9x2mq7rtp4j8nve"
  Copy button on right (copies to clipboard, shows "Copied!" for 2 seconds)

Code snippet showing how to use it:
  Dark code block (#1C1410 bg, cream text)
  Shows fetch() call with x-api-key header

"Go to Dashboard" orange button → /
"I'll set this up later" text link → /
```

### components/layout/Sidebar.jsx
```
Fixed left sidebar, 240px wide, #2C1810 background, h-screen.

Top section:
  Logo: shield icon (orange) + "ThreatSense" text (cream, bold, 18px)
  Divider line (#3D2418)

Client info section:
  Small avatar circle (orange bg, white initials)
  Client website name (cream, 13px, bold)
  Plan badge: "PRO" pill (orange bg, white text, tiny)

Nav section (flex-col gap-1):
  Each NavItem: icon (18px) + label, padding 10px 16px, rounded-lg
  Default: #F5ECD7 text, hover: #3D2418 bg
  Active: #FEF0E7 text, #E8631A left border 3px, #3D2418 bg

Nav items:
  Dashboard     → /           LayoutDashboard icon
  Live Alerts   → /           Bell icon + red dot badge with unacknowledged count
  Log Explorer  → /logs       List icon
  Agent Monitor → /agents     Cpu icon
  Threat Map    → /map        Globe icon
  MITRE ATT&CK  → /mitre      Shield icon
  AI Chat       → /chat       MessageSquare icon + "AI" orange pill badge
  Reports       → /reports    BarChart2 icon

Bottom section:
  Settings icon + "Settings" (placeholder, no route needed)
  Logout button (LogOut icon + "Sign out", hover red tint)
  "v1.0.0" in very muted cream
```

### components/layout/Topbar.jsx
```
White background, border-bottom #EDE8E0, height 64px, px-6.
flex items-center justify-between.

Left: Current page title (dynamic — use useLocation to match route to title)
  Route title map:
    /        → "Dashboard"
    /logs    → "Log Explorer"
    /agents  → "Agent Monitor"
    /map     → "Threat Map"
    /mitre   → "MITRE ATT&CK"
    /chat    → "AI Chat"
    /reports → "Reports"

Right (flex gap-4 items-center):
  Green pulsing dot + "5 agents active" text (small, #6B5B4E)
  Divider
  Bell icon (relative) with red badge showing unacknowledged alert count
  Divider
  Client website name + small avatar circle (orange, white initials)
```

### components/alerts/SeverityBadge.jsx
```
Props: label (string), size ("sm"|"md"|"lg")

Pill shape (rounded-full), border, font-medium.
sm: text-xs px-2 py-0.5
md: text-sm px-3 py-1  (default)
lg: text-base px-4 py-1.5

Colors (bg/text/border):
  CRITICAL: bg-red-50    text-red-600    border-red-200
  HIGH:     bg-orange-50 text-orange-600 border-orange-200
  MEDIUM:   bg-amber-50  text-amber-600  border-amber-200
  LOW:      bg-teal-50   text-teal-600   border-teal-200

Include colored dot before text (4px circle, filled with severity color).
```

### components/alerts/AlertCard.jsx
```
Props: alert (object), compact (boolean, default false)

FULL CARD (compact=false):
  white bg, EDE8E0 border, 12px radius, shadow-sm
  Left border 4px colored by severity
  animate-fade-in-down on mount
  hover: shadow-md, translateY(-1px), transition-all 150ms

  Top row: SeverityBadge + attack_classification (font-semibold) + timeAgo(created_at) gray right
  Middle: affected_entities as small gray pills (bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5)
  Bottom row:
    Left: "Score: {severity_score}/10" in monospace, colored by severity
    Right: "View Details →" Link to /alerts/:id, orange text, hover underline
  If acknowledged: small green "✓ Acknowledged" badge top-right

COMPACT (compact=true):
  horizontal flex, py-3 px-4, hover bg-orange-50 cursor-pointer
  Left: colored dot (8px) + classification text + affected entity
  Right: SeverityBadge (sm) + timeAgo
  Click navigates to /alerts/:id
  Bottom border #EDE8E0 (list separator)
```

### components/alerts/AlertFeed.jsx
```
Props: none (uses DUMMY_ALERTS internally)

Header row: "Live Alert Feed" (font-semibold) + pulsing green dot + "Live" text (green, text-xs)

Scrollable list (max-height 400px, overflow-y-auto):
  DUMMY_ALERTS sorted by created_at descending
  Each: AlertCard in compact mode
  
Empty state: Shield icon (gray, 32px) + "No alerts detected" text centered

Below list: "Showing {count} alerts" in gray text-xs
```

### pages/Dashboard.jsx
```
Page title: "Dashboard" + "Welcome back, {client.website_name}" subtitle

TOP ROW — 4 stat cards (grid-cols-4 gap-4):

  Card 1 — Critical Alerts:
    Left: red circle with AlertTriangle icon (white)
    Right: big number (red, text-3xl font-bold) + "Critical Alerts" label
    Bottom: small trend text "↑ 1 from yesterday" in red

  Card 2 — High Alerts:
    Left: orange circle with AlertOctagon icon
    Right: count + "High Alerts"
    Bottom: "↑ 2 from yesterday" orange

  Card 3 — Logs Today:
    Left: blue circle with Activity icon
    Right: formatNumber(logs_today) + "Logs Processed"
    Bottom: "↑ 12% from yesterday" blue

  Card 4 — Agents Active:
    Left: green circle with Cpu icon
    Right: "5/5" + "Agents Active"
    Bottom: green dot + "All systems operational"

MIDDLE ROW — two columns (grid grid-cols-5 gap-6):

  Left col (col-span-3): AlertFeed component

  Right col (col-span-2):
    Top card — SeverityGauge:
      Show current max severity as a semicircular arc gauge
      Use SVG: draw a semicircle arc, fill colored section based on score
      Center: large score number (colored) + severity label below
      Label below arc: "Current Threat Level"

    Bottom card — AlertsOverTime:
      Title: "Alerts (Last 24 Hours)"
      Recharts BarChart, height 180px
      Data: DUMMY_STATS.alerts_by_hour
      Bar fill: #E8631A
      XAxis: hour labels, YAxis: count
      Tooltip: custom styled (white bg, EDE8E0 border)

BOTTOM ROW — full width card:
  Title: "Alert Types Today"
  ThreatTypeBar: Recharts BarChart horizontal
  Data: DUMMY_STATS.alerts_by_type
  Bars fill: #E8631A
  Height: 200px
```

### pages/AlertDetail.jsx
```
Route: /alerts/:id
Find alert: DUMMY_ALERTS.find(a => a._id === id)
If not found: "Alert not found" with back button

Back button: "← Back to Alerts" orange text link at top

HERO SECTION (bg-gradient from #FEF0E7 to white, rounded-card, border, p-8 mb-6):
  Top row: monospace gray "ALERT-{id}" + SeverityBadge(lg) + acknowledged badge (if true)
  Big heading: attack_classification (text-3xl font-bold #1C1410)
  Row: severity score "9.2 / 10" in large colored text + MITRE count + timestamp
  Affected entities as pills

AI ANALYSIS CARD (white card, orange left border 4px):
  Header: sparkle icon (orange) + "AI Analysis" + "Powered by Claude" small pill
  Paragraph: attack_narrative (text-base leading-relaxed #1C1410)

TIMELINE CARD:
  Title: "Event Timeline"
  Vertical timeline:
    Left line: 2px #EDE8E0 border
    Each event:
      Colored dot on line (color by agent: Network=blue, Auth=orange, Malware=red, Behavioral=teal)
      Timestamp (monospace, gray, text-sm)
      Event description (text-sm #1C1410)
      Agent badge (small pill, same color as dot)

AGENT FINDINGS (grid grid-cols-2 gap-4):
  Title: "Agent Findings" above grid

  Each of 4 cards:
    Top border 3px: Network=blue, Auth=orange, Malware=red, Behavioral=teal
    Header: agent icon + agent name + confidence score right-aligned
    Confidence bar: full-width progress bar (orange fill, #EDE8E0 track, h-2, rounded)
    Anomaly flags: orange pills (bg-orange-50 text-orange-700 border-orange-200 text-xs rounded px-2)
    If anomaly_flags empty: green checkmark + "No anomalies detected" text
    Key data: source_ip or user_id or process_name or entity_id (monospace, gray)

MITRE TECHNIQUES:
  Title: "MITRE ATT&CK Techniques Detected"
  Horizontal scroll row of cards:
    Each card: white bg, EDE8E0 border, hover orange border, rounded-lg p-4 cursor-pointer
    Technique ID: monospace orange text-sm font-bold
    Technique name: text-sm font-medium #1C1410
    Tactic: gray pill text-xs
    External link icon — onClick: window.open(url)

RECOMMENDED ACTIONS:
  Title: "Recommended Actions"
  White card, numbered list:
    Number: orange circle with white number
    Action text: #1C1410

BOTTOM ROW (flex justify-between items-center):
  Affected entities: small gray pills
  Acknowledge button: orange if not acknowledged, green with checkmark if acknowledged
    onClick: toggle acknowledged state locally
```

### pages/LogExplorer.jsx
```
Page title: "Log Explorer" + "Raw logs from your website" subtitle

FILTER BAR (white card, flex gap-4 flex-wrap mb-6):
  Log Type select: All / Auth / Network / Process / DNS / Behavioral
  Status select: All / Flagged / Normal / Pending / Failure
  Search input (flex-1): placeholder "Search IP, user, command..." with Search icon
  All filters: #FAF7F2 bg, #EDE8E0 border, orange focus ring, rounded-lg
  Live badge: pulsing orange dot + "Live" text right-aligned

TABLE (white card):
  Headers: Timestamp | Log Type | Source IP | User ID | Status | Actions
  Sticky header, dividers between rows (#EDE8E0)
  
  Each row:
    Timestamp: monospace text-sm #6B5B4E
    Log Type: colored pill using logTypeColors()
    Source IP: monospace text-sm
    User ID: text-sm (dash if null)
    Status pill: flagged=orange, normal=green, failure=red, pending=amber
    Actions: "View" text button (orange, appears on row hover)
  
  Click row: expands inline below that row
    Shows raw_payload as pretty JSON
    Code block: #FAF7F2 bg, #EDE8E0 border, rounded, p-4, monospace text-sm, max-h-48 overflow-auto
    Close with X button

  Empty state: centered icon + "No logs match your filters"

PAGINATION (flex justify-between items-center mt-4):
  "Showing 1-10 of 10 logs" text gray
  Previous / Next buttons: white bg orange border orange text, disabled state gray
  Page number pill: orange bg white text
```

### pages/AgentMonitor.jsx
```
Page title: "Agent Monitor" + "Real-time agent pipeline status" subtitle

PIPELINE VISUALIZER (white card, mb-6):
  Title: "Processing Pipeline"
  
  Visual layout using flexbox divs (no SVG library):
  
  [LOG IN] →→ [SUPERVISOR] →→→ [NETWORK AGENT  ] ┐
                                [AUTH AGENT     ] ├→→ [EXPLAINER] →→ [ALERT OUT]
                                [MALWARE AGENT  ] │
                                [BEHAVIORAL AGNT] ┘

  Box styles:
    Default: white bg, #EDE8E0 border, rounded-lg, p-3, text-center, text-sm font-medium
    LOG IN / ALERT OUT: #FAF7F2 bg, dashed border, gray text
    SUPERVISOR: #2C1810 bg, cream text, rounded-lg
    Agent boxes: white bg, left border 3px colored by agent type
    EXPLAINER: orange bg tint (#FEF0E7), orange border, orange text
    
  "Processing" state: orange pulsing border animation (ring-2 ring-orange-400 ring-opacity-50)
  Arrows: orange colored text "→" or "↓" between boxes

4 AGENT CARDS (grid grid-cols-2 gap-4):
  Each card (white bg, EDE8E0 border, 12px radius):
    Header: colored icon + agent name + status badge right
    Status badge: "Active" green, "Idle" gray, "Processing" orange pulsing
    
    Stats row (grid grid-cols-2 gap-2 mt-3):
      "Findings Today" | count (orange, font-bold)
      "Avg Confidence" | percentage
    
    Top anomaly flag: orange pill below stats
    
    Confidence bar: full width, orange fill, #EDE8E0 track
    
    Footer: "Last active: {timeAgo}" gray text-xs | "{avg_processing_ms}ms avg" monospace right

RECENT FINDINGS (white card):
  Title: "Recent Findings"
  Filter tabs: All | Network | Auth | Malware | Behavioral
    Active tab: orange text + orange bottom border 2px
    Inactive: gray text, hover orange
  
  Table:
    Session ID (monospace truncated) | Agent | Anomaly Flags | Confidence | Time
    Agent colored pill | Flags as small orange pills | Confidence % | timeAgo
```

### pages/ThreatMap.jsx
```
Page title: "Threat Map" + "Geographic origin of threats" subtitle

TIME FILTER TABS (below title, before map):
  1h | 6h | 24h | 7d
  Active: orange bg, white text, rounded
  Inactive: white bg, gray text, border

MAP CARD (white card, p-0 overflow-hidden rounded-card):
  react-simple-maps ComposableMap:
    width 800, height 400
    projection: "geoMercator"
    Geography fill: #EDE8E0, stroke: #FAF7F2, strokeWidth 0.5
    Background: #FAF7F2
  
  Markers from DUMMY_THREAT_MAP:
    Circle, radius proportional to alert_count (min 8, max 20)
    Fill by severity: CRITICAL=#DC2626, HIGH=#EA580C, MEDIUM=#D97706, LOW=#0D9488
    Opacity 0.8, stroke white strokeWidth 2
    
    On hover: tooltip div showing:
      White card, shadow, p-3, rounded-lg
      Country + city name (bold)
      Alert count + top severity badge
    
    On click: set selectedMarker state

SIDE PANEL (slides in from right when marker selected):
  Position: fixed right-0, white bg, border-l, shadow-xl, w-80, h-full, p-6
  Close X button top right
  Country flag emoji + country name heading
  City + alert count
  List of DUMMY_ALERTS filtered where affected_entities includes IP from that location
  Each: AlertCard compact mode
  Empty: "No detailed alerts for this location"

STATS ROW (white card, grid-cols-3, mt-4):
  Source countries: 5
  Total flagged IPs: 8
  Most active origin: Russia (2 alerts)
```

### pages/MitreView.jsx
```
Page title: "MITRE ATT&CK" + "Techniques detected in your environment" subtitle

STATS BAR (flex gap-6 mb-6):
  "8 techniques detected" (orange number)
  "across 7 tactics"
  "Most active: Credential Access"
  All as separate small white cards with icon + text

MATRIX (white card, overflow-x-auto):
  Group MITRE_TECHNIQUES by tactic → columns
  
  Tactics header row:
    Each tactic: dark bg (#2C1810), cream text, font-semibold, text-sm, p-3, text-center, min-w-36
  
  Techniques below each tactic:
    Detected: bg-orange-50, border-orange-300 border, rounded-lg, p-3, m-1, cursor-pointer
      Technique ID: text-orange-600 font-mono text-xs font-bold
      Technique name: text-sm text-brown-primary font-medium
    
    Not detected: bg-gray-50 border-gray-200 border rounded-lg p-3 m-1 opacity-50
      Same layout but gray text, no hover effects
    
    Click detected technique:
      Small popover above the card:
        White card, shadow-lg, border, rounded-lg, p-4, z-50
        Technique ID + name
        Tactic label
        "Triggered by:" + alert IDs as orange links → /alerts/:id
        "View on MITRE →" external link (opens attack.mitre.org URL)
        Close on click outside
```

### pages/Chat.jsx
```
Page takes full height (h-full flex flex-col).

HEADER (white bg, border-bottom, px-6 py-4, flex justify-between):
  Left: shield icon (orange) + "ThreatSense AI" bold + "Powered by Claude" orange pill
  Right: "Clear chat" button (ghost style, gray text, hover red tint)

MESSAGES AREA (flex-1, overflow-y-auto, px-6 py-4, bg-beige):
  
  EMPTY STATE (centered, show when messages=[]):
    Large shield icon (orange, 48px)
    "Ask me anything about your threats" heading
    "I have access to all your alerts, logs, and agent findings" subtitle gray
    SuggestedPrompts component below

  MESSAGES LIST:
    Each ChatMessage component
    Auto-scroll to bottom on new message
    
  TYPING INDICATOR (when isTyping=true):
    Left-aligned, same position as AI messages
    Small shield avatar + 3 bouncing dots (animate-bounce-dot with staggered delays)

INPUT AREA (sticky bottom, white bg, border-top #EDE8E0, px-6 py-4):
  flex gap-3
  Textarea (flex-1): #FAF7F2 bg, #EDE8E0 border, rounded-xl, p-3, resize-none, rows=1
    Auto-expand to max 4 rows as user types
    Placeholder: "Ask about threats, alerts, or request a summary..."
    Enter to send, Shift+Enter for newline
    Orange focus ring
  Send button: orange bg, white SendHorizontal icon, rounded-xl, p-3
    Disabled (gray) when input empty or isTyping

CHAT SIMULATION LOGIC:
  On send:
    1. Add user message to messages
    2. Clear input
    3. Set isTyping=true for 1500ms
    4. Then set isTyping=false, start "streaming"
    5. Pick response: if message includes "critical" → DUMMY_CHAT_RESPONSES.critical
                      if includes "user" → DUMMY_CHAT_RESPONSES.user
                      if includes "summary" or "manager" → DUMMY_CHAT_RESPONSES.summary
                      else → DUMMY_CHAT_RESPONSES.default
    6. Word-by-word append to AI message every 40ms (simulate streaming)
    7. When done: stop streaming

ChatMessage.jsx:
  User: right-aligned, #E8631A bg, white text, rounded-l-2xl rounded-tr-2xl, max-w-xs
  AI: left-aligned with shield avatar (dark brown circle, cream icon), white card border, rounded-r-2xl rounded-tl-2xl, max-w-lg
  Parse AI text: replace "ALERT-alert_XXX" with orange underlined Link to /alerts/alert_XXX
  Timestamp: text-xs gray below bubble

SuggestedPrompts.jsx:
  grid grid-cols-2 gap-3, max-w-lg mx-auto
  Each chip: white bg, EDE8E0 border, rounded-xl, p-4, cursor-pointer, flex gap-3 items-start
    hover: bg-orange-50 border-orange-300 transition-all 150ms
    Icon (lucide, 16px, text-orange-500) + text (text-sm text-brown-primary)
  onClick: fires the prompt text as a message
```

### pages/Reports.jsx
```
Page title: "Reports" + "Weekly security summary for EcomStore" subtitle

SUMMARY CARDS ROW (grid-cols-4 gap-4 mb-6):
  Total Alerts: 12 | Critical Incidents: 2 | Avg Severity: 6.1 | Resolved: 9 of 12
  Each card: white, border, icon + number (bold orange) + label

TWO COLUMN ROW (grid-cols-2 gap-6 mb-6):
  Left card — "Alerts by Severity" (PieChart Recharts):
    Height 250px
    Colors: CRITICAL=#DC2626, HIGH=#EA580C, MEDIUM=#D97706, LOW=#0D9488
    Legend below: each color dot + label + count
    Custom tooltip: white card, EDE8E0 border

  Right card — "Most Common Attack Types" (BarChart horizontal):
    Height 250px
    Data: DUMMY_STATS.alerts_by_type
    Bar fill: #E8631A
    XAxis: count, YAxis: attack type labels

TOP ALERTS THIS WEEK (white card, mb-6):
  Title: "Top Critical Alerts This Week"
  First 2 alerts from DUMMY_ALERTS in full AlertCard mode

TABLES ROW (grid-cols-2 gap-6):
  Left card — "Most Targeted Users":
    Table: User ID | Alert Count | Last Seen | Risk Level
    Rows: user_42 (2, 2h ago, CRITICAL), user_15 (1, 11h ago, MEDIUM), user_33 (1, 15h ago, LOW)
    Risk level as SeverityBadge

  Right card — "Top Source IPs":
    Table: IP Address | Country | Alerts | Top Severity
    Rows from DUMMY_THREAT_MAP data
    IP in monospace font
    Top severity as SeverityBadge

AGENT PERFORMANCE (white card):
  Title: "Agent Performance This Week"
  Recharts RadialBarChart height 250px:
    Each agent: colored bar, findings_today value
    Colors: Network=blue, Auth=orange, Malware=red, Behavioral=teal
  Legend: agent name + findings count
```

---

## Build Order for Copilot

Follow this sequence exactly. Each file depends on the previous ones.

```
1.  package.json + vite.config.js + tailwind.config.js + postcss.config.js
2.  src/index.css
3.  src/data/dummyData.js
4.  src/utils/helpers.js
5.  src/context/AuthContext.jsx
6.  src/hooks/useAuth.js
7.  src/components/auth/ProtectedRoute.jsx
8.  src/App.jsx
9.  src/main.jsx
10. src/components/layout/Sidebar.jsx
11. src/components/layout/Topbar.jsx
12. src/components/layout/Layout.jsx
13. src/pages/auth/Login.jsx
14. src/pages/auth/Register.jsx
15. src/pages/auth/ApiKeySetup.jsx
16. src/components/alerts/SeverityBadge.jsx
17. src/components/alerts/AlertCard.jsx
18. src/components/alerts/AlertFeed.jsx
19. src/components/charts/AlertsOverTime.jsx
20. src/components/charts/SeverityGauge.jsx
21. src/components/charts/ThreatTypeBar.jsx
22. src/pages/Dashboard.jsx
23. src/pages/AlertDetail.jsx
24. src/pages/LogExplorer.jsx
25. src/components/agents/AgentCard.jsx
26. src/components/agents/AgentPipeline.jsx
27. src/pages/AgentMonitor.jsx
28. src/pages/ThreatMap.jsx
29. src/pages/MitreView.jsx
30. src/components/chat/SuggestedPrompts.jsx
31. src/components/chat/ChatMessage.jsx
32. src/components/chat/ChatWindow.jsx
33. src/pages/Chat.jsx
34. src/pages/Reports.jsx
```

---

## Copilot Tips

- Open this README.md in a split pane while working on every file
- Write a comment block at the top of each new file summarizing its purpose before letting Copilot generate
- If Copilot goes off-track, type the first few lines manually — it will follow your lead
- For Recharts: type the import line first, Copilot will autocomplete the correct component structure
- For Tailwind: type `className="` and describe what you want in a comment above — Copilot picks the right classes
- All colors are in tailwind.config.js as custom names — use `bg-orange-DEFAULT`, `text-brown-primary`, `bg-beige` etc.
