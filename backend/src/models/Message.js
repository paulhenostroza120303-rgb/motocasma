import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'driver'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ rideId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
