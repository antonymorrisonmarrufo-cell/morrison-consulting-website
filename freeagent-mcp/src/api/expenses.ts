import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface Expense {
  url: string;
  user: string;
  category: string;
  currency: string;
  gross_value: string;
  native_gross_value?: string;
  sales_tax_rate?: string;
  sales_tax_value?: string;
  dated_on: string;
  description: string;
  receipt_url?: string;
  attachment?: {
    url: string;
    content_type: string;
    file_name: string;
  };
  rebill_type?: string;
  rebill_factor?: string;
  manual_sales_tax_amount?: string;
  miles?: string;
  engine_type?: string;
  engine_size?: string;
}

export interface MileageSettings {
  engine_type_and_size_options: Array<{
    engine_type: string;
    engine_sizes: string[];
  }>;
}

export async function listExpenses(
  params: Record<string, string> = {}
): Promise<Expense[]> {
  return freeagentPaginatedRequest<Expense>("/expenses", "expenses", params);
}

export async function getExpense(id: string): Promise<Expense> {
  const result = await freeagentRequest<{ expense: Expense }>(
    `/expenses/${id}`
  );
  return result.expense;
}

export async function createExpense(data: {
  user: string;
  category: string;
  dated_on: string;
  description: string;
  gross_value?: string;
  miles?: string;
  engine_type?: string;
  engine_size?: string;
  currency?: string;
}): Promise<Expense> {
  const result = await freeagentRequest<{ expense: Expense }>("/expenses", {
    method: "POST",
    body: { expense: data },
  });
  return result.expense;
}

export async function getMileageSettings(): Promise<MileageSettings> {
  return freeagentRequest<MileageSettings>("/expenses/mileage_settings");
}

export async function createBulkMileage(
  entries: Array<{
    user: string;
    dated_on: string;
    description: string;
    miles: string;
    engine_type?: string;
    engine_size?: string;
  }>
): Promise<Expense[]> {
  const results: Expense[] = [];
  for (const entry of entries) {
    const expense = await createExpense({
      ...entry,
      category: "https://api.freeagent.com/v2/categories/316", // Travel - Mileage
    });
    results.push(expense);
  }
  return results;
}
