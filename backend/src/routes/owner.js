import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import ownerMiddleware from '../middleware/owner.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';

const router = Router();
router.use(authMiddleware);
router.use(ownerMiddleware);

router.post('/drivers', async (req, res) => {
  const { name, phone, photoURL, vehiclePlate, vehicleType } = req.body;
  if (!name || !phone || !vehiclePlate) {
    return res.status(400).json({ error: 'Nombre, telefono y placa requeridos' });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, name, role: 'driver', verified: true });
  } else {
    user.role = 'driver';
    user.name = name;
    await user.save();
  }

  const driver = await Driver.create({
    userId: user._id, name, phone,
    photoURL: photoURL || '',
    vehiclePlate: vehiclePlate.toUpperCase(),
    vehicleType: vehicleType || 'MotoTaxi'
  });

  res.json({ driver, user });
});

router.get('/drivers', async (req, res) => {
  const drivers = await Driver.find().populate('userId', 'name phone').sort({ createdAt: -1 });
  res.json({ drivers });
});

router.delete('/drivers/:id', async (req, res) => {
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });
  res.json({ message: 'Conductor eliminado' });
});

router.get('/rides', async (req, res) => {
  const rides = await Ride.find().populate('userId', 'name phone').populate('driverId', 'name vehiclePlate').sort({ createdAt: -1 }).limit(100);
  res.json({ rides });
});

export default router;
