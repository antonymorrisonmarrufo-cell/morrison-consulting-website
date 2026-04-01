#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  getAuthorizationUrl,
  startAuthCallbackServer,
  exchangeCodeForTokens,
  getValidAccessToken,
} from "./auth/oauth.js";
import { loadTokens } from "./auth/token-store.js";
import { registerInvoiceTools } from "./tools/invoice-tools.js";
import { registerBankTools } from "./tools/bank-tools.js";
import { registerExpenseTools } from "./tools/expense-tools.js";
import { registerReconciliationTools } from "./tools/reconciliation-tools.js";
import { registerAnalysisTools } from "./tools/analysis-tools.js";
import { registerTaxTools } from "./tools/tax-tools.js";
import { registerCSVTools } from "./tools/csv-tools.js";

const server = new McpServer({
  name: "freeagent-mcp",
  version: "1.0.0",
});

// Auth tool — must be run once to connect to FreeAgent
server.tool(
  "freeagent_auth",
  "Authorize Claude to access your FreeAgent account. This starts the OAuth flow — opens a browser window where you approve access, then captures the authorization automatically. Only needs to be done once.",
  {
    manual_code: z
      .string()
      .optional()
      .describe(
        "If you already have an authorization code (from the URL bar after approving), paste it here instead of using the automatic callback server."
      ),
  },
  async ({ manual_code }) => {
    try {
      if (manual_code) {
        // Direct code exchange
        const tokens = await exchangeCodeForTokens(manual_code);
        return {
          content: [
            {
              type: "text",
              text: `Successfully connected to FreeAgent!\n\nAccess token obtained. Token expires at ${new Date(tokens.expires_at).toLocaleString()}.\nRefresh token saved — you won't need to authorize again.`,
            },
          ],
        };
      }

      // Start callback server and get auth URL
      const authUrl = getAuthorizationUrl();
      const callbackPromise = startAuthCallbackServer();

      // Try to open browser
      try {
        const open = await import("open");
        await open.default(authUrl);
      } catch {
        // Browser open failed, user needs to manually visit
      }

      const message = `Please authorize FreeAgent access:\n\n${authUrl}\n\nWaiting for authorization (will timeout in 5 minutes)...\n\nIf the page shows an error, copy the authorization code from the URL bar after ?code= and use this tool again with the manual_code parameter.`;

      // Wait for the callback
      const code = await callbackPromise;
      const tokens = await exchangeCodeForTokens(code);

      return {
        content: [
          {
            type: "text",
            text: `Successfully connected to FreeAgent!\n\nAuthorization completed automatically. Token expires at ${new Date(tokens.expires_at).toLocaleString()}.\nRefresh token saved — you won't need to authorize again.`,
          },
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Authorization failed: ${msg}\n\nTroubleshooting:\n1. Check your FREEAGENT_CLIENT_ID and FREEAGENT_CLIENT_SECRET are correct\n2. Ensure the redirect URI in your FreeAgent app matches: http://localhost:8919/callback\n3. If you see "Unknown Application", your FreeAgent developer app may need time to propagate, or you may need to recreate it\n4. Try visiting the auth URL manually and paste the code using the manual_code parameter`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Auth status check
server.tool(
  "freeagent_auth_status",
  "Check whether Claude is currently connected to FreeAgent and if tokens are valid.",
  {},
  async () => {
    const tokens = await loadTokens();

    if (!tokens) {
      return {
        content: [
          {
            type: "text",
            text: "Not connected to FreeAgent. Use the freeagent_auth tool to authorize.",
          },
        ],
      };
    }

    const expired = Date.now() >= tokens.expires_at;
    const expiresAt = new Date(tokens.expires_at).toLocaleString();

    if (expired) {
      try {
        await getValidAccessToken(); // This will auto-refresh
        return {
          content: [
            {
              type: "text",
              text: `Connected to FreeAgent. Access token was expired but has been automatically refreshed. Ready to use.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Connected to FreeAgent but token refresh failed. Please re-authorize using freeagent_auth.\nError: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Connected to FreeAgent.\n- Access token valid until: ${expiresAt}\n- Refresh token: Available\n- Status: Ready to use`,
        },
      ],
    };
  }
);

// Register all tool groups
registerInvoiceTools(server);
registerBankTools(server);
registerExpenseTools(server);
registerReconciliationTools(server);
registerAnalysisTools(server);
registerTaxTools(server);
registerCSVTools(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FreeAgent MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
