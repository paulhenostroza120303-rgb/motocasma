import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';

const router = Router();

router.use(authMiddleware);

router.post('/request', async (req, res) => {
  const { pickup, destination, price } = req.body;
  if (!pickup || !destination) {
    return res.status(400).json({ error: 'Origen y destino requeridos' });
  }

  const ride = await Ride.create({
    userId: req.userId,
    pickup,
    destination,
    price: price || 8,
    status: 'searching'
  });

  const nearbyDrivers = await Driver.find({
    available: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
        $maxDistance: 5000
      }
    }
  }).limit(5);

  res.json({ ride, nearbyDrivers });
});

router.get('/active', async (req, res) => {
  const ride = await Ride.findOne({
    userId: req.userId,
    status: { $in: ['searching', 'accepted', 'arrived', 'in_progress'] }
  }).populate('driverId');

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
    { _id: req.params.id, userId: req.userId },
    { rating },
    { new: true }
  );
  res.json({ ride });
});

router.get('/history', async (req, res) => {
  const rides = await Ride.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('driverId');
  res.json({ rides });
});

export default router;
