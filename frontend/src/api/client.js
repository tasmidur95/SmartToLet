// Tiny fetch wrapper around the Laravel API. Every response has the shape
// { success, message, data, meta?, links? }  or  { success:false, message, code, errors? }.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const makeStore = (key) => ({
  get: () => localStorage.getItem(key),
  set: (t) => localStorage.setItem(key, t),
  clear: () => localStorage.removeItem(key),
});

// Site visitors and admins sign in separately and keep separate tokens.
export const tokenStore = makeStore('hr_token');
export const adminTokenStore = makeStore('hr_admin_token');

export class ApiError extends Error {
  constructor(message, status, code, errors) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors || null; // { field: [messages] }
  }
  /** First validation message for a field, if any. */
  field(name) {
    return this.errors && this.errors[name] ? this.errors[name][0] : '';
  }
}

function buildQuery(query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function request(path, { method = 'GET', body, query, scope = 'user' } = {}) {
  const store = scope === 'admin' ? adminTokenStore : tokenStore;
  const token = store.get();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(query)}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0, 'NETWORK_ERROR');
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || (json && json.success === false)) {
    if (res.status === 401 && token) {
      store.clear();
      window.dispatchEvent(new Event(scope === 'admin' ? 'admin:expired' : 'auth:expired'));
    }
    throw new ApiError(json?.message || `Request failed (${res.status})`, res.status, json?.code, json?.errors);
  }
  return json || { success: true, data: null };
}

/** Download a file (CSV etc.) with the admin token and save it in the browser. */
export async function downloadFile(path, query, filename, scope = 'admin') {
  const token = (scope === 'admin' ? adminTokenStore : tokenStore).get();
  const res = await fetch(`${API_URL}${path}${buildQuery(query)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiError('Download failed', res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
