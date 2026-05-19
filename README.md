# Expense Tracker — Full-Stack SPA

A single-page Expense Tracker web application where users register, log in, and
manage their personal expenses, while admins manage all accounts and audit
activity. Built as a modern SPA with a React frontend, an Express REST API, and
a MongoDB database.

## Problem It Solves

Manually tracking spending is tedious and disorganised. This app gives each user
a private, real-time expense log with categorised totals, and gives
administrators oversight of all users and their activity — all without a single
full page reload.

## Technical Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 18 + React Router 6 (Vite) — single-page app  |
| Backend  | Node.js + Express (REST API)                        |
| Database | MongoDB (collections: `users`, `expenses`, `user_activities`) |
| Auth     | JWT (`jsonwebtoken`) + password hashing (`bcryptjs`) |
| Styling  | Custom CSS                                          |

## Entities & CRUD

Three entities, each with full Create/Read/Update/Delete coverage:

1. **user** — registration & login with hashed passwords and JWT. Users edit/delete
   their own profile; admins can list, rename, change role, and delete any user.
2. **expense_item** (`expenses`) — per-user expenses with **real-time live search**
   (filters as you type) plus category filtering and a running total. Full CRUD,
   owner-scoped.
3. **user_activity** — every login/logout and CRUD action is logged automatically.
   Admins can read (filter/search), delete single entries, or clear the log.

## Features

- JWT authentication with bcrypt password hashing
- Role-based access (`user` vs `admin`) with protected routes
- Live search that filters expenses instantly as you type
- Category filter + auto-calculated total
- Full CRUD on expenses, users, and the activity log
- Admin panel: user management + activity audit log
- SPA behaviour — one HTML file, client-side routing, no page reloads
- Responsive layout

## Project Structure

```
.
├── backend/            Express API
│   ├── config/db.js          MongoDB connection + collections
│   ├── middleware/           auth (JWT) + activity logger
│   ├── routes/               auth, expenses, users, activity
│   ├── database/             seed.js + export.js scripts
│   └── server.js             app entry
├── frontend/           React SPA (Vite)
│   ├── index.html            the single HTML file
│   └── src/                  pages, components, context, api client
├── database/           JSON exports (users / expenses / user_activities)
└── package.json        root scripts (run both apps together)
```

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas or local)

### 2. Configure environment
Copy the example env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

`backend/.env`:
```
MONGO_URI=<your mongodb connection string>
PORT=5000
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
```

### 3. Install dependencies
```bash
npm run install:all
```

### 4. Seed the database (optional but recommended)
Creates demo accounts and sample data, and refreshes the JSON exports in `/database`.

> ⚠️ `npm run seed` **resets** the `users`, `expenses`, and `user_activities`
> collections before inserting the demo data.

```bash
npm run seed
```

### 5. Run the app (backend + frontend together)
```bash
npm run dev
```
Then open the Vite URL shown in the terminal (default **http://localhost:5173**).
The Vite dev server proxies `/api` to the Express server on port 5000.

## Demo Accounts (after seeding)

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@example.com   | Admin@123  |
| User  | alice@example.com   | Alice@123  |
| User  | bob@example.com     | Bob@123    |

## API Overview

| Method | Endpoint                | Access | Description                         |
|--------|-------------------------|--------|-------------------------------------|
| POST   | `/api/auth/register`    | public | Create account, returns JWT         |
| POST   | `/api/auth/login`       | public | Log in, returns JWT                  |
| POST   | `/api/auth/logout`      | auth   | Log the logout event                |
| GET    | `/api/auth/me`          | auth   | Current user                        |
| GET    | `/api/expenses`         | auth   | List own expenses (`?search=&category=`) |
| POST   | `/api/expenses`         | auth   | Create expense                      |
| PUT    | `/api/expenses/:id`     | auth   | Update own expense                  |
| DELETE | `/api/expenses/:id`     | auth   | Delete own expense                  |
| GET/PUT/DELETE | `/api/users/me` | auth   | View / update / delete own account  |
| GET    | `/api/users`            | admin  | List all users                      |
| PUT    | `/api/users/:id`        | admin  | Update a user (name/role)           |
| DELETE | `/api/users/:id`        | admin  | Delete a user + their expenses      |
| GET    | `/api/activity`         | admin  | Activity log (`?userId=&action=`)   |
| DELETE | `/api/activity/:id`     | admin  | Delete one log entry                |
| DELETE | `/api/activity`         | admin  | Clear the log                       |

## Database Export

`/database` contains JSON exports of all three collections
(`users.json`, `expenses.json`, `user_activities.json`). Regenerate them anytime
from the live database with:

```bash
npm run export
```

## Author

Arki Valdy — 24956967
