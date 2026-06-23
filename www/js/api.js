const API = {
  getToken() {
    return localStorage.getItem('motocasma_token');
  },

  setToken(token) {
    localStorage.setItem('motocasma_token', token);
  },

  getUser() {
    const data = localStorage.getItem('motocasma_user');
    return data ? JSON.parse(data) : null;
  },

  setUser(user) {
    localStorage.setItem('motocasma_user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${CONFIG.API_URL}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error de conexion');
    return data;
  },

  sendCode(phone) {
    return this.request('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) });
  },

  verifyFirebaseToken(firebaseToken, phone, name, dni, age) {
    return this.request('/api/auth/firebase-verify', {
      method: 'POST',
      body: JSON.stringify({ firebaseToken, phone, name, dni, age })
    });
  },

  verifyCode(phone, name) {
    return this.request('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, name }) });
  },

  getProfile() {
    return this.request('/api/auth/me');
  },

  requestRide(pickup, destination, price) {
    return this.request('/api/rides/request', { method: 'POST', body: JSON.stringify({ pickup, destination, price }) });
  },

  getActiveRide() {
    return this.request('/api/rides/active');
  },

  getDriverActiveRide() {
    return this.request('/api/rides/driver-active');
  },

  acceptRide(rideId) {
    return this.request(`/api/rides/${rideId}/accept`, { method: 'PATCH' });
  },

  arrivedRide(rideId) {
    return this.request(`/api/rides/${rideId}/arrived`, { method: 'PATCH' });
  },

  startRide(rideId) {
    return this.request(`/api/rides/${rideId}/start`, { method: 'PATCH' });
  },

  completeRide(rideId) {
    return this.request(`/api/rides/${rideId}/complete`, { method: 'PATCH' });
  },

  cancelRide(rideId) {
    return this.request(`/api/rides/${rideId}/cancel`, { method: 'PATCH' });
  },

  rateRide(rideId, rating) {
    return this.request(`/api/rides/${rideId}/rate`, { method: 'PATCH', body: JSON.stringify({ rating }) });
  },

  getHistory() {
    return this.request('/api/rides/history');
  },

  getNearbyDrivers(lat, lng) {
    return this.request(`/api/drivers/nearby?lat=${lat}&lng=${lng}`);
  },

  addDriver(driverData) {
    return this.request('/api/owner/drivers', { method: 'POST', body: JSON.stringify(driverData) });
  },

  getDrivers() {
    return this.request('/api/owner/drivers');
  },

  deleteDriver(id) {
    return this.request(`/api/owner/drivers/${id}`, { method: 'DELETE' });
  },

  isLoggedIn() { return !!this.getToken(); },

  isOwner() {
    const user = this.getUser();
    return user && user.role === 'owner';
  },

  logout() {
    localStorage.removeItem('motocasma_token');
    localStorage.removeItem('motocasma_user');
  }
};
