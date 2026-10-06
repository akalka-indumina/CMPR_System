# ICCMPRS Web (Next.js)

Integrated Community Complaint Management and Police Response System —
login page, Admin dashboard and Police Station dashboard.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4

## Setup

```bash
npm install
npm run dev        # (uses webpack) http://localhost:3000
```

Production: `npm run build && npm start`

Requires Node.js 20.9 or newer.

## Routes

| URL         | What it shows               |
| ----------- | --------------------------- |
| `/`         | Login (Admin / Police Station tabs) |
| `/admin`    | Admin dashboard             |
| `/station`  | Police Station dashboard    |

Login is currently a **UI mock**: any non-empty ID/password sends the Admin tab
to `/admin` and the Police Station tab to `/station`.

## Next steps

- Real authentication (e.g. Auth.js, or your PHP/MySQL API) and a `middleware.ts`
  that protects `/admin` and `/station` by role.
- Split each dashboard's internal pages into real routes (`/admin/stations`, ...).
- Replace the hard-coded demo data with API calls.
