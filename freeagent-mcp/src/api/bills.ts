import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface Bill {
  url: string;
  contact: string;
  reference: string;
  dated_on: string;
  due_on: string;
  total_value: string;
  paid_value: string;
  due_value: string;
  status: string;
  category: string;
  comments?: string;
}

export async function listBills(
  params: Record<string, string> = {}
): Promise<Bill[]> {
  return freeagentPaginatedRequest<Bill>("/bills", "bills", params);
}

export async function getBill(id: string): Promise<Bill> {
  const result = await freeagentRequest<{ bill: Bill }>(`/bills/${id}`);
  return result.bill;
}

export async function createBill(data: {
  contact: string;
  reference: string;
  dated_on: string;
  due_on: string;
  total_value: string;
  category: string;
  comments?: string;
}): Promise<Bill> {
  const result = await freeagentRequest<{ bill: Bill }>("/bills", {
    method: "POST",
    body: { bill: data },
  });
  return result.bill;
}
