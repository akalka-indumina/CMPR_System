# Integrated Community Safety and Police Complaint Management System

Frontend-only demo (React + Vite + Tailwind CSS + React Router + Lucide). There is no backend or production authentication. Shared demo data is stored in this browser's localStorage (`pcms-demo-data-v1`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Open `/` and choose a portal. There are two separate portals, each with its own login page:

| Portal | Login URL | Roles |
|---|---|---|
| Staff Administration Portal | `/staff/login` | Super Administrator, Police Station Account |
| Citizen and Officer Portal | `/public/login` | Citizen, Police Officer |

Citizen applications start at `/public/register`. New applicants remain pending until a Super Administrator reviews and approves the application; rejected applicants can correct and resubmit it. Applicants can check their status using the application reference. Dashboards follow `/<portal>/<role>/<page>`, e.g. `/staff/station/validation`, `/public/officer/mine`, `/public/citizen/submit`.

The registration form uses the applicant's NIC and does not collect a separate document number. Dashboard headers include a light/dark theme toggle; the preference is saved in this browser. The notification bell opens a compact, role-scoped popover; notifications are no longer a sidebar page.

This is a demonstration only. Use fictional information and do not upload real identity documents. Registration text and password hashes are stored in localStorage, but uploaded document images are kept in temporary browser memory only and are unavailable after a refresh or browser restart. Identity verification, secure document storage, and production authentication require a protected backend.

## Structure

```
src/
├── main.jsx                  # entry: BrowserRouter + <App/>
├── App.jsx                   # app state, route handling, sidebar/header shell
├── index.css                 # Tailwind layers + base styles
├── routes/pages.js           # role -> page-key -> component registry
├── lib/
│   ├── appData.js            # localStorage loading, validation, and persistence
│   ├── constants.js          # statuses, colours, NAV per role, shared class strings
│   ├── credentials.js        # demo password hashing and verification
│   ├── helpers.js            # grouping/filter helpers (grp, gb, mine, on)
│   ├── registration.js       # application statuses, references, and document helpers
│   └── h.js                  # htm template helper bound to React
├── data/                     # mock data (stations, officers, accounts, complaints, audit, users)
├── components/
│   ├── ui/                   # Badge, Primitives (Card, Modal, forms), Table, Charts, Icon
│   └── complaints/           # ComplaintTable, ComplaintModal (workflow), Timeline
└── features/
    ├── auth/                 # Landing, role-scoped Login, registration, and status
    ├── admin/                # Super Administrator pages and Citizen registration review
    ├── station/              # Station Account pages
    ├── officer/              # Police Officer pages
    ├── citizen/              # Citizen portal pages
    └── shared/               # Notification popover, Profile
```

## Role rules enforced in the UI

- Citizens see only their own complaints; officers only complaints assigned to them.
- Station accounts see only their station and can assign only to officers of the same station.
- Officers can save progress or send work for review, but cannot close a complaint.
- Only station accounts perform the final closure. Audit logs are read-only.
