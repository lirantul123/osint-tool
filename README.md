# OSINT Toolkit

A modular **Open Source Intelligence** platform for digital reconnaissance, footprinting, and investigation. One unified search handles IPs, domains, emails, usernames, and people — with session analytics and charts in a separate Statistics panel.

```
   ┌─────────────┐     ┌──────────────────────────────────┐
   │  React UI   │────▶│  Express API (9 OSINT modules)   │
   │  Dashboard  │     │  IP · Domain · DNS · Subdomains  │
   │  Investigate│     │  Email · Username · People       │
   │  Statistics │     └──────────┬───────────────────────┘
   └─────────────┘                │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
         ip-api.com          crt.sh / DNS        GitHub, Reddit,
         WHOIS / MX          Certificate         Dev.to, HN, etc.
                             Transparency
```

## UI Overview

| Page | Purpose |
|------|---------|
| **Dashboard** | Entry point — links to Investigate and Statistics |
| **Investigate** | Unified search with two modes: **Target** (IP, domain, email, username) and **Person** (full name) |
| **Statistics** | Charts, trends, and search history from your local sessions (stored in the browser) |

All former standalone tools (IP Lookup, Domain, DNS, Subdomains, Email, Username) are consolidated into **Investigate → Target mode**, which auto-detects the input type and runs the relevant modules. Legacy routes (`/ip`, `/domain`, `/people`, etc.) redirect to Investigate.

## Features

| Module | What it does |
|--------|-------------|
| **Auto Investigate** | Detects target type and runs all relevant modules in parallel |
| **IP Geolocation** | Country, city, ISP, ASN, proxy/VPN/hosting flags, reverse DNS |
| **Domain Intel** | WHOIS registration, IP resolution, HTTP server fingerprint |
| **DNS Records** | Full sweep: A, AAAA, MX, TXT, NS, CNAME, SOA |
| **Subdomain Enum** | Certificate Transparency logs via crt.sh |
| **Email Intelligence** | MX validation, Gravatar, reputation & breach indicators |
| **Username Search** | Prefix search on GitHub, then cross-checks Reddit, Dev.to, HN, Keybase, GitLab, Medium, Pinterest — **50 results per page**, paginated (up to 1,000 GitHub logins) |
| **People Intelligence** | Name search — Wikipedia/Wikidata enrichment, username variant probing, profile discovery, and one-click search links (LinkedIn, Facebook, Instagram, X, Reddit, GitHub, Medium, Dev.to, Hacker News, Twitch, Flickr, Stack Overflow). Supports English and Hebrew names. |
| **Statistics** | Bar chart by target type, search-mode donut, 7-day activity timeline, recent searches table |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone <repo-url> osint-tool
cd osint-tool
npm install
npm run install:all

# Start both backend (port 3001) and frontend (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note:** After pulling updates, restart `npm run dev` so the backend picks up new API behavior (e.g. username pagination).

### Run Separately

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Frontend UI
cd frontend && npm run dev
```

### Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Share with others

| Approach | Best for |
|----------|----------|
| **GitHub + `npm run dev`** | Friends who can run Node locally |
| **Docker** | One-command setup (`docker compose up --build`) |
| **Deploy online** (Render, Railway, Fly.io, VPS) | Send a URL — no install needed |
| **ngrok** (`ngrok http 5173`) | Quick temporary demo from your machine |

## API Reference

All endpoints accept `POST` with JSON body and return a unified response envelope:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-12T12:00:00.000Z"
}
```

| Endpoint | Body | Description |
|----------|------|-------------|
| `GET /api/health` | — | Health check & module list |
| `POST /api/ip` | `{ "ip": "8.8.8.8" }` | IP geolocation |
| `POST /api/domain` | `{ "domain": "example.com" }` | WHOIS + DNS + HTTP headers |
| `POST /api/dns` | `{ "domain": "example.com" }` | Full DNS record enumeration |
| `POST /api/subdomain` | `{ "domain": "example.com" }` | Subdomain discovery via CT logs |
| `POST /api/email` | `{ "email": "user@example.com" }` | Email validation & reputation |
| `POST /api/username` | `{ "username": "johndoe" }` | Multi-platform username search |
| `POST /api/investigate` | `{ "target": "...", "page?": 1 }` | Auto-detect & run modules; `page` applies to username prefix results |
| `POST /api/people` | `{ "name": "John Smith" }` | Person investigation & digital footprint |

### Examples

```bash
# Domain investigation
curl -X POST http://localhost:3001/api/investigate \
  -H "Content-Type: application/json" \
  -d '{"target": "example.com"}'

# Username prefix — page 2
curl -X POST http://localhost:3001/api/investigate \
  -H "Content-Type: application/json" \
  -d '{"target": "liran", "page": 2}'

# Person search
curl -X POST http://localhost:3001/api/people \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith"}'
```

## Project Structure

```
osint-tool/
├── backend/
│   └── src/
│       ├── index.ts              # Express server
│       ├── routes/               # API route handlers
│       ├── services/             # OSINT logic & external API calls
│       ├── middleware/           # Error handling
│       ├── types/                # Shared response types
│       └── utils/                # Input validators (incl. Hebrew names)
├── frontend/
│   └── src/
│       ├── api/                  # Axios client
│       ├── components/           # Layout, charts, pagination, result cards
│       ├── lib/                  # Investigation history (localStorage)
│       └── pages/                # Dashboard, Investigate, Statistics
├── docker-compose.yml
└── package.json                  # Root scripts (run both servers)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port (5000 conflicts with macOS AirPlay) |
| `VITE_API_URL` | `/api` | Frontend API base URL (set for production) |

Copy `backend/.env.example` to `backend/.env` to customize.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Node.js, Express 5, TypeScript
- **Data Sources:** ip-api.com, WHOIS, Node DNS, crt.sh, emailrep.io, Gravatar, GitHub/Reddit/Dev.to/HN/Keybase/GitLab APIs, Wikipedia/Wikidata

## Responsible Use

This tool is intended for **authorized security research**, CTF challenges, bug bounty reconnaissance, and legitimate investigations only.

- Only investigate targets you own or have explicit permission to test
- Respect platform Terms of Service and rate limits
- Comply with applicable privacy and computer fraud laws (CFAA, GDPR, etc.)
- Do not use this tool for harassment, stalking, or unauthorized access

## License

ISC
