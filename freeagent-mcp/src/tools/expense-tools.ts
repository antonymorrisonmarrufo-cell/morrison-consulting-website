import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  listExpenses,
  createExpense,
  createBulkMileage,
  getMileageSettings,
} from "../api/expenses.js";
import { formatCurrency, formatDate } from "../utils/pagination.js";
import { freeagentRequest } from "../api/client.js";

export function registerExpenseTools(server: McpServer): void {
  server.tool(
    "list_expenses",
    "List expenses from FreeAgent with optional filters by date range.",
    {
      from_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ from_date, to_date }) => {
      const params: Record<string, string> = {};
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;

      const expenses = await listExpenses(params);

      if (expenses.length === 0) {
        return {
          content: [{ type: "text", text: "No expenses found for the given period." }],
        };
      }

      const lines = expenses.map((e) => {
        const id = e.url.split("/").pop();
        return `- ${formatDate(e.dated_on)} | ${formatCurrency(e.gross_value)} | ${e.description} | Category: ${e.category.split("/").pop()} (ID: ${id})`;
      });

      const total = expenses.reduce(
        (sum, e) => sum + parseFloat(e.gross_value),
        0
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${expenses.length} expense(s):\n\n${lines.join("\n")}\n\n**Total:** ${formatCurrency(total)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "create_expense",
    "Create a new expense entry in FreeAgent.",
    {
      dated_on: z.string().describe("Expense date (YYYY-MM-DD)"),
      description: z.string().describe("What the expense is for"),
      gross_value: z.string().describe("Total amount including VAT"),
      category: z
        .string()
        .describe(
          "Category code (e.g., '233' for Software & IT, '312' for Train Travel)"
        ),
      currency: z.string().optional().default("GBP").describe("Currency code"),
    },
    async ({ dated_on, description, gross_value, category, currency }) => {
      // Get the current user URL
      const company = await freeagentRequest<{ company: { url: string } }>(
        "/company"
      );

      const expense = await createExpense({
        user: company.company.url.replace("company", "users") + "/1", // primary user
        category: `https://api.freeagent.com/v2/categories/${category}`,
        dated_on,
        description,
        gross_value,
        currency,
      });

      const id = expense.url.split("/").pop();
      return {
        content: [
          {
            type: "text",
            text: `Expense created: **${description}** | ${formatCurrency(gross_value)} | ${formatDate(dated_on)} (ID: ${id})`,
          },
        ],
      };
    }
  );

  server.tool(
    "bulk_create_mileage",
    "Create multiple mileage expense claims at once. Perfect for catching up on mileage for the month/quarter.",
    {
      entries: z
        .array(
          z.object({
            dated_on: z.string().describe("Journey date (YYYY-MM-DD)"),
            description: z
              .string()
              .describe("Journey description (e.g., 'Home to Client Office')"),
            miles: z.string().describe("Miles travelled"),
          })
        )
        .describe("Array of mileage entries"),
      engine_type: z
        .string()
        .optional()
        .default("Petrol")
        .describe("Engine type: Petrol, Diesel, or LPG"),
      engine_size: z
        .string()
        .optional()
        .describe("Engine size (e.g., '1401cc_to_2000cc')"),
    },
    async ({ entries, engine_type, engine_size }) => {
      // Get the current user URL
      const company = await freeagentRequest<{ company: { url: string } }>(
        "/company"
      );
      const userUrl =
        company.company.url.replace("company", "users") + "/1";

      const mileageEntries = entries.map((e) => ({
        ...e,
        user: userUrl,
        engine_type,
        engine_size,
      }));

      const results = await createBulkMileage(mileageEntries);

      const totalMiles = entries.reduce(
        (sum, e) => sum + parseFloat(e.miles),
        0
      );
      const totalValue = results.reduce(
        (sum, r) => sum + parseFloat(r.gross_value),
        0
      );

      return {
        content: [
          {
            type: "text",
            text: `Created ${results.length} mileage claim(s):\n\n- **Total Miles:** ${totalMiles}\n- **Total Claimable:** ${formatCurrency(totalValue)}\n\nEntries:\n${results.map((r) => `- ${formatDate(r.dated_on)} | ${r.miles} miles | ${r.description} | ${formatCurrency(r.gross_value)}`).join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_mileage_rates",
    "Get the current HMRC mileage rates and engine type options from FreeAgent.",
    {},
    async () => {
      const settings = await getMileageSettings();

      const lines = settings.engine_type_and_size_options.map((opt) => {
        return `**${opt.engine_type}:** ${opt.engine_sizes.join(", ")}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Mileage Settings:\n\n${lines.join("\n")}\n\nUse these engine types and sizes when creating mileage claims.`,
          },
        ],
      };
    }
  );
}
