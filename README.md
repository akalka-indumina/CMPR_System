# Integrated Community Safety and Police Complaint Management System

Frontend demo (React + Vite + Tailwind CSS + React Router + Lucide). Production authentication and a production backend are not included. Demo data remains in browser localStorage (`pcms-demo-data-v1`) and is shared between the development portals by a local Vite middleware bridge.

## Run

```bash
npm install
npm run dev      # Citizen: http://localhost:5173, Staff: http://localhost:5174
npm run dev:citizen
npm run dev:staff
npm run build    # production build in dist/
```

`npm run dev` starts both Vite servers and stops both if either server exits. Use the individual scripts to run one portal:

| Portal | Root URL | Roles |
|---|---|---|
| Public Citizen Portal | `http://localhost:5173/` | Citizen |
| Police Staff Portal | `http://localhost:5174/` | Super Administrator, Police Station Account, Police Officer |

Citizen applications start at `/register`; application status is available at `/registration-status/<reference>` on port 5173. New applicants remain pending until a Super Administrator reviews and approves the application; rejected applicants can correct and resubmit it. Staff dashboard routes remain under `/staff/<role>/<page>` and Citizen routes under `/citizen/<page>`, e.g. `/staff/admin/dash`, `/staff/station/validation`, `/staff/officer/mine`, `/citizen/submit`. These routes are protected by the portal mode and do not expose the other portal's login or registration UI.

The two login flows verify credentials only against their own account types. Approved Citizens can sign in only on port 5173; staff roles are resolved from the verified account only on port 5174. Sessions use browser `sessionStorage` and remain isolated by port. For development, a Vite middleware bridge shares the existing app data between both origins through `node_modules/.cache/pcms-demo/shared-data.json`; each portal also keeps its localStorage cache. The bridge initializes from existing local data when first opened and synchronizes updates while both portals are running.

The registration form supports either an NIC (9 digits plus V/X, or 12 digits) or a Driving Licence (5–20 letters and digits) and collects one identity number for the selected type. Gender choices are Male and Female. Addresses use a required dropdown containing all 25 Sri Lankan districts; the chosen district is retained in the application, admin review, and approved Citizen profile. Dashboard headers include a light/dark theme toggle; the preference is saved in this browser. The notification bell opens a compact, role-scoped popover; notifications are no longer a sidebar page.

This is a demonstration only. Use fictional information and do not upload real identity documents. Registration text and password hashes are stored in localStorage and the shared development data file. In development, uploaded document images are stored in the local development cache so the Staff Portal can review them, and are removed after approval or rejection. This local cache is not secure document storage. Identity verification, secure storage, and production authentication require a protected backend.

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
    ├── auth/                 # Portal-scoped Login, citizen registration, and status
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
