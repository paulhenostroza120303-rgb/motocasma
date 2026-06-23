let activeUsers = {};

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    socket.on('user:online', ({ userId, role, lat, lng }) => {
      activeUsers[socket.id] = { userId, role, lat, lng };
      socket.join(role === 'driver' ? 'drivers' : 'users');
      socket.join(`user:${userId}`);
    });

    socket.on('ride:request', (data) => {
      io.to('drivers').emit('ride:new', {
        rideId: data.rideId,
        pickup: data.pickup,
        destination: data.destination,
        price: data.price,
        userName: data.userName,
        timestamp: new Date()
      });
    });

    socket.on('ride:accept', async ({ rideId, driverId, driverName, driverPhone, driverPlate, driverLat, driverLng, userId }) => {
      io.to(`user:${userId}`).emit('ride:accepted', { rideId, driverId, driverName, driverPhone, driverPlate, driverLat, driverLng });
      io.to('drivers').emit('ride:taken', { rideId });
    });

    socket.on('ride:arrived', ({ rideId, userId }) => {
      io.to(`user:${userId}`).emit('ride:arrived', { rideId });
    });

    socket.on('driver:location', ({ rideId, userId, lat, lng }) => {
      io.to(`user:${userId}`).emit('ride:location', { rideId, lat, lng });
    });

    socket.on('ride:start', ({ rideId, userId }) => {
      io.to(`user:${userId}`).emit('ride:status', { rideId, status: 'in_progress' });
    });

    socket.on('ride:complete', ({ rideId, userId }) => {
      io.to(`user:${userId}`).emit('ride:status', { rideId, status: 'completed' });
    });

    socket.on('ride:cancelled', ({ rideId, userId }) => {
      io.to(`user:${userId}`).emit('ride:cancelled', { rideId });
      io.to('drivers').emit('ride:cancelled', { rideId });
    });

    socket.on('disconnect', () => {
      const user = activeUsers[socket.id];
      if (user?.role === 'driver') {
        io.to('users').emit('driver:offline', { driverId: user.userId });
      }
      delete activeUsers[socket.id];
    });
  });
}
