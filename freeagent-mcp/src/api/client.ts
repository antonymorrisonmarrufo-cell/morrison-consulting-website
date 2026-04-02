import { getAccessToken } from './auth.js';
import { CONFIG } from '../utils/config.js';

export async function freeagentGet(endpoint: string, params?: Record<string, string>): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Run freeagent_auth first.');
  const url = new URL(`${CONFIG.baseUrl}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
  });
  if (!resp.ok) throw new Error(`FreeAgent API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export async function freeagentPost(endpoint: string, body: any): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Run freeagent_auth first.');
  const resp = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`FreeAgent API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export async function freeagentPut(endpoint: string, body: any): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Run freeagent_auth first.');
  const resp = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`FreeAgent API error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}
