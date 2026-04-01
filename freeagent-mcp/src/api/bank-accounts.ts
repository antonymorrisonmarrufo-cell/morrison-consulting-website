import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface BankAccount {
  url: string;
  name: string;
  opening_balance: string;
  type: string;
  currency: string;
  current_balance: string;
  latest_activity: string;
  status: string;
  is_personal: boolean;
  is_primary: boolean;
  bank_name?: string;
  sort_code?: string;
  account_number?: string;
}

export async function listBankAccounts(
  params: Record<string, string> = {}
): Promise<BankAccount[]> {
  return freeagentPaginatedRequest<BankAccount>(
    "/bank_accounts",
    "bank_accounts",
    params
  );
}

export async function getBankAccount(id: string): Promise<BankAccount> {
  const result = await freeagentRequest<{ bank_account: BankAccount }>(
    `/bank_accounts/${id}`
  );
  return result.bank_account;
}

export function extractIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}
