# ELOVAA Backend (Node + Express + MongoDB Atlas)

## Local Development
```bash
cd backend
npm install
npm run dev        # Development mode (auto-restart)
npm start          # Production start
```
Server runs at: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)

> Ensure MongoDB Atlas **Network Access** allows `0.0.0.0/0` (Allow Access from Anywhere).

## API Endpoints
| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Admin authentication (`email`, `password`) -> JWT token |
| POST | `/api/visitors/checkin` | Bearer token | Visitor check-in (`name`, `email`, `phone`, `purpose`, `photo`) |
| POST | `/api/visitors/checkout` | Bearer token | Visitor check-out by `phone` |
| GET | `/api/visitors` | Bearer token | Fetch all visitor records for dashboard |
| GET | `/api/visitors/:id/photo` | Token query/header | Fetch high-resolution visitor photo |

## Deployment (Render)
1. Repository: [https://github.com/aquiiibbb/elovaa-backend-visitor](https://github.com/aquiiibbb/elovaa-backend-visitor)
2. Create Web Service with:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Environment variables:
   - `MONGO_URI`: MongoDB Atlas connection string
   - `ADMIN_EMAIL`: Admin login email
   - `ADMIN_PASSWORD`: Admin login password
   - `JWT_SECRET`: Secret key for JWT signing
   - `FRONTEND_URL`: Production URL(s) of frontend (for CORS)
