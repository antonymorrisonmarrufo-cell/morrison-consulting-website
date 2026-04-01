import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listBankAccounts } from "../api/bank-accounts.js";
import { listBankTransactions } from "../api/bank-transactions.js";
import { formatCurrency, formatDate } from "../utils/pagination.js";
import { SUBSCRIPTION_GROUPS } from "../utils/categories.js";

interface RecurringPayment {
  vendor: string;
  amounts: number[];
  dates: string[];
  frequency: string;
  avgAmount: number;
  annualCost: number;
}

function detectRecurringPayments(
  transactions: Array<{ description: string; amount: string; dated_on: string }>
): RecurringPayment[] {
  // Group transactions by normalised vendor name
  const vendorMap = new Map<
    string,
    Array<{ amount: number; date: string; raw: string }>
  >();

  for (const t of transactions) {
    const amount = parseFloat(t.amount);
    if (amount >= 0) continue; // Only look at debits (negative amounts = outgoing)

    // Normalise description to group similar transactions
    const normalised = t.description
      .replace(/\d{2}\/\d{2}\/\d{2,4}/g, "") // Remove dates
      .replace(/\d{6,}/g, "") // Remove long numbers (refs)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!normalised) continue;

    const existing = vendorMap.get(normalised) ?? [];
    existing.push({
      amount: Math.abs(amount),
      date: t.dated_on,
      raw: t.description,
    });
    vendorMap.set(normalised, existing);
  }

  const recurring: RecurringPayment[] = [];

  for (const [vendor, entries] of vendorMap) {
    if (entries.length < 2) continue; // Need at least 2 occurrences

    // Check if amounts are consistent (within 20% of each other)
    const amounts = entries.map((e) => e.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const isConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.2
    );

    if (!isConsistent) continue;

    // Determine frequency
    const sortedDates = entries
      .map((e) => new Date(e.date).getTime())
      .sort((a, b) => a - b);

    const gaps: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      gaps.push(
        (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)
      );
    }
    const avgGap =
      gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

    let frequency: string;
    let multiplier: number;
    if (avgGap >= 25 && avgGap <= 35) {
      frequency = "Monthly";
      multiplier = 12;
    } else if (avgGap >= 6 && avgGap <= 8) {
      frequency = "Weekly";
      multiplier = 52;
    } else if (avgGap >= 85 && avgGap <= 100) {
      frequency = "Quarterly";
      multiplier = 4;
    } else if (avgGap >= 350 && avgGap <= 380) {
      frequency = "Annual";
      multiplier = 1;
    } else {
      frequency = `~${Math.round(avgGap)} days`;
      multiplier = 365 / (avgGap || 1);
    }

    recurring.push({
      vendor: entries[0].raw, // Use original description
      amounts,
      dates: entries.map((e) => e.date),
      frequency,
      avgAmount,
      annualCost: avgAmount * multiplier,
    });
  }

  // Sort by annual cost descending
  recurring.sort((a, b) => b.annualCost - a.annualCost);
  return recurring;
}

function findOverlappingSubscriptions(
  subscriptions: RecurringPayment[]
): Array<{ group: string; matches: string[]; totalAnnual: number }> {
  const overlaps: Array<{
    group: string;
    matches: string[];
    totalAnnual: number;
  }> = [];

  for (const [groupName, services] of Object.entries(SUBSCRIPTION_GROUPS)) {
    const matches = subscriptions.filter((sub) =>
      services.some((service) =>
        sub.vendor.toLowerCase().includes(service.toLowerCase())
      )
    );

    if (matches.length > 1) {
      overlaps.push({
        group: groupName,
        matches: matches.map(
          (m) => `${m.vendor} (${formatCurrency(m.annualCost)}/yr)`
        ),
        totalAnnual: matches.reduce((sum, m) => sum + m.annualCost, 0),
      });
    }
  }

  return overlaps;
}

