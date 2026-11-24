// api.js - every call to the protected server API (login, complaints, evidence).
// The sign-in token is kept here and sent automatically as "Authorization: Bearer <token>".
let token = '';
let onUnauthorized = null;

export const setAuthToken = value => { token = value || ''; };
export const setUnauthorizedHandler = handler => { onUnauthorized = handler; };
export const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: { ...(raw ? {} : { 'Content-Type': 'application/json' }), ...authHeaders(), ...headers },
      body: raw || body === undefined ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check that it is running.', 0);
  }
  let payload = null;
  try { payload = await response.json(); } catch { /* no JSON body */ }
  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized(); // session expired
    throw new ApiError(payload?.error || `Request failed (${response.status}).`, response.status);
  }
  return payload;
}

const enc = encodeURIComponent;

export const login = (identifier, password, portal) => request('/api/auth/login', { method: 'POST', body: { identifier, password, portal } });
export const logout = () => request('/api/auth/logout', { method: 'POST' }).catch(() => {});

export const fetchComplaints = () => request('/api/complaints').then(result => result.complaints);
export const createComplaint = payload => request('/api/complaints', { method: 'POST', body: payload }).then(result => result.complaint);
export const complaintAction = (id, payload) => request(`/api/complaints/${enc(id)}/actions`, { method: 'POST', body: payload }).then(result => result.complaint);

// The file is sent as the raw request body; the server stores it in MongoDB.
export const uploadEvidence = (id, file) => request(`/api/complaints/${enc(id)}/evidence`, {
  method: 'POST',
  raw: true,
  headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': enc(file.name) },
  body: file,
}).then(result => result.complaint);

// Evidence is protected, so a plain link would not work. Download it with the token, then show it.
export async function openEvidence(complaintId, evidence) {
  const view = window.open('', '_blank'); // opened first so the browser does not block it
  try {
    let response;
    try {
      response = await fetch(`/api/complaints/${enc(complaintId)}/evidence/${enc(evidence.id)}`, { headers: authHeaders() });
    } catch {
      throw new ApiError('Could not reach the server.', 0);
    }
    if (!response.ok) {
      let message = `Could not open the file (${response.status}).`;
      try { message = (await response.json()).error || message; } catch { /* ignore */ }
      throw new ApiError(message, response.status);
    }
    const url = URL.createObjectURL(await response.blob());
    if (view) {
      view.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = evidence.name;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  } catch (error) {
    if (view) view.close();
    throw error;
  }
}
