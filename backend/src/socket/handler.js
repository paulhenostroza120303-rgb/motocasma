let activeUsers = {};

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('user:online', ({ userId, role, lat, lng }) => {
      activeUsers[socket.id] = { userId, role, lat, lng };
      if (role === 'driver') {
        socket.join('drivers');
        io.to('users').emit('driver:online', { driverId: userId, lat, lng });
      } else {
        socket.join('users');
      }
    });

    socket.on('ride:request', (data) => {
      io.to('drivers').emit('ride:new', {
        ...data,
        timestamp: new Date()
      });
    });

    socket.on('ride:accept', ({ rideId, driverId, driverName, driverLat, driverLng }) => {
      const rideSockets = Object.entries(activeUsers).filter(
        ([_, u]) => u.userId === data?.userId
      );
      rideSockets.forEach(([sid]) => {
        io.to(sid).emit('ride:accepted', { rideId, driverId, driverName, driverLat, driverLng });
      });
    });

    socket.on('driver:location', ({ rideId, lat, lng }) => {
      socket.broadcast.emit(`ride:location:${rideId}`, { lat, lng });
    });

    socket.on('ride:status', ({ rideId, status }) => {
      socket.broadcast.emit(`ride:status:${rideId}`, { status });
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
