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