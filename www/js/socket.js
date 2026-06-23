const SOCKET = {
  socket: null,
  listeners: {},

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(CONFIG.SOCKET_URL);
    this.socket.on('connect', () => {
      console.log('Socket conectado');
      const user = API.getUser();
      if (user) {
        this.socket.emit('user:online', { userId: user.id, role: user.role });
      }
    });
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
    if (this.socket) this.socket.disconnect();
  }
};
