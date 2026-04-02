import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
}

const TOKEN_FILE = path.join(os.homedir(), '.freeagent-mcp-tokens.json');

export function saveTokens(tokens: TokenData): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function loadTokens(): TokenData | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

export function clearTokens(): void {
  try { fs.unlinkSync(TOKEN_FILE); } catch { /* ignore */ }
}

export function isTokenExpired(tokens: TokenData): boolean {
  return Date.now() >= tokens.expires_at - 60000;
}
