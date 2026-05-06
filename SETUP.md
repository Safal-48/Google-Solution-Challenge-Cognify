# Cognify — Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API Key

---

## 1. Frontend Setup

```bash
# Install frontend dependencies (already done)
npm install

# Copy and fill env variables
cp .env.example .env
```

Fill in `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_key     # Optional (for Google Sign-In)
VITE_FIREBASE_AUTH_DOMAIN=...              # Optional
VITE_FIREBASE_PROJECT_ID=...               # Optional
VITE_API_URL=http://localhost:5000/api     # Backend URL
```

```bash
# Start frontend dev server
npm run dev
# → http://localhost:5173
```

---

## 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Fill in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cognify
JWT_SECRET=your_super_secret_key_at_least_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

```bash
# Start backend (requires MongoDB running)
npm run dev     # with nodemon (auto-restart)
# OR
npm start       # production

# → http://localhost:5000
# → Health check: http://localhost:5000/api/health
```

---

## 3. MongoDB Setup

### Option A: Local MongoDB
```bash
# Install MongoDB Community: https://www.mongodb.com/try/download/community
mongod --dbpath /data/db
```

### Option B: MongoDB Atlas (Cloud, Free)
1. Create account at https://cloud.mongodb.com
2. Create a free cluster
3. Get connection string → paste into `MONGODB_URI`

---

## 🔌 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login + get JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/user/profile` | JWT | Full profile |
| GET | `/api/user/stats` | JWT | Dashboard stats |
| POST | `/api/user/onboarding` | JWT | Complete onboarding |
| POST | `/api/chat` | JWT | Store chat message |
| GET | `/api/chat/history` | JWT | Chat sessions |
| POST | `/api/quiz/submit` | JWT | Submit quiz + get XP |
| GET | `/api/quiz/history` | JWT | Past quiz results |
| GET | `/api/progress` | JWT | Full analytics |
| POST | `/api/progress/track-note` | JWT | Track note (+XP) |

---

## 🏗️ Project Structure

```
/                           ← Frontend (Vite + React + Tailwind)
├── src/
│   ├── pages/              ← All page components
│   ├── components/         ← Reusable UI components
│   ├── context/            ← AuthContext (JWT + Firebase)
│   └── services/
│       ├── api.ts          ← Backend API client (JWT)
│       └── gemini.ts       ← Google Gemini AI client
├── .env                    ← Frontend env vars
└── vite.config.ts

/server/                    ← Backend (Express + MongoDB)
├── server.js               ← Entry point
├── models/                 ← Mongoose schemas
│   ├── User.js
│   ├── ChatSession.js
│   └── QuizResult.js
├── controllers/            ← Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── chatController.js
│   ├── quizController.js
│   └── progressController.js
├── routes/                 ← Express routers
├── middleware/
│   └── auth.js             ← JWT protect middleware
└── .env                    ← Backend env vars
```

---

## 🔐 Auth Flow

1. **Email/Password**: POST `/api/auth/register` or `/api/auth/login` → receive JWT → stored in localStorage → sent as `Authorization: Bearer <token>` on all API calls
2. **Google Sign-In**: Firebase popup → no backend token → features limited to AI (no DB persistence)

---

## 🎮 Gamification

- **XP System**: Register (+50), Notes (+15), Chat (+5), Quiz (+10–60 based on score)
- **Levels**: Every 500 XP = +1 Level
- **Streak**: Updates daily on each login
- **Badges**: Welcome, Note Taker, Note Master, Perfect Score, Quiz Master, Ready to Learn

---

## 🚀 Deployment

**Frontend → Vercel**
```bash
npm run build
# Deploy /dist to Vercel
# Set VITE_API_URL to your backend URL
```

**Backend → Render / Railway**
```bash
# Set environment variables in dashboard
# Set build command: npm install
# Set start command: node server.js
```
