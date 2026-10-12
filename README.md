# ELOVAA Backend (Node + Express + MongoDB Atlas)

## Run (local)
```
cd backend
npm install
npm run dev        # development (auto-restart)
npm start          # normal start
```
Server: http://localhost:5000  (test: http://localhost:5000/api/health)

`.env` me MongoDB Atlas URI pehle se set hai. Atlas ke **Network Access** me `0.0.0.0/0` allow hona chahiye.

## API
| Method | URL | Auth | Kaam |
|---|---|---|---|
| POST | /api/auth/login | - | Login (email, password) -> token |
| POST | /api/visitors/checkin | Bearer token | Check-in (name, email, phone, purpose, photo) |
| POST | /api/visitors/checkout | Bearer token | Check-out (phone) |
| GET | /api/visitors | Bearer token | Dashboard list |
| GET | /api/visitors/:id/photo | token | Visitor photo |

## Deploy (Render)
1. `backend` folder ko GitHub repo me daalo (ya poora repo, aur Render me Root Directory = `backend`).
2. Render -> New Web Service. Build: `npm install`, Start: `npm start`.
3. Environment variables: `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (bina quotes ke: elovaa#012), `JWT_SECRET`, `FRONTEND_URL` (frontend deploy hone ke baad uska link).
4. Render ka link (e.g. https://elovaa-visitor-backend.onrender.com) frontend me `VITE_API_URL` me lagana hai.
