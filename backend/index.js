const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); // After backend deploy
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://localhost:5050',
    'https://doodledock.vercel.app'
  ]
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Firebase backend is running');
});

// Example: Create a room
db.collection('rooms'); // This is how you would access Firestore collections

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I for clarity
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// Create a new room
app.post('/rooms', verifyFirebaseToken, async (req, res) => {
  try {
    const { name, isPrivate = false } = req.body;
    const creatorId = req.user.uid;
    let code;
    // Ensure code is unique
    while (true) {
      code = generateRoomCode();
      const existing = await db.collection('rooms').where('code', '==', code).get();
      if (existing.empty) break;
    }
    const roomRef = await db.collection('rooms').add({
      name,
      isPrivate,
      allowedUsers: [],
      whiteboardData: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      creatorId,
      code,
    });
    res.status(201).json({ id: roomRef.id, name, isPrivate, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room info
app.get('/rooms/:id', async (req, res) => {
  try {
    const roomDoc = await db.collection('rooms').doc(req.params.id).get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    res.json({ id: roomDoc.id, ...roomDoc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all rooms
app.get('/rooms', async (req, res) => {
  try {
    const snapshot = await db.collection('rooms').get();
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List only rooms created by the current user
app.get('/rooms/mine', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('rooms').where('creatorId', '==', userId).get();
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Join a room (add user to allowedUsers if private)
app.post('/rooms/:id/join', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const roomRef = db.collection('rooms').doc(req.params.id);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    if (roomDoc.data().isPrivate) {
      await roomRef.update({
        allowedUsers: admin.firestore.FieldValue.arrayUnion(userId),
      });
    }
    res.json({ message: 'Joined room' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save drawing actions to a room
app.post('/rooms/:id/draw', verifyFirebaseToken, async (req, res) => {
  try {
    const { action } = req.body; // action: drawing event data
    const roomRef = db.collection('rooms').doc(req.params.id);
    await roomRef.update({
      whiteboardData: admin.firestore.FieldValue.arrayUnion(action),
    });
    res.json({ message: 'Drawing action saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all drawing actions for a room
app.get('/rooms/:id/draw', async (req, res) => {
  try {
    const roomDoc = await db.collection('rooms').doc(req.params.id).get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    res.json({ whiteboardData: roomDoc.data().whiteboardData || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear the whiteboard for a room
app.post('/rooms/:id/clear', verifyFirebaseToken, async (req, res) => {
  try {
    const roomRef = db.collection('rooms').doc(req.params.id);
    await roomRef.update({ whiteboardData: [] });
    res.json({ message: 'Whiteboard cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a room by code
app.post('/rooms/join-by-code', verifyFirebaseToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.uid;
    const snapshot = await db.collection('rooms').where('code', '==', code).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Room not found' });
    const roomDoc = snapshot.docs[0];
    const roomRef = db.collection('rooms').doc(roomDoc.id);
    if (roomDoc.data().isPrivate) {
      await roomRef.update({
        allowedUsers: admin.firestore.FieldValue.arrayUnion(userId),
      });
    }
    res.json({ id: roomDoc.id, ...roomDoc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/debug: Get all rooms for a specific userId
app.get('/rooms/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection('rooms').where('creatorId', '==', userId).get();
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 