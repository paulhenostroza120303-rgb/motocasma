import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  dni: { type: String, default: '' },
  age: { type: Number, default: 0 },
  email: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  role: { type: String, enum: ['user', 'driver', 'admin', 'owner'], default: 'user' },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
