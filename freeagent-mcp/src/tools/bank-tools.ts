import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  listBankAccounts,
  extractIdFromUrl,
} from "../api/bank-accounts.js";
import {
  listBankTransactions,
  listUnexplainedTransactions,
  explainTransaction,
} from "../api/bank-transactions.js";
import { formatCurrency, formatDate } from "../utils/pagination.js";
import { suggestCategory } from "../utils/categories.js";

export function registerBankTools(server: McpServer): void {
  server.tool(
    "list_bank_accounts",
    "List all bank accounts in FreeAgent with their current balances. Shows account name, type, balance, and status.",
    {},
    async () => {
      const accounts = await listBankAccounts();

      if (accounts.length === 0) {
        return {
          content: [{ type: "text", text: "No bank accounts found in FreeAgent." }],
        };
      }

      const lines = accounts.map((a) => {
        const id = extractIdFromUrl(a.url);
        return `- **${a.name}** (ID: ${id}) | Type: ${a.type} | Balance: ${formatCurrency(a.current_balance)} | ${a.is_personal ? "Personal" : "Business"} | Status: ${a.status}`;
      });

      const totalBalance = accounts.reduce(
        (sum, a) => sum + parseFloat(a.current_balance),
        0
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${accounts.length} bank account(s):\n\n${lines.join("\n")}\n\n**Combined Balance:** ${formatCurrency(totalBalance)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_bank_transactions",
    "Get bank transactions for a specific account. Can filter by date range and show only unexplained (uncoded) transactions.",
    {
      bank_account_id: z.string().describe("The FreeAgent bank account ID"),
      from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      unexplained_only: z
        .boolean()
        .optional()
        .default(false)
        .describe("Only show unexplained/uncoded transactions"),
    },
    async ({ bank_account_id, from_date, to_date, unexplained_only }) => {
      const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      const transactions = unexplained_only
        ? await listUnexplainedTransactions(accountUrl, params)
        : await listBankTransactions(accountUrl, params);

      if (transactions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: unexplained_only
                ? "No unexplained transactions found — all transactions are coded!"
                : "No transactions found for the given criteria.",
            },
          ],
        };
      }

      const lines = transactions.map((t) => {
        const id = t.url.split("/").pop();
        const unexplained =
          parseFloat(t.unexplained_amount) !== 0
            ? ` | **UNEXPLAINED: ${formatCurrency(t.unexplained_amount)}**`
            : "";
        return `- ${formatDate(t.dated_on)} | ${formatCurrency(t.amount)} | ${t.description}${unexplained} (ID: ${id})`;
      });

      const totalAmount = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${transactions.length} transaction(s):\n\n${lines.join("\n")}\n\n**Total:** ${formatCurrency(totalAmount)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "explain_transaction",
    "Explain (code) a bank transaction by assigning it to a category. This marks the transaction as reconciled in FreeAgent.",
    {
      transaction_id: z.string().describe("The bank transaction ID"),
      category: z
        .string()
        .describe(
          "FreeAgent category URL or code (e.g., '233' for Software & IT)"
        ),
      description: z
        .string()
        .optional()
        .describe("Description for the explanation"),
      gross_value: z
        .string()
        .optional()
        .describe("Amount to explain (defaults to full transaction amount)"),
    },
    async ({ transaction_id, category, description, gross_value }) => {
      const transactionUrl = `https://api.freeagent.com/v2/bank_transactions/${transaction_id}`;
      const categoryUrl = category.startsWith("http")
        ? category
        : `https://api.freeagent.com/v2/categories/${category}`;

      const explanation = await explainTransaction(transactionUrl, {
        category: categoryUrl,
        description,
        gross_value,
      });

      return {
        content: [
          {
            type: "text",
            text: `Transaction ${transaction_id} explained successfully.\n- Category: ${explanation.category}\n- Amount: ${formatCurrency(explanation.gross_value)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "suggest_transaction_categories",
    "Analyse unexplained bank transactions and suggest categories based on description patterns. Helps batch-code transactions quickly.",
    {
      bank_account_id: z.string().describe("The FreeAgent bank account ID"),
      from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ bank_account_id, from_date, to_date }) => {
      const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      const transactions = await listUnexplainedTransactions(
        accountUrl,
        params
      );

      if (transactions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No unexplained transactions found — everything is already coded!",
            },
          ],
        };
      }

      const suggestions = transactions.map((t) => {
        const id = t.url.split("/").pop();
        const suggestion = suggestCategory(
          t.description + " " + (t.full_description || "")
        );
        const suggestionText = suggestion
          ? `→ Suggested: **${suggestion.category}** (${suggestion.reason})`
          : "→ No automatic suggestion — needs manual review";
        return `- ${formatDate(t.dated_on)} | ${formatCurrency(t.amount)} | "${t.description}" ${suggestionText} (ID: ${id})`;
      });

      const matched = transactions.filter((t) =>
        suggestCategory(t.description + " " + (t.full_description || ""))
      ).length;

      return {
        content: [
          {
            type: "text",
            text: `Found ${transactions.length} unexplained transaction(s), ${matched} with suggested categories:\n\n${suggestions.join("\n")}\n\nTo apply a suggestion, use the explain_transaction tool with the transaction ID and category code.`,
          },
        ],
      };
    }
  );
}
