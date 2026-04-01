import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface FreeAgentConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  sandbox: boolean;
}

const TOKEN_PATH = join(homedir(), ".freeagent-tokens.json");

export async function loadTokens(): Promise<TokenData | null> {
  try {
    const data = await readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(data) as TokenData;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: TokenData): Promise<void> {
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), {
    mode: 0o600,
  });
}

export function isTokenExpired(tokens: TokenData): boolean {
  return Date.now() >= tokens.expires_at - 60_000; // 1 min buffer
}

export function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://api.sandbox.freeagent.com/v2"
    : "https://api.freeagent.com/v2";
}

export function getConfig(): FreeAgentConfig {
  const client_id = process.env.FREEAGENT_CLIENT_ID ?? "";
  const client_secret = process.env.FREEAGENT_CLIENT_SECRET ?? "";
  const redirect_uri =
    process.env.FREEAGENT_REDIRECT_URI ?? "http://localhost:8919/callback";
  const sandbox = process.env.FREEAGENT_SANDBOX === "true";

  if (!client_id || !client_secret) {
    throw new Error(
      "FREEAGENT_CLIENT_ID and FREEAGENT_CLIENT_SECRET environment variables are required"
    );
  }

  return { client_id, client_secret, redirect_uri, sandbox };
}
