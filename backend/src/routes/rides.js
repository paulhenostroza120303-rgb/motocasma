import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';

const router = Router();
router.use(authMiddleware);

router.post('/request', async (req, res) => {
  const { pickup, destination, price } = req.body;
  if (!pickup || !destination) {
    return res.status(400).json({ error: 'Origen y destino requeridos' });
  }

  const ride = await Ride.create({
    userId: req.userId, pickup, destination,
    price: price || 8, status: 'searching'
  });

  const nearbyDrivers = await Driver.find({
    available: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [pickup.lng || -78.3, pickup.lat || -9.47] },
        $maxDistance: 10000
      }
    }
  }).limit(5);

  const user = await User.findById(req.userId);

  const io = req.app.get('io');
  if (io) {
    io.to('drivers').emit('ride:new', {
      rideId: ride._id,
      pickup: ride.pickup,
      destination: ride.destination,
      price: ride.price,
      userName: user?.name || 'Usuario',
      timestamp: new Date()
    });
  }

  res.json({ ride, nearbyDrivers });
});

router.get('/active', async (req, res) => {
  const ride = await Ride.findOne({
    userId: req.userId,
    status: { $in: ['searching', 'accepted', 'arrived', 'in_progress'] }
  }).populate('driverId');
  res.json({ ride });
});

router.get('/driver-active', async (req, res) => {
  const driver = await Driver.findOne({ userId: req.userId });
  if (!driver) return res.json({ ride: null });
  const ride = await Ride.findOne({
    driverId: driver._id,
    status: { $in: ['searching', 'accepted', 'arrived', 'in_progress'] }
  }).populate('userId', 'name phone');
  res.json({ ride });
});

router.patch('/:id/accept', async (req, res) => {
  const driver = await Driver.findOne({ userId: req.userId });
  if (!driver) return res.status(403).json({ error: 'No eres conductor' });

  const ride = await Ride.findByIdAndUpdate(
    req.params.id,
    { driverId: driver._id, status: 'accepted' },
    { new: true }
  ).populate('userId', 'name phone');
  if (!ride) return res.status(404).json({ error: 'Viaje no encontrado' });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${ride.userId._id || ride.userId}`).emit('ride:accepted', {
      rideId: ride._id,
      driverId: driver._id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverPlate: driver.vehiclePlate,
      driverLat: driver.location?.coordinates?.[1] || 0,
      driverLng: driver.location?.coordinates?.[0] || 0
    });
    io.to('drivers').emit('ride:taken', { rideId: ride._id });
  }
  res.json({ ride });
});

router.patch('/:id/arrived', async (req, res) => {
  const ride = await Ride.findByIdAndUpdate(
    req.params.id, { status: 'arrived' }, { new: true }
  );
  res.json({ ride });
});

router.patch('/:id/start', async (req, res) => {
  const ride = await Ride.findByIdAndUpdate(
    req.params.id, { status: 'in_progress' }, { new: true }
  );
  res.json({ ride });
});

router.patch('/:id/complete', async (req, res) => {
  const ride = await Ride.findByIdAndUpdate(
    req.params.id,
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );
  if (ride && ride.driverId) {
    const tripCount = await Ride.countDocuments({ driverId: ride.driverId, status: 'completed' });
    await Driver.findByIdAndUpdate(ride.driverId, { $inc: { earnings: ride.price }, totalTrips: tripCount, available: true });
  }
  res.json({ ride });
});

router.patch('/:id/cancel', async (req, res) => {
  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status: 'cancelled' },
    { new: true }
  );
  if (!ride) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json({ ride });
});

router.patch('/:id/rate', async (req, res) => {
  const { rating } = req.body;
  const ride = await Ride.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, status: 'completed' },
    { rating },
    { new: true }
  );
  if (ride && ride.driverId) {
    const rides = await Ride.find({ driverId: ride.driverId, rating: { $gt: 0 } });
    const avg = rides.reduce((s, r) => s + r.rating, 0) / rides.length;
    await Driver.findByIdAndUpdate(ride.driverId, { rating: Math.round(avg * 10) / 10 });
  }
  res.json({ ride });
});

router.get('/history', async (req, res) => {
  const rides = await Ride.find({ userId: req.userId })
    .sort({ createdAt: -1 }).limit(50)
    .populate('driverId');
  res.json({ rides });
});

export default router;
