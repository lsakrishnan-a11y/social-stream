# Digital Seva CRM — eServai

A complete Customer Relationship Management system for **Digital Seva / eServai** government service centers (Common Service Centers), built for Tamil Nadu and India digital service operations.

## Features

- **Dashboard** — Live stats: total applications, pending, completed, revenue, service-wise bar charts, monthly revenue trends
- **Applications** — Submit, track, and update government service applications with status workflow (Pending → Processing → Completed)
- **Citizens** — Register and manage citizen profiles with Aadhaar, phone, address, and full application history
- **Services** — Manage 20+ government services across departments (Revenue, Transport, UIDAI, Social Welfare, TNEB, etc.) with Tamil names, fees, processing time
- **Operators / Centers** — Manage CSC (Common Service Center) operators with per-center performance statistics

## Supported Government Services

Birth/Death Certificates, Income Certificate, Community Certificate, Ration Card, Aadhaar Enrollment/Update, PAN Card, Passport Assistance, Driving Licence, Land Records (Patta/Chitta), Electricity/Water Bill Payments, Property Tax, Old Age/Widow Pensions, Disability Certificate, and more.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Styling | Pure CSS (no frameworks) |

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (port 5000)
cd backend && node server.js

# Start frontend dev server (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

```
GET  /api/dashboard/stats
GET  /api/dashboard/recent-applications
GET  /api/dashboard/service-stats
GET  /api/dashboard/monthly-stats

GET  /api/citizens
POST /api/citizens
PUT  /api/citizens/:id
GET  /api/citizens/:id

GET  /api/applications
POST /api/applications
GET  /api/applications/:id
PUT  /api/applications/:id/status
PUT  /api/applications/:id/payment

GET  /api/services
POST /api/services
PUT  /api/services/:id

GET  /api/operators
POST /api/operators
GET  /api/operators/:id
PUT  /api/operators/:id
```

## Project Structure

```
social-stream/
├── backend/
│   ├── server.js           # Express app
│   ├── db/database.js      # SQLite setup + seed data
│   └── routes/
│       ├── dashboard.js
│       ├── citizens.js
│       ├── applications.js
│       ├── services.js
│       └── operators.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/index.js
        ├── components/Sidebar.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Citizens.jsx
            ├── Applications.jsx
            ├── Services.jsx
            └── Operators.jsx
```
