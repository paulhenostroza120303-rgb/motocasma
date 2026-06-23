import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';

const router = Router();

router.use(authMiddleware);

router.get('/nearby', async (req, res) => {
  const { lat, lng, maxDistance = 5000 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat y lng requeridos' });
  }

  const drivers = await Driver.find({
    available: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(maxDistance)
      }
    }
  }).limit(20);

  res.json({ drivers });
});

router.get('/:id', async (req, res) => {
  const driver = await Driver.findById(req.params.id).populate('userId', 'name phone photoURL');
  if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });
  res.json({ driver });
});

router.put('/location', async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat y lng requeridos' });

  const driver = await Driver.findOneAndUpdate(
    { userId: req.userId },
    { location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } },
    { new: true }
  );
  res.json({ driver });
});

router.put('/availability', async (req, res) => {
  const { available } = req.body;
  const driver = await Driver.findOneAndUpdate(
    { userId: req.userId },
    { available },
    { new: true }
  );
  res.json({ driver });
});

router.get('/:id/rides', async (req, res) => {
  const driver = await Driver.findOne({ userId: req.userId });
  if (!driver) return res.status(404).json({ error: 'No eres conductor' });

  const rides = await Ride.find({ driverId: driver._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ rides });
});

export default router;
