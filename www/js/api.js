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

  async sendCode(phone) {
    return this.request('/api/auth/send-code', {
      method: 'POST', body: JSON.stringify({ phone })
    });
  },

  async verifyCode(phone, name) {
    const data = await this.request('/api/auth/verify-code', {
      method: 'POST', body: JSON.stringify({ phone, name })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async getProfile() {
    return this.request('/api/auth/me');
  },

  async requestRide(pickup, destination, price) {
    return this.request('/api/rides/request', {
      method: 'POST', body: JSON.stringify({ pickup, destination, price })
    });
  },

  async getActiveRide() {
    return this.request('/api/rides/active');
  },

  async cancelRide(rideId) {
    return this.request(`/api/rides/${rideId}/cancel`, { method: 'PATCH' });
  },

  async rateRide(rideId, rating) {
    return this.request(`/api/rides/${rideId}/rate`, {
      method: 'PATCH', body: JSON.stringify({ rating })
    });
  },

  async getHistory() {
    return this.request('/api/rides/history');
  },

  async getNearbyDrivers(lat, lng) {
    return this.request(`/api/drivers/nearby?lat=${lat}&lng=${lng}`);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('motocasma_token');
    localStorage.removeItem('motocasma_user');
  }
};
