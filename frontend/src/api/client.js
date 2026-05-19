// Tiny fetch wrapper. Attaches the JWT from localStorage and centralises
// error handling so pages can just `await api.get('/expenses')`.

const TOKEN_KEY = 'et_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on network failure (backend not running, etc.)
    throw new Error('Cannot reach the server. Is the backend running on port 5000?');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text; // non-JSON body (e.g. proxy error / HTML error page)
    }
  }

  if (!res.ok) {
    let message;
    if (data && typeof data === 'object' && data.error) {
      message = data.error;
    } else if (res.status >= 500) {
      // Non-JSON 5xx almost always means the backend crashed or the DB
      // connection failed — point the user at the real place to look.
      message =
        'Server error (500). The backend may have crashed or cannot connect ' +
        'to MongoDB — check the backend terminal for the actual error.';
    } else {
      message = `Request failed (${res.status})`;
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};
