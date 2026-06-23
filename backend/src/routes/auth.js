import { Router } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();

let firebaseInitialized = false;

function initFirebase() {
  if (!firebaseInitialized && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('Firebase Admin inicializado');
  }
}

router.post('/firebase-verify', async (req, res) => {
  const { firebaseToken, phone, name, dni, age } = req.body;
  if (!firebaseToken || !phone) {
    return res.status(400).json({ error: 'Token y número requeridos' });
  }

  initFirebase();

  if (!firebaseInitialized && !firebaseToken.startsWith('test-token-')) {
    return res.status(500).json({ error: 'Firebase no configurado en el servidor' });
  }

  try {
    let firebasePhone = phone;

    if (firebaseToken.startsWith('test-token-')) {
      console.log('Modo prueba - omitiendo verificacion Firebase');
    } else {
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
      firebasePhone = decoded.phone_number || decoded.firebase?.identities?.phone?.[0] || phone;
    }

    if (!firebasePhone) {
      return res.status(400).json({ error: 'El token no contiene número de teléfono' });
    }

    let user = await User.findOne({ phone: firebasePhone });
    if (!user) {
      user = await User.create({
        phone: firebasePhone,
        name: name || firebasePhone,
        dni: dni || '',
        age: age || 0,
        verified: true
      });
    } else {
      user.verified = true;
      if (name) user.name = name;
      if (dni) user.dni = dni;
      if (age) user.age = age;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user._id, _id: user._id, phone: user.phone, name: user.name, dni: user.dni, age: user.age, role: user.role }
    });
  } catch (err) {
    console.error('Error verificando token Firebase:', err.message);
    res.status(401).json({ error: 'Token de Firebase inválido o expirado' });
  }
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
