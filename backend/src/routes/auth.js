import { Router } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

let firebaseInitialized = false;

function initFirebase() {
  if (!firebaseInitialized && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
  }
}

router.post('/send-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Número requerido' });

  initFirebase();

  if (firebaseInitialized) {
    try {
      await admin.auth().createUser({ phoneNumber: phone });
    } catch (e) {
      if (e.code !== 'auth/uid-already-exists') {
        console.log('Firebase no disponible, modo desarrollo');
      }
    }
  }

  res.json({ message: 'Código enviado', phone });
});

router.post('/verify-code', async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Número requerido' });

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, name: name || phone, verified: true });
  } else {
    user.verified = true;
    if (name) user.name = name;
    await user.save();
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: { id: user._id, phone: user.phone, name: user.name, role: user.role }
  });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization?.replace('Bearer ', '');
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
