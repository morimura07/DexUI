import { API_BASE as BASE } from '../config';

export const adminCall = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('ss_token') || localStorage.getItem('ss_admin_token');
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const config = { method, headers };
  if (data && method !== 'GET') config.body = JSON.stringify(data);
  const url = data && method === 'GET'
    ? `${BASE}/${endpoint}?${new URLSearchParams(data)}`
    : `${BASE}/${endpoint}`;
  try {
    const res = await fetch(url, config);
    return { ...(await res.json()), status: res.status };
  } catch (e) {
    return { success: false, error: { message: e.message }, status: 0 };
  }
};

// Binary GET for admin-authenticated file streams (KYC documents). adminCall()
// always parses the response as JSON, which throws on an image or PDF body.
// Errors still come back as JSON, so those are read the normal way.
export const adminBlob = async (endpoint) => {
  const token = localStorage.getItem('ss_token') || localStorage.getItem('ss_admin_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}/${endpoint}`, { headers });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      return { success: false, error: { message: j?.error?.message || `HTTP ${res.status}` }, status: res.status };
    }
    const blob = await res.blob();
    return { success: true, blob, type: blob.type || res.headers.get('Content-Type') || '', status: res.status };
  } catch (e) {
    return { success: false, error: { message: e.message }, status: 0 };
  }
};