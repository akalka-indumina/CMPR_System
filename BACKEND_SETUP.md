# Backend setup (Express + MongoDB) - beginner guide

## What changed, in plain words

Before: the website saved everything inside your browser, so nothing was really shared.

Now there are 3 programs. You start them, and they talk to each other:

```
 Browser (React website)  -->  Express server (server/ folder)  -->  MongoDB (the database)
   port 5173 / 5174              port 5000                           port 27017
```

- **MongoDB** = the database. It stores the data safely on your computer.
- **Express** = a small program that sits between the website and MongoDB. The website asks Express for data, Express reads or writes MongoDB.
- Your React website now asks Express (through `/api/...`) instead of using the browser's storage.

## One-time setup

### 1. Install MongoDB
1. Go to https://www.mongodb.com/try/download/community and download **MongoDB Community Server** (Windows -> MSI).
2. Run the installer. Choose **Complete**. Keep **"Install MongoDB as a Service"** ticked (so it starts by itself).
3. Keep **"Install MongoDB Compass"** ticked. Compass is a free window where you can see your data.

That is all. You do not need to create anything inside MongoDB - the database `cmpr` is created automatically.

### 2. Install the packages
Open a terminal in the project folder and run:

```
cd server
npm install
cd "../CMPR_System web"
npm install
```

## Every day: start the project

Use **one** terminal:

```
cd "CMPR_System web"
npm run dev:all
```

You should see:
- `Connected to MongoDB (database "cmpr")`
- `CMPR API running at http://localhost:5000`
- the two website addresses (5173 and 5174)

Open:
- Citizen portal: http://localhost:5173
- Police staff portal: http://localhost:5174

There are no built-in accounts or sample records. On first startup, the app initializes an empty database. Accounts and police-station records must be provisioned in the database before the corresponding staff workflows can be used. Citizen registration can be submitted, but a staff account is needed to review applications.

The app and MongoDB share application data. Removing the sample records from the source code does not erase records that were already saved in MongoDB. Back up the database before manually clearing any existing records.

(If you prefer separate terminals: run `npm start` inside `server`, and `npm run dev` inside `CMPR_System web`.)

## Migrate an existing database
Run these commands from `server` before starting the updated website:

```
npm run migrate:auth
npm run migrate:auth -- --apply
npm run create-admin
```

The first migration command is a dry run and changes nothing. The apply command creates and verifies a full backup under `exported collections`, then:
- moves citizen profile data into `citizens` and administrator profiles into `administrators`;
- leaves only email, password hash/salt, role, profile reference, and active state in `users`;
- links station-account and officer profiles to user records; profiles with no existing password are retained but cannot sign in until an administrator sets one;
- removes the known seeded sample complaints, accounts, officers, notifications, and audit entries while keeping station master data and later records;
- detaches any retained complaint that referred to a removed sample citizen.

The `create-admin` command writes the first administrator profile and credential record directly to MongoDB. It asks for the password without echoing it and stores a PBKDF2 hash, not the password itself. Once signed in, edit the retained station-account and officer profiles to assign their passwords.

The collections are now separate: `users` holds credentials and profile references; `administrators`, `citizens`, `accounts`, and `officers` hold role-specific profile data.

## Look at your data
1. Open **MongoDB Compass**.
2. Click **Connect** (address `mongodb://127.0.0.1:27017`).
3. Open the database **cmpr**. Each box is one "collection": `complaints`, `users`, `administrators`, `citizens`, `stations`, `officers`, `accounts`, `notifications`, `audit`, `registrationApplications`, `registrationDocuments`.

A collection is like a table, and each item inside is called a **document** (like a row).

## Clear existing data
Existing MongoDB records are preserved when the app is updated. If you intend to delete them, back up the database first, then remove the appropriate records in MongoDB Compass. Dropping the entire `cmpr` database deletes all stored application data, including registrations and documents.

## If something goes wrong
| Problem | What to do |
|---|---|
| `Could not connect to MongoDB` | MongoDB is not running. Windows: open **Services**, find **MongoDB Server**, click **Start**. |
| `Port 5000 is already in use` | Change `PORT=5000` in `server/.env` to another number, and the same number in `CMPR_System web/vite.config.js` (the `target`). |
| Website shows "Loading portal data..." forever | The Express server is not running. Check the terminal for errors. |
| Changes not saved | Open the browser console (F12). A red "could not be saved" message means Express or MongoDB is down. |

## Files you should know

```
server/
  .env              settings (database address, port)
  src/index.js      the URLs the website calls (/api/data, /api/documents/...)
  src/store.js      the code that reads/writes MongoDB
  src/db.js         opens the MongoDB connection
CMPR System web/
  vite.config.js    forwards /api requests to the Express server
  src/lib/appData.js  the website's calls to the server
```

## Important - still a demo
- There is **no secure login on the server yet**. Passwords are still checked in the browser and the data is sent to every browser. Do not put real personal data in it.
- The next step for a real system is: login on the server (with a token), and Express checking which role may do what.

---

## Complaint submission, routing, privacy and evidence (new)

### How a complaint travels
1. The citizen picks an **Incident District** (all 25) and then a **Police Station** of that district, adds evidence files and submits.
2. The server saves the complaint with that station's `stationCode`. Only that station's accounts (and the Super Administrator) can see it. `off` (assigned officer) is empty, so **no officer can see it yet**.
3. The station accepts it and assigns an officer **of the same station**. From that moment that officer (and only that officer) can see it.

### Who sees what (enforced on the SERVER, in `server/src/complaintRules.js`)
| Role | Complaints visible | Complainant details |
|---|---|---|
| Citizen | their own | - |
| Station account | only their own station | name, contact number, address, district, ID number, email |
| Police officer | only complaints assigned to them | **name and contact number only** |
| Super Administrator | all | all |

### Evidence
Files (JPG, PNG, PDF, MP4, max 10 MB, up to 10 per complaint) are uploaded to `POST /api/complaints/:id/evidence` and stored in the MongoDB collection `complaintEvidence`. The type is checked from the file's real content. Anyone who may see the complaint may open its evidence (`GET /api/complaints/:id/evidence/:evidenceId`).

### New server pieces
| File | Purpose |
|---|---|
| `src/auth.js` | `POST /api/auth/login`, `/logout`, session tokens (collection `sessions`, expire after 12 h) |
| `src/complaintRoutes.js` | list / create / action / evidence endpoints |
| `src/complaintRules.js` | all permission and workflow rules (unit-tested: `npm test` inside `server`) |
| `src/dataGuard.js` | stops non-admins from changing users/officers/stations through `PUT /api/data` |

New MongoDB collections: `complaintEvidence`, `sessions`, `counters` (complaint numbers). `complaints` is no longer part of `/api/data`.

### After updating
* Restart the server (`npm run dev:all`). No new npm packages are needed.
* Everybody must **sign in again** (old browser sessions have no token).
* ID photos for registrations are now viewable only by a signed-in administrator.
