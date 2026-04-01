import { createServer, type IncomingMessage, type ServerResponse } from "http";
import {
  getConfig,
  getBaseUrl,
  saveTokens,
  loadTokens,
  isTokenExpired,
  type TokenData,
} from "./token-store.js";

const TOKEN_ENDPOINT_PATH = "/v2/token_endpoint";

function getAuthBaseUrl(sandbox: boolean): string {
  return sandbox
    ? "https://api.sandbox.freeagent.com"
    : "https://api.freeagent.com";
}

export function getAuthorizationUrl(): string {
  const config = getConfig();
  const base = getAuthBaseUrl(config.sandbox);
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    response_type: "code",
  });
  return `${base}/v2/approve_app?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenData> {
  const config = getConfig();
  const base = getAuthBaseUrl(config.sandbox);
  const credentials = Buffer.from(
    `${config.client_id}:${config.client_secret}`
  ).toString("base64");

  const response = await fetch(`${base}${TOKEN_ENDPOINT_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirect_uri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Token exchange failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };

  await saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<TokenData> {
  const config = getConfig();
  const existingTokens = await loadTokens();
  if (!existingTokens?.refresh_token) {
    throw new Error("No refresh token available. Please re-authorize.");
  }

  const base = getAuthBaseUrl(config.sandbox);
  const credentials = Buffer.from(
    `${config.client_id}:${config.client_secret}`
  ).toString("base64");

  const response = await fetch(`${base}${TOKEN_ENDPOINT_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: existingTokens.refresh_token,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  const tokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };

  await saveTokens(tokens);
  return tokens;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "Not authenticated. Use the freeagent_auth tool to authorize first."
    );
  }

  if (isTokenExpired(tokens)) {
    const refreshed = await refreshAccessToken();
    return refreshed.access_token;
  }

  return tokens.access_token;
}

export function startAuthCallbackServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url ?? "/", "http://localhost:8919");
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Authorization Failed</h1><p>${error}</p><p>You can close this window.</p></body></html>`
          );
          server.close();
          reject(new Error(`Authorization denied: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Authorization Successful!</h1><p>You can close this window. Claude is now connected to FreeAgent.</p></body></html>`
          );
          server.close();
          resolve(code);
          return;
        }

        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(
          `<html><body><h1>No authorization code received</h1><p>Please try again.</p></body></html>`
        );
      }
    );

    server.listen(8919, () => {
      // Server listening for OAuth callback
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 300_000);
  });
}
