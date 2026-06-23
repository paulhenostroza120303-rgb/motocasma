const SOCKET = {
  socket: null,
  listeners: {},
  pendingJoin: null,

  connect() {
    if (this.socket?.connected) return;
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
    this.socket = io(CONFIG.SOCKET_URL, { reconnection: true, reconnectionAttempts: 10 });
    this.socket.on('connect', () => {
      console.log('Socket conectado');
      const user = API.getUser();
      if (user) {
        this.socket.emit('user:online', { userId: user.id, role: user.role });
      }
      if (this.pendingJoin) {
        this.socket.emit('chat:join', { rideId: this.pendingJoin });
        this.pendingJoin = null;
      }
    });
    this.socket.on('disconnect', () => console.log('Socket desconectado'));
    Object.entries(this.listeners).forEach(([event, cb]) => {
      this.socket.on(event, cb);
    });
  },

  on(event, callback) {
    this.listeners[event] = callback;
    if (this.socket) this.socket.on(event, callback);
  },

  emit(event, data) {
    if (this.socket) this.socket.emit(event, data);
  },

  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
    this.pendingJoin = null;
  }
};
