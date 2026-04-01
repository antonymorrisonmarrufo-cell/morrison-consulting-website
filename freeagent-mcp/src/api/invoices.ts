import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface Invoice {
  url: string;
  contact: string;
  dated_on: string;
  due_on: string;
  reference: string;
  currency: string;
  exchange_rate: string;
  net_value: string;
  total_value: string;
  paid_value: string;
  due_value: string;
  status: string;
  invoice_items: InvoiceItem[];
  comments?: string;
  payment_terms_in_days?: number;
}

export interface InvoiceItem {
  description: string;
  item_type: string;
  price: string;
  quantity: string;
  category: string;
}

export async function listInvoices(
  params: Record<string, string> = {}
): Promise<Invoice[]> {
  return freeagentPaginatedRequest<Invoice>("/invoices", "invoices", params);
}

export async function getInvoice(id: string): Promise<Invoice> {
  const result = await freeagentRequest<{ invoice: Invoice }>(
    `/invoices/${id}`
  );
  return result.invoice;
}

export async function createInvoice(data: {
  contact: string;
  dated_on: string;
  payment_terms_in_days?: number;
  currency?: string;
  comments?: string;
  invoice_items: Array<{
    description: string;
    item_type: string;
    price: string;
    quantity: string;
    category: string;
  }>;
}): Promise<Invoice> {
  const result = await freeagentRequest<{ invoice: Invoice }>("/invoices", {
    method: "POST",
    body: { invoice: data },
  });
  return result.invoice;
}

export async function sendInvoiceEmail(
  id: string,
  email: {
    to: string;
    subject?: string;
    body?: string;
  }
): Promise<void> {
  await freeagentRequest(`/invoices/${id}/send_email`, {
    method: "POST",
    body: { email },
  });
}

export async function markInvoiceAsSent(id: string): Promise<Invoice> {
  const result = await freeagentRequest<{ invoice: Invoice }>(
    `/invoices/${id}/transitions/mark_as_sent`,
    { method: "PUT" }
  );
  return result.invoice;
}
