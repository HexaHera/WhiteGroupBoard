# DoodleDock

A modern collaborative whiteboard app for teams and classrooms.

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
- Uses Firestore for data storage.
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

### 2. Backend Setup
```sh
cd backend
npm install
# Place your serviceAccountKey.json in backend/
# Create a .env file with:
# PORT=5000
# FIREBASE_DATABASE_URL=your_firebase_db_url
npm start
```

### 3. Frontend Setup
```sh
cd ../frontend
npm install
# Create a .env file with your Firebase config:
# REACT_APP_API_BASE_URL=http://localhost:5000
# REACT_APP_FIREBASE_API_KEY=...
# (other REACT_APP_FIREBASE_... keys)
npm start
```

### 4. Open in Browser
- Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

**Backend (.env):**
```
PORT=5000
FIREBASE_DATABASE_URL=your_firebase_db_url
```
**Frontend (.env):**
```
REACT_APP_API_BASE_URL=http://localhost:5000
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

## License

MIT (or your preferred license) 