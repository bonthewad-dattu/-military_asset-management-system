# Military Asset Management System

A starter full-stack implementation for tracking equipment across multiple bases.

## Stack
- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Lucide React, Recharts
- Backend: Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt

## Requirements
Node.js 18+, npm, PostgreSQL.

## 1. Database
Create a PostgreSQL database named `military_assets`, then run:

```bash
psql -U postgres -d military_assets -f backend/database/schema.sql
```

Copy `backend/.env.example` to `backend/.env` and update the database credentials and JWT secret.

## 2. Backend
```bash
cd backend
npm install
npm run dev
```
The API runs at http://localhost:5000.

## 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

## Important notes
- The application is an MVP starter. Create users through the registration endpoint or insert test users using the documented role names.
- Roles: `ADMIN`, `BASE_COMMANDER`, `LOGISTICS_OFFICER`.
- A Base Commander is restricted to their assigned base by the API.
- Transfers use a PostgreSQL transaction and lock the source inventory row before stock is moved.
- Inventory is calculated from purchases, completed transfers, assignments and expenditures. Opening balance is the balance before the selected period.
- Change all sample secrets before deployment. Do not use real military or sensitive operational data in a demo project.

## API overview
- `POST /api/auth/register` – create a user (for local demo only; restrict/remove for production)
- `POST /api/auth/login` – login and receive JWT
- `GET /api/dashboard` – dashboard metrics
- `GET /api/bases` – list bases
- `GET /api/equipment` – list equipment types
- `GET/POST /api/purchases` – purchase history / record purchase
- `GET/POST /api/transfers` – transfer history / create transfer
- `GET/POST /api/assignments` – assignment history / create assignment
- `GET/POST /api/expenditures` – expenditure history / record expenditure
- `GET /api/audit-logs` – audit trail

## Submission checklist
1. Update the README with your name and actual screenshots.
2. Run both applications locally and test each role.
3. Replace demo credentials/secrets and document any changes.
4. Record a short walkthrough showing login, dashboard, purchase and transfer flow.
5. Zip the project without `node_modules`.
