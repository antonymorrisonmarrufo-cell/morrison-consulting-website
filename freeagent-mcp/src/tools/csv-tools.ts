import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "fs/promises";
import { formatCurrency } from "../utils/pagination.js";
import { suggestCategory } from "../utils/categories.js";
import { listBankTransactions } from "../api/bank-transactions.js";
import { listBankAccounts } from "../api/bank-accounts.js";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type?: string;
}

function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const transactions: ParsedTransaction[] = [];

  // Detect CSV format by headers
  const headers = header.split(",").map((h) => h.trim().replace(/"/g, ""));

  // Find relevant column indices
  let dateIdx = headers.findIndex((h) =>
    /date|trans.*date|posted/i.test(h)
  );
  let descIdx = headers.findIndex((h) =>
    /desc|narrative|details|memo|reference/i.test(h)
  );
  let amountIdx = headers.findIndex((h) =>
    /^amount$|value|trans.*amount/i.test(h)
  );
  let debitIdx = headers.findIndex((h) => /debit|withdrawal|out/i.test(h));
  let creditIdx = headers.findIndex((h) => /credit|deposit|in/i.test(h));
  let balanceIdx = headers.findIndex((h) => /balance/i.test(h));

  // Fallback: assume common formats
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = headers.length > 2 ? 1 : 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const date = fields[dateIdx] || "";
    const description = fields[descIdx] || "";

    let amount: number;
    if (amountIdx !== -1) {
      amount = parseFloat(fields[amountIdx]?.replace(/[£,]/g, "") || "0");
    } else if (debitIdx !== -1 && creditIdx !== -1) {
      const debit = parseFloat(
        fields[debitIdx]?.replace(/[£,]/g, "") || "0"
      );
      const credit = parseFloat(
        fields[creditIdx]?.replace(/[£,]/g, "") || "0"
      );
      amount = credit > 0 ? credit : -debit;
    } else {
      amount = 0;
    }

    const balance =
      balanceIdx !== -1
        ? parseFloat(fields[balanceIdx]?.replace(/[£,]/g, "") || "0")
        : undefined;

    if (date && description) {
      transactions.push({ date, description, amount, balance });
    }
  }

  return transactions;
}

export function registerCSVTools(server: McpServer): void {
  server.tool(
    "import_bank_statement",
    "Parse a CSV bank or credit card statement file for analysis. Reads the file and returns a summary of transactions found.",
    {
      file_path: z
        .string()
        .describe("Absolute path to the CSV file to import"),
    },
    async ({ file_path }) => {
      const content = await readFile(file_path, "utf-8");
      const transactions = parseCSV(content);

      if (transactions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Could not parse any transactions from the CSV file. Please check the format.",
            },
          ],
        };
      }

      const totalIn = transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const totalOut = transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const lastBalance =
        transactions[transactions.length - 1]?.balance;

      let report = `## CSV Statement Import\n\n`;
      report += `- **Transactions:** ${transactions.length}\n`;
      report += `- **Period:** ${transactions[0].date} to ${transactions[transactions.length - 1].date}\n`;
      report += `- **Total In:** ${formatCurrency(totalIn)}\n`;
      report += `- **Total Out:** ${formatCurrency(totalOut)}\n`;
      if (lastBalance !== undefined) {
        report += `- **Closing Balance:** ${formatCurrency(lastBalance)}\n`;
      }

      report += `\n### Sample Transactions:\n`;
      const sample = transactions.slice(0, 10);
      for (const t of sample) {
        report += `- ${t.date} | ${formatCurrency(t.amount)} | ${t.description}\n`;
      }

      if (transactions.length > 10) {
        report += `\n... and ${transactions.length - 10} more transactions.\n`;
      }

      report += `\nUse analyse_personal_transactions to scan these for potential business expenses.`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "analyse_personal_transactions",
    "Scan a CSV bank/credit card statement for potential business expenses that could be claimed.",
    {
      file_path: z
        .string()
        .describe("Absolute path to the CSV file to analyse"),
    },
    async ({ file_path }) => {
      const content = await readFile(file_path, "utf-8");
      const transactions = parseCSV(content);

      const claimable: Array<{
        date: string;
        description: string;
        amount: number;
        category: string;
        reason: string;
      }> = [];

      for (const t of transactions) {
        if (t.amount >= 0) continue;

        const suggestion = suggestCategory(t.description);
        if (suggestion) {
          claimable.push({
            date: t.date,
            description: t.description,
            amount: Math.abs(t.amount),
            category: suggestion.category,
            reason: suggestion.reason,
          });
        }
      }

      if (claimable.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No obvious business expenses identified in this statement.",
            },
          ],
        };
      }

      let report = `## Potential Business Expenses Found\n\n`;
      let total = 0;

      for (const item of claimable) {
        report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" → **${item.category}** (${item.reason})\n`;
        total += item.amount;
      }

      report += `\n---\n**Total Potential Claims:** ${formatCurrency(total)}\n`;
      report += `**Estimated Tax Saving:** ~${formatCurrency(total * 0.19)}\n`;
      report += `\n_Note: Review each item — some may be personal. Only claim items with genuine business purpose._`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "cross_reference_accounts",
    "Compare personal bank/credit card transactions (from CSV) against FreeAgent records to find spend that hasn't been captured in the business accounts.",
    {
      file_path: z
        .string()
        .describe("Path to personal bank statement CSV"),
      from_date: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
    },
    async ({ file_path, from_date, to_date }) => {
      const content = await readFile(file_path, "utf-8");
      const personalTransactions = parseCSV(content);

      // Get FreeAgent business transactions
      const accounts = await listBankAccounts();
      const businessAccounts = accounts.filter((a) => !a.is_personal);

      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      const freeagentTransactions: Array<{
        amount: number;
        description: string;
        date: string;
      }> = [];

      for (const account of businessAccounts) {
        const txns = await listBankTransactions(account.url, params);
        freeagentTransactions.push(
          ...txns.map((t) => ({
            amount: Math.abs(parseFloat(t.amount)),
            description: t.description.toLowerCase(),
            date: t.dated_on,
          }))
        );
      }

      // Find personal expenses that look like business costs but aren't in FreeAgent
      const missing: Array<{
        date: string;
        description: string;
        amount: number;
        reason: string;
      }> = [];

      for (const pt of personalTransactions) {
        if (pt.amount >= 0) continue;

        const suggestion = suggestCategory(pt.description);
        if (!suggestion) continue;

        // Check if this transaction exists in FreeAgent
        const absAmount = Math.abs(pt.amount);
        const found = freeagentTransactions.some(
          (ft) =>
            Math.abs(ft.amount - absAmount) < 0.02 &&
            ft.description.includes(
              pt.description.toLowerCase().substring(0, 10)
            )
        );

        if (!found) {
          missing.push({
            date: pt.date,
            description: pt.description,
            amount: absAmount,
            reason: suggestion.reason,
          });
        }
      }

      if (missing.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "All business-like transactions from the personal account appear to be captured in FreeAgent already.",
            },
          ],
        };
      }

      let report = `## Uncaptured Business Expenses\n\n`;
      report += `Found ${missing.length} potential business expense(s) on personal account not found in FreeAgent:\n\n`;

      let total = 0;
      for (const item of missing) {
        report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" — ${item.reason}\n`;
        total += item.amount;
      }

      report += `\n---\n**Total Uncaptured:** ${formatCurrency(total)}\n`;
      report += `**Estimated Tax Saving if Claimed:** ~${formatCurrency(total * 0.19)}\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );
}
