import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  listInvoices,
  createInvoice,
  sendInvoiceEmail,
  markInvoiceAsSent,
} from "../api/invoices.js";
import { listContacts } from "../api/contacts.js";
import { formatCurrency, formatDate } from "../utils/pagination.js";

export function registerInvoiceTools(server: McpServer): void {
  server.tool(
    "list_invoices",
    "List invoices from FreeAgent with optional filters. Returns invoice reference, client, amount, status and dates.",
    {
      status: z
        .enum(["draft", "sent", "overdue", "paid", "all"])
        .optional()
        .describe("Filter by invoice status"),
      from_date: z
        .string()
        .optional()
        .describe("Start date (YYYY-MM-DD)"),
      to_date: z
        .string()
        .optional()
        .describe("End date (YYYY-MM-DD)"),
      contact_id: z
        .string()
        .optional()
        .describe("Filter by contact/client ID"),
    },
    async ({ status, from_date, to_date, contact_id }) => {
      const params: Record<string, string> = {};
      if (status && status !== "all") {
        params.view = status;
      }
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;
      if (contact_id) {
        params.contact = `https://api.freeagent.com/v2/contacts/${contact_id}`;
      }

      const invoices = await listInvoices(params);

      if (invoices.length === 0) {
        return {
          content: [{ type: "text", text: "No invoices found matching the criteria." }],
        };
      }

      const lines = invoices.map((inv) => {
        const id = inv.url.split("/").pop();
        return `- **${inv.reference || `#${id}`}** | ${formatCurrency(inv.total_value)} | Status: ${inv.status} | Date: ${formatDate(inv.dated_on)} | Due: ${formatDate(inv.due_on)} | Paid: ${formatCurrency(inv.paid_value)} | Outstanding: ${formatCurrency(inv.due_value)}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${invoices.length} invoice(s):\n\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "create_invoice",
    "Create a new invoice in FreeAgent. Provide client details, line items, and payment terms.",
    {
      contact_id: z
        .string()
        .describe("The FreeAgent contact/client ID to invoice"),
      dated_on: z
        .string()
        .describe("Invoice date (YYYY-MM-DD)"),
      payment_terms_in_days: z
        .number()
        .optional()
        .default(30)
        .describe("Payment terms in days (default 30)"),
      currency: z.string().optional().default("GBP").describe("Currency code"),
      comments: z.string().optional().describe("Notes on the invoice"),
      items: z
        .array(
          z.object({
            description: z.string().describe("Line item description"),
            price: z.string().describe("Unit price"),
            quantity: z.string().optional().default("1").describe("Quantity"),
            category: z
              .string()
              .optional()
              .default("001")
              .describe("FreeAgent category code"),
          })
        )
        .describe("Invoice line items"),
    },
    async ({ contact_id, dated_on, payment_terms_in_days, currency, comments, items }) => {
      const invoice = await createInvoice({
        contact: `https://api.freeagent.com/v2/contacts/${contact_id}`,
        dated_on,
        payment_terms_in_days,
        currency,
        comments,
        invoice_items: items.map((item) => ({
          description: item.description,
          item_type: "Hours", // default, can be extended
          price: item.price,
          quantity: item.quantity,
          category: `https://api.freeagent.com/v2/categories/${item.category}`,
        })),
      });

      const id = invoice.url.split("/").pop();
      return {
        content: [
          {
            type: "text",
            text: `Invoice created successfully!\n\n- **Reference:** ${invoice.reference || `#${id}`}\n- **Total:** ${formatCurrency(invoice.total_value)}\n- **Status:** ${invoice.status}\n- **Due:** ${formatDate(invoice.due_on)}\n- **ID:** ${id}`,
          },
        ],
      };
    }
  );

  server.tool(
    "send_invoice",
    "Send an invoice by email to the client",
    {
      invoice_id: z.string().describe("The FreeAgent invoice ID"),
      to_email: z.string().describe("Recipient email address"),
      subject: z.string().optional().describe("Email subject"),
      body: z.string().optional().describe("Email body text"),
    },
    async ({ invoice_id, to_email, subject, body }) => {
      await markInvoiceAsSent(invoice_id);
      await sendInvoiceEmail(invoice_id, {
        to: to_email,
        subject,
        body,
      });

      return {
        content: [
          {
            type: "text",
            text: `Invoice ${invoice_id} sent successfully to ${to_email}.`,
          },
        ],
      };
    }
  );

  server.tool(
    "list_contacts",
    "List all clients/contacts in FreeAgent",
    {
      view: z
        .enum(["active", "hidden", "all"])
        .optional()
        .default("active")
        .describe("Filter contacts by status"),
    },
    async ({ view }) => {
      const params: Record<string, string> = {};
      if (view !== "all") params.view = view;

      const contacts = await listContacts(params);

      if (contacts.length === 0) {
        return {
          content: [{ type: "text", text: "No contacts found." }],
        };
      }

      const lines = contacts.map((c) => {
        const id = c.url.split("/").pop();
        const name =
          c.organisation_name ||
          [c.first_name, c.last_name].filter(Boolean).join(" ") ||
          "Unnamed";
        return `- **${name}** (ID: ${id}) | Email: ${c.email || "N/A"} | Status: ${c.status}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${contacts.length} contact(s):\n\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "create_contact",
    "Create a new client/contact in FreeAgent",
    {
      organisation_name: z.string().optional().describe("Company/organisation name"),
      first_name: z.string().optional().describe("First name"),
      last_name: z.string().optional().describe("Last name"),
      email: z.string().optional().describe("Email address"),
      phone_number: z.string().optional().describe("Phone number"),
      address1: z.string().optional().describe("Address line 1"),
      town: z.string().optional().describe("Town/city"),
      postcode: z.string().optional().describe("Postcode"),
      country: z.string().optional().default("United Kingdom").describe("Country"),
    },
    async (data) => {
      const contact = await (await import("../api/contacts.js")).createContact(data);
      const id = contact.url.split("/").pop();
      const name =
        data.organisation_name ||
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        "Unnamed";

      return {
        content: [
          {
            type: "text",
            text: `Contact created: **${name}** (ID: ${id})`,
          },
        ],
      };
    }
  );
}
