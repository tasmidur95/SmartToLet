import { request } from '../api/client.js';

// Same verbs as the public client but always signed with the admin token.
export const adm = {
  get: (path, query) => request(path, { query, scope: 'admin' }),
  post: (path, body) => request(path, { method: 'POST', body, scope: 'admin' }),
  put: (path, body) => request(path, { method: 'PUT', body, scope: 'admin' }),
  patch: (path, body) => request(path, { method: 'PATCH', body, scope: 'admin' }),
  del: (path) => request(path, { method: 'DELETE', scope: 'admin' }),
};
