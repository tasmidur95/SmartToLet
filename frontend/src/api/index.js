import { api } from './client.js';

// One function per endpoint so pages never build URLs by hand.
export const authApi = {
  login: (b) => api.post('/auth/login', b),
  register: (b) => api.post('/auth/register', b),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (b) => api.put('/auth/profile', b),
  changePassword: (b) => api.put('/auth/password', b),
  forgot: (b) => api.post('/auth/forgot-password', b),
  social: (provider, access_token) => api.post(`/auth/social/${provider}`, { access_token }),
};

export const placesApi = {
  cities: (query) => api.get('/cities', { per_page: 100, ...query }),
  city: (id) => api.get(`/cities/${id}`),
  subcities: (city_id) => api.get('/subcities', { city_id, per_page: 100 }),
};

export const propertyApi = {
  list: (query) => api.get('/properties', query),
  get: (id) => api.get(`/properties/${id}`),
  nearby: (id) => api.get(`/properties/${id}/nearby`),
  inquire: (id, b) => api.post(`/properties/${id}/inquiries`, b),
  visitSlots: (id, date) => api.get(`/properties/${id}/visit-slots`, { date }),
  bookVisit: (id, b) => api.post(`/properties/${id}/visits`, b),
};

export const myApi = {
  properties: (query) => api.get('/my/properties', query),
  createProperty: (formData) => api.post('/my/properties', formData),
  deleteProperty: (id) => api.del(`/my/properties/${id}`),
  orders: (query) => api.get('/my/orders', query),
  visits: (query) => api.get('/my/visits', query),
  cancelVisit: (id) => api.post(`/my/visits/${id}/cancel`),
  checkout: (b) => api.post('/payments/checkout', b),
  wishlist: (query) => api.get('/wishlist', query),
  wishAdd: (id) => api.post(`/wishlist/${id}`),
  wishRemove: (id) => api.del(`/wishlist/${id}`),
};

export const contentApi = {
  posts: (query) => api.get('/blog/posts', query),
  post: (id) => api.get(`/blog/posts/${id}`),
  settings: () => api.get('/settings'),
  reviews: () => api.get('/reviews', { per_page: 6 }),
  subscribe: (email) => api.post('/newsletter', { email }),
  contact: (b) => api.post('/contact', b),
};

export const passwordApi = {
  forgot: (email) => api.post('/auth/forgot-password', { email }),
  reset: (body) => api.post('/auth/reset-password', body),
};
