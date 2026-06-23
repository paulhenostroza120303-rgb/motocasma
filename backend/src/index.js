import { config } from 'dotenv';
config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import rideRoutes from './routes/rides.js';
import driverRoutes from './routes/drivers.js';
import { setupSocketHandlers } from './socket/handler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MotoCasma API' });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Conectado a MongoDB');
    } else {
      console.log('MongoDB no configurado, modo sin BD');
    }
    httpServer.listen(PORT, () => {
      console.log(`MotoCasma API corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
