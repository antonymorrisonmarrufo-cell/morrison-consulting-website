import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listBankAccounts, extractIdFromUrl } from "../api/bank-accounts.js";
import {
  listBankTransactions,
  listUnexplainedTransactions,
} from "../api/bank-transactions.js";
import { formatCurrency, formatDate } from "../utils/pagination.js";

export function registerReconciliationTools(server: McpServer): void {
  server.tool(
    "reconcile_account",
    "Compare FreeAgent's balance for a bank account against an actual bank balance you provide. Identifies any discrepancy and lists unexplained transactions that might be causing it.",
    {
      bank_account_id: z.string().describe("The FreeAgent bank account ID"),
      actual_balance: z
        .string()
        .describe("The actual balance shown on your bank statement"),
      as_of_date: z
        .string()
        .optional()
        .describe("Statement date (YYYY-MM-DD, defaults to today)"),
    },
    async ({ bank_account_id, actual_balance, as_of_date }) => {
      const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
      const accounts = await listBankAccounts();
      const account = accounts.find(
        (a) => extractIdFromUrl(a.url) === bank_account_id
      );

      if (!account) {
        return {
          content: [
            {
              type: "text",
              text: `Bank account ${bank_account_id} not found.`,
            },
          ],
        };
      }

      const freeagentBalance = parseFloat(account.current_balance);
      const bankBalance = parseFloat(actual_balance);
      const difference = Math.abs(freeagentBalance - bankBalance);

      const params: Record<string, string> = {};
      if (as_of_date) params.to_date = as_of_date;

      const unexplained = await listUnexplainedTransactions(
        accountUrl,
        params
      );

      const totalUnexplained = unexplained.reduce(
        (sum, t) => sum + parseFloat(t.unexplained_amount),
        0
      );

      let status: string;
      if (difference < 0.01) {
        status = "BALANCED — FreeAgent matches your bank statement perfectly.";
      } else if (difference < 1) {
        status = `MINOR ROUNDING — difference of ${formatCurrency(difference)} (likely rounding).`;
      } else {
        status = `DISCREPANCY of ${formatCurrency(difference)} — FreeAgent and bank do not match.`;
      }

      let report = `## Reconciliation Report: ${account.name}\n\n`;
      report += `- **FreeAgent Balance:** ${formatCurrency(freeagentBalance)}\n`;
      report += `- **Actual Bank Balance:** ${formatCurrency(bankBalance)}\n`;
      report += `- **Status:** ${status}\n`;
      report += `- **Unexplained Transactions:** ${unexplained.length} totalling ${formatCurrency(totalUnexplained)}\n`;

      if (unexplained.length > 0) {
        report += `\n### Unexplained Transactions:\n`;
        unexplained.forEach((t) => {
          const id = t.url.split("/").pop();
          report += `- ${formatDate(t.dated_on)} | ${formatCurrency(t.amount)} | ${t.description} (ID: ${id})\n`;
        });
        report += `\nThese unexplained transactions may account for the difference. Use suggest_transaction_categories to get coding suggestions.`;
      }

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "find_unexplained_transactions",
    "Find all uncoded/unexplained transactions across ALL bank accounts. Great for a quick health check of your books.",
    {
      from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ from_date, to_date }) => {
      const accounts = await listBankAccounts();
      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      let report = "## Unexplained Transactions Across All Accounts\n\n";
      let grandTotal = 0;
      let grandCount = 0;

      for (const account of accounts) {
        const unexplained = await listUnexplainedTransactions(
          account.url,
          params
        );
        if (unexplained.length === 0) continue;

        const total = unexplained.reduce(
          (sum, t) => sum + Math.abs(parseFloat(t.unexplained_amount)),
          0
        );
        grandTotal += total;
        grandCount += unexplained.length;

        report += `### ${account.name} (${unexplained.length} unexplained)\n`;
        unexplained.forEach((t) => {
          const id = t.url.split("/").pop();
          report += `- ${formatDate(t.dated_on)} | ${formatCurrency(t.amount)} | ${t.description} (ID: ${id})\n`;
        });
        report += `\n`;
      }

      if (grandCount === 0) {
        return {
          content: [
            {
              type: "text",
              text: "All transactions across all accounts are explained — your books are clean!",
            },
          ],
        };
      }

      report += `---\n**Total:** ${grandCount} unexplained transaction(s) worth ${formatCurrency(grandTotal)} across ${accounts.length} account(s).`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "compare_all_balances",
    "Quick overview of all bank account balances in FreeAgent. Use this to get a snapshot of your financial position.",
    {},
    async () => {
      const accounts = await listBankAccounts();

      let report = "## Bank Account Balances Summary\n\n";
      let totalBusiness = 0;
      let totalPersonal = 0;

      for (const account of accounts) {
        const balance = parseFloat(account.current_balance);
        const id = extractIdFromUrl(account.url);
        report += `- **${account.name}** | ${formatCurrency(balance)} | ${account.type} | ${account.is_personal ? "Personal" : "Business"} | Last Activity: ${account.latest_activity || "N/A"} (ID: ${id})\n`;

        if (account.is_personal) {
          totalPersonal += balance;
        } else {
          totalBusiness += balance;
        }
      }

      report += `\n---\n`;
      report += `**Business Total:** ${formatCurrency(totalBusiness)}\n`;
      report += `**Personal Total:** ${formatCurrency(totalPersonal)}\n`;
      report += `**Combined Total:** ${formatCurrency(totalBusiness + totalPersonal)}\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );
}