export function registerAnalysisTools(server: McpServer): void {
  server.tool(
    "find_subscriptions",
    "Scan bank transactions to identify recurring payments and subscriptions. Shows vendor, frequency, and annual cost.",
    {
      bank_account_id: z
        .string()
        .optional()
        .describe("Specific bank account ID (omit to scan all accounts)"),
      months: z
        .number()
        .optional()
        .default(6)
        .describe("Number of months to analyse (default 6)"),
    },
    async ({ bank_account_id, months }) => {
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - months);
      const from_date = fromDate.toISOString().split("T")[0];

      let allTransactions: Array<{
        description: string;
        amount: string;
        dated_on: string;
      }> = [];

      if (bank_account_id) {
        const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
        allTransactions = await listBankTransactions(accountUrl, { from_date });
      } else {
        const accounts = await listBankAccounts();
        for (const account of accounts) {
          const txns = await listBankTransactions(account.url, { from_date });
          allTransactions.push(...txns);
        }
      }

      const recurring = detectRecurringPayments(allTransactions);

      if (recurring.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No recurring payments detected in the analysed period.",
            },
          ],
        };
      }

      let report = `## Recurring Payments & Subscriptions (last ${months} months)\n\n`;
      let totalAnnual = 0;

      for (const sub of recurring) {
        report += `- **${sub.vendor}** | ${sub.frequency} | ~${formatCurrency(sub.avgAmount)}/payment | **${formatCurrency(sub.annualCost)}/year**\n`;
        totalAnnual += sub.annualCost;
      }

      report += `\n---\n**Total Estimated Annual Subscription Cost:** ${formatCurrency(totalAnnual)}\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "find_duplicate_subscriptions",
    "Identify overlapping subscriptions where you may be paying for multiple services that do the same thing. Suggests which ones you could cancel.",
    {
      bank_account_id: z
        .string()
        .optional()
        .describe("Specific bank account ID (omit to scan all accounts)"),
      months: z
        .number()
        .optional()
        .default(6)
        .describe("Number of months to analyse (default 6)"),
    },
    async ({ bank_account_id, months }) => {
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - months);
      const from_date = fromDate.toISOString().split("T")[0];

      let allTransactions: Array<{
        description: string;
        amount: string;
        dated_on: string;
      }> = [];

      if (bank_account_id) {
        const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
        allTransactions = await listBankTransactions(accountUrl, { from_date });
      } else {
        const accounts = await listBankAccounts();
        for (const account of accounts) {
          const txns = await listBankTransactions(account.url, { from_date });
          allTransactions.push(...txns);
        }
      }

      const recurring = detectRecurringPayments(allTransactions);
      const overlaps = findOverlappingSubscriptions(recurring);

      if (overlaps.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No overlapping subscriptions detected. Each service appears to serve a unique purpose.",
            },
          ],
        };
      }

      let report = `## Potential Duplicate/Overlapping Subscriptions\n\n`;
      let totalSavings = 0;

      for (const overlap of overlaps) {
        const cheapest = Math.min(
          ...recurring
            .filter((r) =>
              overlap.matches.some((m) =>
                m.includes(r.vendor)
              )
            )
            .map((r) => r.annualCost)
        );
        const potentialSaving = overlap.totalAnnual - cheapest;
        totalSavings += potentialSaving;

        report += `### ${overlap.group}\n`;
        report += `You have ${overlap.matches.length} services in this category:\n`;
        overlap.matches.forEach((m) => {
          report += `- ${m}\n`;
        });
        report += `**Combined annual cost:** ${formatCurrency(overlap.totalAnnual)}\n`;
        report += `**Potential saving if consolidated:** ~${formatCurrency(potentialSaving)}/year\n\n`;
      }

      report += `---\n**Total Potential Annual Savings:** ${formatCurrency(totalSavings)}\n`;
      report += `\n_Review each group carefully — some overlaps may be intentional (e.g., business + personal use)._`;

      return { content: [{ type: "text", text: report }] };
    }
  );

  server.tool(
    "spending_summary",
    "Get a breakdown of spending by category with trends. Shows where money is going and how spending changes month-over-month.",
    {
      bank_account_id: z
        .string()
        .optional()
        .describe("Specific bank account ID (omit to scan all accounts)"),
      months: z
        .number()
        .optional()
        .default(3)
        .describe("Number of months to analyse (default 3)"),
    },
    async ({ bank_account_id, months }) => {
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - months);
      const from_date = fromDate.toISOString().split("T")[0];

      let allTransactions: Array<{
        description: string;
        amount: string;
        dated_on: string;
      }> = [];

      if (bank_account_id) {
        const accountUrl = `https://api.freeagent.com/v2/bank_accounts/${bank_account_id}`;
        allTransactions = await listBankTransactions(accountUrl, { from_date });
      } else {
        const accounts = await listBankAccounts();
        for (const account of accounts) {
          const txns = await listBankTransactions(account.url, { from_date });
          allTransactions.push(...txns);
        }
      }

      // Group by month
      const monthlySpend = new Map<string, number>();
      const monthlyIncome = new Map<string, number>();

      for (const t of allTransactions) {
        const month = t.dated_on.substring(0, 7); // YYYY-MM
        const amount = parseFloat(t.amount);

        if (amount < 0) {
          monthlySpend.set(month, (monthlySpend.get(month) ?? 0) + Math.abs(amount));
        } else {
          monthlyIncome.set(month, (monthlyIncome.get(month) ?? 0) + amount);
        }
      }

      const sortedMonths = [
        ...new Set([...monthlySpend.keys(), ...monthlyIncome.keys()]),
      ].sort();

      let report = `## Spending Summary (last ${months} months)\n\n`;
      report += `| Month | Income | Spending | Net |\n`;
      report += `|-------|--------|----------|-----|\n`;

      let totalIncome = 0;
      let totalSpend = 0;

      for (const month of sortedMonths) {
        const income = monthlyIncome.get(month) ?? 0;
        const spend = monthlySpend.get(month) ?? 0;
        const net = income - spend;
        totalIncome += income;
        totalSpend += spend;
        report += `| ${month} | ${formatCurrency(income)} | ${formatCurrency(spend)} | ${formatCurrency(net)} |\n`;
      }

      report += `| **Total** | **${formatCurrency(totalIncome)}** | **${formatCurrency(totalSpend)}** | **${formatCurrency(totalIncome - totalSpend)}** |\n`;

      // Monthly average
      const monthCount = sortedMonths.length || 1;
      report += `\n**Monthly Averages:** Income ${formatCurrency(totalIncome / monthCount)} | Spending ${formatCurrency(totalSpend / monthCount)} | Net ${formatCurrency((totalIncome - totalSpend) / monthCount)}\n`;

      return { content: [{ type: "text", text: report }] };
    }
  );
}
