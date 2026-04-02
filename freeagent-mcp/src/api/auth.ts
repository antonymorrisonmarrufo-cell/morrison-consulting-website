import * as http from 'http';
import { CONFIG } from '../utils/config.js';
import { saveTokens, loadTokens, isTokenExpired } from '../utils/token-store.js';

async function exchangeCode(code: string): Promise<any> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: CONFIG.redirectUri,
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
  });
  const resp = await fetch(CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.status}`);
  return resp.json();
}

async function refreshAccessToken(refreshToken: string): Promise<any> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
  });
  const resp = await fetch(CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok) throw new Error(`Token refresh failed: ${resp.status}`);
  return resp.json();
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;
  if (isTokenExpired(tokens)) {
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      saveTokens({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        token_type: newTokens.token_type,
        expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
      });
      return newTokens.access_token;
    } catch { return null; }
  }
  return tokens.access_token;
}

export function startAuthFlow(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${CONFIG.callbackPort}`);
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        if (code) {
          try {
            const tokenData = await exchangeCode(code);
            saveTokens({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              token_type: tokenData.token_type,
              expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
            });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Connected to FreeAgent!</h1><p>You can close this window.</p>');
            server.close();
            resolve('Connected successfully');
          } catch (e: any) {
            res.writeHead(500);
            res.end('Auth failed');
            server.close();
            reject(e);
          }
        } else {
          res.writeHead(400);
          res.end('No code');
          server.close();
          reject(new Error('No auth code'));
        }
      }
    });
    server.listen(CONFIG.callbackPort, () => {
      const authUrl = `${CONFIG.authUrl}?redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}&response_type=code&client_id=${CONFIG.clientId}`;
      import('open').then(m => m.default(authUrl)).catch(() => {
        resolve(`Open this URL in your browser: ${authUrl}`);
      });
    });
    setTimeout(() => { server.close(); reject(new Error('Auth timeout')); }, 120000);
  });
}

export function getAuthStatus(): { connected: boolean; message: string } {
  const tokens = loadTokens();
  if (!tokens) return { connected: false, message: 'Not connected. Use freeagent_auth to connect.' };
  if (isTokenExpired(tokens)) return { connected: false, message: 'Token expired. Will refresh on next API call.' };
  return { connected: true, message: 'Connected to FreeAgent.' };
}
