import { freeagentRequest, freeagentPaginatedRequest } from "./client.js";

export interface Contact {
  url: string;
  first_name?: string;
  last_name?: string;
  organisation_name?: string;
  email?: string;
  phone_number?: string;
  address1?: string;
  address2?: string;
  town?: string;
  region?: string;
  postcode?: string;
  country?: string;
  contact_name_on_invoices?: boolean;
  status: string;
  active_projects_count: number;
}

export async function listContacts(
  params: Record<string, string> = {}
): Promise<Contact[]> {
  return freeagentPaginatedRequest<Contact>("/contacts", "contacts", params);
}

export async function getContact(id: string): Promise<Contact> {
  const result = await freeagentRequest<{ contact: Contact }>(
    `/contacts/${id}`
  );
  return result.contact;
}

export async function createContact(data: {
  first_name?: string;
  last_name?: string;
  organisation_name?: string;
  email?: string;
  phone_number?: string;
  address1?: string;
  town?: string;
  postcode?: string;
  country?: string;
}): Promise<Contact> {
  const result = await freeagentRequest<{ contact: Contact }>("/contacts", {
    method: "POST",
    body: { contact: data },
  });
  return result.contact;
}
