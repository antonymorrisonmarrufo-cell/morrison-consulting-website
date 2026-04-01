import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface BankTransaction {
  url: string;
  amount: string;
  bank_account: string;
  dated_on: string;
  description: string;
  full_description?: string;
  uploaded_at?: string;
  unexplained_amount: string;
  is_manual: boolean;
}

export interface BankTransactionExplanation {
  url: string;
  bank_transaction: string;
  category: string;
  dated_on: string;
  description: string;
  gross_value: string;
  paid_invoice?: string;
  paid_bill?: string;
  paid_user?: string;
  transfer_bank_account?: string;
}

export async function listBankTransactions(
  bankAccountUrl: string,
  params: Record<string, string> = {}
): Promise<BankTransaction[]> {
  return freeagentPaginatedRequest<BankTransaction>(
    "/bank_transactions",
    "bank_transactions",
    { bank_account: bankAccountUrl, ...params }
  );
}

export async function getBankTransaction(
  id: string
): Promise<BankTransaction> {
  const result = await freeagentRequest<{
    bank_transaction: BankTransaction;
  }>(`/bank_transactions/${id}`);
  return result.bank_transaction;
}

export async function explainTransaction(
  bankTransactionUrl: string,
  explanation: {
    category?: string;
    description?: string;
    gross_value?: string;
    paid_invoice?: string;
    paid_bill?: string;
    transfer_bank_account?: string;
  }
): Promise<BankTransactionExplanation> {
  const result = await freeagentRequest<{
    bank_transaction_explanation: BankTransactionExplanation;
  }>("/bank_transaction_explanations", {
    method: "POST",
    body: {
      bank_transaction_explanation: {
        bank_transaction: bankTransactionUrl,
        ...explanation,
      },
    },
  });
  return result.bank_transaction_explanation;
}

export async function listUnexplainedTransactions(
  bankAccountUrl: string,
  params: Record<string, string> = {}
): Promise<BankTransaction[]> {
  const transactions = await listBankTransactions(bankAccountUrl, params);
  return transactions.filter(
    (t) => parseFloat(t.unexplained_amount) !== 0
  );
}
