import { Router } from 'express';
import Message from '../models/Message.js';

const router = Router();

router.get('/:rideId', async (req, res) => {
  try {
    const messages = await Message.find({ rideId: req.params.rideId }).sort({ createdAt: 1 }).limit(100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
