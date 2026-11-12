# Integrated Community Safety and Police Complaint Management System

Frontend-only demo (React + Vite + Tailwind CSS + React Router + Lucide). All data is mock data held in React state; there is no backend or real authentication.

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

Citizen registration is at `/public/register`. Dashboards follow `/<portal>/<role>/<page>`, e.g. `/staff/station/validation`, `/public/officer/mine`, `/public/citizen/submit`. A role cannot open the other portal's pages; it is sent back to that portal's login.

## Structure

```
src/
├── main.jsx                  # entry: BrowserRouter + <App/>
├── App.jsx                   # app state, route handling, sidebar/header shell
├── index.css                 # Tailwind layers + base styles
├── routes/pages.js           # role -> page-key -> component registry
├── lib/
│   ├── constants.js          # statuses, colours, NAV per role, shared class strings
│   ├── helpers.js            # grouping/filter helpers (grp, gb, mine, on)
│   └── h.js                  # htm template helper bound to React
├── data/                     # mock data (stations, officers, accounts, complaints, audit, users)
├── components/
│   ├── ui/                   # Badge, Primitives (Card, Modal, forms), Table, Charts, Icon
│   └── complaints/           # ComplaintTable, ComplaintModal (workflow), Timeline
└── features/
    ├── auth/                 # Landing (portal chooser), Login (per portal), Register
    ├── admin/                # Super Administrator pages
    ├── station/              # Station Account pages
    ├── officer/              # Police Officer pages
    ├── citizen/              # Citizen portal pages
    └── shared/               # Notifications, Profile
```

## Role rules enforced in the UI

- Citizens see only their own complaints; officers only complaints assigned to them.
- Station accounts see only their station and can assign only to officers of the same station.
- Officers can save progress or send work for review, but cannot close a complaint.
- Only station accounts perform the final closure. Audit logs are read-only.
