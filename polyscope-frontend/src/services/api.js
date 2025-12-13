const DEV_BASE = '/api'
const PROD_BASE = 'https://polyscope.onrender.com/api'

const isLocalhost = (() => {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
})()

const API_BASE = import.meta.env?.VITE_API_BASE || (isLocalhost || import.meta.env?.DEV ? DEV_BASE : PROD_BASE)

export async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const message = json.error || json.message || `Request failed: ${res.status}`;
    const code = json.code || 'REQUEST_FAILED';
    throw Object.assign(new Error(message), { code, status: res.status });
  }
  return json.data ?? json; // some endpoints return {success,data}, others raw
}

export const marketsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/markets${qs ? `?${qs}` : ''}`);
  },
  search: (q, params = {}) => {
    const qs = new URLSearchParams({ q, ...params }).toString();
    return request(`/markets/search?${qs}`);
  },
  trending: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/markets/trending${qs ? `?${qs}` : ''}`);
  },
  byCategory: (category, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/markets/category/${encodeURIComponent(category)}${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/markets/${id}`),
};

export const predictionsAPI = {
  predict: (id, option, timeframe = 'daily') => {
    const qs = new URLSearchParams({ option, timeframe }).toString();
    return request(`/markets/${id}/predict?${qs}`);
  },
  predictAll: (id, timeframe = 'daily') => {
    const qs = new URLSearchParams({ timeframe }).toString();
    return request(`/markets/${id}/predict-all?${qs}`);
  },
  features: (id, option, timeframe = 'daily') => {
    const qs = new URLSearchParams({ option, timeframe }).toString();
    return request(`/markets/${id}/features?${qs}`);
  },
};

export const notificationsAPI = {
  subscribeEmail: ({ email, frequency }) => {
    const preferences = { frequency };
    return request('/notifications/email/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, preferences }),
    });
  },
  vapidPublicKey: () => request('/notifications/push/vapid-public-key'),
};
