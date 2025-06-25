# DoodleDock

A modern collaborative whiteboard app for teams and classrooms, deployed with a modern cloud stack:
- **Frontend:** Vercel
- **Backend:** Render
- **Authentication & Database:** Firebase

---

## Live Demo

- **Frontend (Vercel):** [https://doodledock.vercel.app](https://doodledock.vercel.app)
- **Backend (Render):** [https://doodledock.onrender.com](https://doodledock.onrender.com)

---

## Tech Stack

- **Frontend:** React, styled-components, framer-motion, deployed on Vercel
- **Backend:** Node.js, Express, deployed on Render
- **Database & Auth:** Firebase (Firestore, Firebase Auth)
- **Other:** REST API, modern responsive UI

---

## How to Invite Friends

1. Share the frontend link: [https://doodledock.vercel.app](https://doodledock.vercel.app)
2. After logging in, create a room. Copy the room code or URL from your browser.
3. Send the room link or code to your friends, so that they can join and collaborate in real time. 

---

## Features

- **User Authentication:** Secure login via Firebase Auth.
- **Room Management:** Create, join (by code), and list rooms (public/private).
- **Collaborative Drawing:** Real-time whiteboard with persistent storage.
- **Room Codes:** Unique, human-friendly codes for joining rooms.
- **Sharing:** Copy/share room codes easily.
- **Responsive UI:** Modern, clean, and mobile-friendly.

---

## Project Structure

```
WhiteBoard/
  backend/      # Node.js/Express API, Firestore, Firebase Admin
  frontend/     # React app (DoodleDock)
```

---

## Backend (Node.js/Express + Firebase)
- Handles room creation, joining, whiteboard data, and user authentication.
- Uses Firestore for data storage (Firebase).
- Deployed on Render.
- Endpoints include:
  - `POST /rooms` (create room)
  - `GET /rooms` (list rooms)
  - `GET /rooms/:id` (room info)
  - `POST /rooms/:id/join` (join room)
  - `POST /rooms/:id/draw` (save drawing)
  - `GET /rooms/:id/draw` (get drawing)
  - `POST /rooms/:id/clear` (clear whiteboard)
  - `POST /rooms/join-by-code` (join by code)
  - Auth required for most actions.

---

## Frontend (React)
- User login, room creation/joining, and whiteboard UI.
- Uses Firebase Auth for authentication.
- Communicates with backend via REST API.
- Modern UI with styled-components and framer-motion.
- Deployed on Vercel.

---

## Setup Instructions

### Prerequisites
- Node.js (v14+ recommended)
- Firebase project (for Auth and Firestore)
- Service account key for backend

### 1. Clone the repository
```sh
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd WhiteBoard
```

### 2. Backend Setup (Render deployment or local)
```sh
cd backend
npm install
npm start
```

### 3. Frontend Setup (Vercel deployment or local)
```sh
cd ../frontend
npm install
npm start
```

### 4. Open in Browser
- Visit [http://localhost:3000](http://localhost:3000) (for local - on your laptop)
- Or use the deployed link: [https://doodledock.vercel.app](https://doodledock.vercel.app)

---

## Environment Variables

**Backend (.env):**
```
PORT=5000
FIREBASE_DATABASE_URL=your_firebase_db_url
FIREBASE_SERVICE_ACCOUNT=your_service_account_json (as a single line)
```
**Frontend (.env):**
```
REACT_APP_API_BASE_URL=https://doodledock.onrender.com
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

---

## Security

- **Never commit your `.env` files or `serviceAccountKey.json`!**
- All sensitive files are listed in `.gitignore`.

---
