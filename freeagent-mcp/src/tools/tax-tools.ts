import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listExpenses } from "../api/expenses.js";
import { listBankAccounts } from "../api/bank-accounts.js";
import { listBankTransactions } from "../api/bank-transactions.js";
import { formatCurrency } from "../utils/pagination.js";
import { suggestCategory, EXPENSE_CATEGORIES } from "../utils/categories.js";

// UK tax year runs 6 April to 5 April
function getTaxYearDates(taxYear?: string): {
  from_date: string;
  to_date: string;
  label: string;
} {
  const now = new Date();
  let startYear: number;

  if (taxYear) {
    startYear = parseInt(taxYear.split("/")[0] || taxYear);
  } else {
    // Current tax year
    startYear = now.getMonth() >= 3 && now.getDate() >= 6
      ? now.getFullYear()
      : now.getFullYear() - 1;
  }

  return {
    from_date: `${startYear}-04-06`,
    to_date: `${startYear + 1}-04-05`,
    label: `${startYear}/${startYear + 1}`,
  };
}

export function registerTaxTools(server: McpServer): void {
  server.tool(
    "tax_efficiency_report",
    "Generate a tax efficiency report showing claimed expenses vs potential unclaimed expenses. Identifies opportunities to maximise legitimate tax deductions for the current or specified tax year.",
    {
      tax_year: z
        .string()
        .optional()
        .describe(
          "Tax year (e.g., '2024/2025' or '2024'). Defaults to current tax year."
        ),
    },
    async ({ tax_year }) => {
      const { from_date, to_date, label } = getTaxYearDates(tax_year);

      // Get all expenses for the tax year
      const expenses = await listExpenses({ from_date, to_date });
      const totalClaimed = expenses.reduce(
        (sum, e) => sum + parseFloat(e.gross_value),
        0
      );

      // Group expenses by category
      const categoryTotals = new Map<string, number>();
      for (const expense of expenses) {
        const cat = expense.category.split("/").pop() || "unknown";
        categoryTotals.set(
          cat,
          (categoryTotals.get(cat) ?? 0) + parseFloat(expense.gross_value)
        );
      }

      // Get bank transactions to find potentially claimable items not yet expensed
      const accounts = await listBankAccounts();
      const businessAccounts = accounts.filter((a) => !a.is_personal);

      let potentialUnclaimed: Array<{
        description: string;
        amount: number;
        date: string;
        suggestion: string;
      }> = [];

      for (const account of businessAccounts) {
        const transactions = await listBankTransactions(account.url, {
          from_date,
          to_date,
        });

        for (const t of transactions) {
          const amount = parseFloat(t.amount);
          if (amount >= 0) continue; // Only look at outgoing

          const suggestion = suggestCategory(
            t.description + " " + (t.full_description || "")
          );
          if (suggestion) {
            // Check if this might already be an expense
            const matchingExpense = expenses.find(
              (e) =>
                Math.abs(parseFloat(e.gross_value) - Math.abs(amount)) < 0.01 &&
                e.dated_on === t.dated_on
            );

            if (!matchingExpense) {
              potentialUnclaimed.push({
                description: t.description,
                amount: Math.abs(amount),
                date: t.dated_on,
                suggestion: suggestion.reason,
              });
            }
          }
        }
      }

      // Build report
      let report = `## Tax Efficiency Report — ${label}\n\n`;

      report += `### Expenses Claimed\n`;
      report += `**Total Claimed:** ${formatCurrency(totalClaimed)}\n\n`;

      if (categoryTotals.size > 0) {
        report += `| Category | Amount |\n|----------|--------|\n`;
        const sorted = [...categoryTotals.entries()].sort(
          (a, b) => b[1] - a[1]
        );
        for (const [cat, total] of sorted) {
          // Try to find friendly name
          const friendlyName =
            Object.entries(EXPENSE_CATEGORIES).find(
              ([, code]) => code === cat
            )?.[0] ?? cat;
          report += `| ${friendlyName} | ${formatCurrency(total)} |\n`;
        }
      }

      report += `\n### Potentially Unclaimed Expenses\n`;
      if (potentialUnclaimed.length === 0) {
        report += `No obvious unclaimed expenses found — you may be claiming everything already!\n`;
      } else {
        report += `Found ${potentialUnclaimed.length} transaction(s) that look like they could be claimed:\n\n`;
        for (const item of potentialUnclaimed.slice(0, 50)) {
          report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" — ${item.suggestion}\n`;
        }
        const potentialTotal = potentialUnclaimed.reduce(
          (sum, i) => sum + i.amount,
          0
        );
        report += `\n**Potential Additional Claims:** ${formatCurrency(potentialTotal)}\n`;

        // Estimate tax saving (assuming basic rate 20% + NI)
        const estimatedSaving = potentialTotal * 0.19; // Corporation tax rate
        report += `**Estimated Tax Saving:** ~${formatCurrency(estimatedSaving)} (at 19% corporation tax)\n`;
      }

      report += `\n### Common Allowable Expenses to Check\n`;
      report += `- **Home office costs** — proportion of rent/mortgage, utilities, broadband\n`;
      report += `- **Professional subscriptions** — industry memberships, journals\n`;
      report += `- **Training & development** — courses, books, conferences\n`;
      report += `- **Phone costs** — business use proportion of mobile bill\n`;
      report += `- **Mileage** — 45p/mile first 10,000 miles, 25p/mile thereafter\n`;
      report += `- **Insurance** — professional indemnity, cyber, public liability\n`;
      report += `- **Bank charges** — business account fees\n`;
      report += `- **Accountancy fees** — your Accrue fees\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "identify_claimable_expenses",
    "Scan personal bank/credit card transactions for items that could legitimately be claimed as business expenses. Helps ensure you're not missing deductions.",
    {
      bank_account_id: z
        .string()
        .describe("The personal bank account ID in FreeAgent to scan"),
      from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ bank_account_id, from_date, to_date }) => {
      const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      const transactions = await listBankTransactions(accountUrl, params);

      const claimable: Array<{
        description: string;
        amount: number;
        date: string;
        category: string;
        reason: string;
        confidence: string;
      }> = [];

      for (const t of transactions) {
        const amount = parseFloat(t.amount);
        if (amount >= 0) continue;

        const suggestion = suggestCategory(
          t.description + " " + (t.full_description || "")
        );
        if (suggestion) {
          // Determine confidence based on category
          let confidence = "Medium";
          if (
            suggestion.category.includes("Software") ||
            suggestion.category.includes("Train") ||
            suggestion.category.includes("Air") ||
            suggestion.category.includes("Hotel")
          ) {
            confidence = "High";
          }
          if (
            suggestion.reason.includes("personal") ||
            suggestion.reason.includes("check")
          ) {
            confidence = "Low — needs verification";
          }

          claimable.push({
            description: t.description,
            amount: Math.abs(amount),
            date: t.dated_on,
            category: suggestion.category,
            reason: suggestion.reason,
            confidence,
          });
        }
      }

      if (claimable.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No obvious business expenses found in this personal account for the given period.",
            },
          ],
        };
      }

      let report = `## Potential Business Expenses in Personal Account\n\n`;
      report += `Found ${claimable.length} potential business expense(s):\n\n`;

      // Group by confidence
      const high = claimable.filter((c) => c.confidence === "High");
      const medium = claimable.filter((c) => c.confidence === "Medium");
      const low = claimable.filter((c) => c.confidence.startsWith("Low"));

      if (high.length > 0) {
        report += `### High Confidence (likely claimable)\n`;
        for (const item of high) {
          report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" → ${item.category}\n`;
        }
      }

      if (medium.length > 0) {
        report += `\n### Medium Confidence (probably claimable)\n`;
        for (const item of medium) {
          report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" → ${item.category}\n`;
        }
      }

      if (low.length > 0) {
        report += `\n### Low Confidence (needs checking)\n`;
        for (const item of low) {
          report += `- ${item.date} | ${formatCurrency(item.amount)} | "${item.description}" → ${item.category} — ${item.reason}\n`;
        }
      }

      const totalClaimable = claimable.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      report += `\n---\n**Total Potential Claims:** ${formatCurrency(totalClaimable)}\n`;
      report += `**Estimated Tax Saving:** ~${formatCurrency(totalClaimable * 0.19)} (at 19% corporation tax)\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );
}
