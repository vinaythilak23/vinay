# ResQNow — Emergency Response and Rescue System

A starter full-stack academic project built with React + Vite, Node.js + Express, PostgreSQL + Prisma, JWT authentication, and Leaflet/OpenStreetMap.

## Requirements
- Node.js 20+ (LTS recommended)
- PostgreSQL 15+ (or a hosted PostgreSQL database)
- VS Code

## 1. Configure the backend
Open a terminal in VS Code and run:

```bash
cd backend
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Edit `backend/.env`:
- `DATABASE_URL`: your PostgreSQL connection string
- `JWT_SECRET`: use a long random secret
- `PORT=5000`
- `CLIENT_URL=http://localhost:5173`

Example local connection string:
`postgresql://postgres:YOUR_PASSWORD@localhost:5432/resqnow?schema=public`

Create a database named `resqnow` in PostgreSQL first. Do not put real credentials into source control.

Install and initialize:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Backend runs at http://localhost:5000

## 2. Configure the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## 3. Demo Accounts (Pre-configured)
The project comes pre-seeded with test accounts for each role:
- **Admin**: `admin@resqnow.org` / `Admin@1234`
- **Responder**: `responder@resqnow.org` / `Responder@1234`
- **Citizen**: `citizen@resqnow.org` / `Citizen@1234`

To start both servers with one command, double-click `run.bat` or run `.\run.ps1`.


## Current features
- User registration and login
- Citizen, responder, and admin roles
- Create and view your own emergency reports
- Responders can view open incidents and claim an incident
- Responder incident status updates
- Leaflet map for incident locations
- Admin incident list
- Server-generated timestamps and response-time fields

## Important limitations
This is an academic prototype, not an official emergency dispatch system. It does not automatically contact police, ambulance, fire services, or SMS gateways. Test only with sample/demo incidents. Do not rely on it during a real emergency.

Before public deployment, add production-grade validation, rate limiting, email/phone verification, secure image upload, audit logging, monitoring, and carefully reviewed authorization policies. Public OpenStreetMap tile service usage is subject to its usage policy.

## Public deployment
The frontend is published at https://vinaythilak23.github.io/vinay/. The API and PostgreSQL database are configured through `render.yaml`; create them by connecting this repository as a Blueprint in the Render dashboard. The free PostgreSQL database expires after 30 days, and the free API service may sleep while idle. Do not use this free setup for real emergency data.

After the Render services are created, verify the API at `https://resqnow-api-vinaythilak23.onrender.com/api/health`. The frontend build is configured to use that API URL. Accounts must be registered through the app; the seed script is not run in production, so demo logins are not created.
