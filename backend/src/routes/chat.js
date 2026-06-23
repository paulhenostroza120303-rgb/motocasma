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

router.post('/send', async (req, res) => {
  try {
    const { rideId, senderId, senderRole, text } = req.body;
    if (!rideId || !senderId || !text) return res.status(400).json({ error: 'Faltan campos' });
    const msg = await Message.create({ rideId, senderId, senderRole: senderRole || 'user', text });
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${rideId}`).emit('chat:receive', {
        _id: msg._id, senderId, senderRole, text, createdAt: msg.createdAt
      });
    }
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
