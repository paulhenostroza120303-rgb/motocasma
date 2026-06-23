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
import ownerRoutes from './routes/owner.js';
import chatRoutes from './routes/chat.js';
import { setupSocketHandlers } from './socket/handler.js';
import Driver from './models/Driver.js';

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
app.use('/api/owner', ownerRoutes);
app.use('/api/chat', chatRoutes);

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
      try {
        await Driver.createIndexes();
        console.log('Indices de Driver creados/verificados');
      } catch (e) {
        console.log('Error creando indices:', e.message);
      }
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
