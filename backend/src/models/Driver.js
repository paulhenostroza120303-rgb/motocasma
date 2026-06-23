import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  photoURL: { type: String, default: '' },
  vehiclePlate: { type: String, required: true },
  vehicleType: { type: String, default: 'MotoTaxi' },
  rating: { type: Number, default: 5.0 },
  totalTrips: { type: Number, default: 0 },
  available: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [-78.2989, -9.4531] }
  },
  earnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

driverSchema.index({ location: '2dsphere' });

export default mongoose.model('Driver', driverSchema);
