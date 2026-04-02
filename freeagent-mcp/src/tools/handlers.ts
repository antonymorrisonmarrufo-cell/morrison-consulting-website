import { startAuthFlow, getAuthStatus } from '../api/auth.js';
import { freeagentGet, freeagentPost } from '../api/client.js';
import * as fs from 'fs';

function ok(data: any): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}

function err(msg: string): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  return { content: [{ type: 'text', text: msg }], isError: true };
}

export async function handleTool(name: string, args: any) {
  try {
    switch (name) {
      case 'freeagent_auth': {
        const result = await startAuthFlow();
        return ok(result);
      }
      case 'freeagent_auth_status':
        return ok(getAuthStatus());

      case 'list_bank_accounts': {
        const data = await freeagentGet('/bank_accounts');
        const accounts = data.bank_accounts?.map((a: any) => ({
          name: a.name, type: a.type, current_balance: a.current_balance, url: a.url,
        }));
        return ok(accounts);
      }

      case 'get_bank_transactions': {
        const params: Record<string, string> = { bank_account: args.bank_account_url };
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        if (args.page) params.page = String(args.page);
        params.per_page = '100';
        const data = await freeagentGet('/bank_transactions', params);
        const txns = data.bank_transactions?.map((t: any) => ({
          dated_on: t.dated_on, description: t.description, amount: t.amount,
          unexplained_amount: t.unexplained_amount,
        }));
        return ok(txns);
      }

      case 'find_unexplained_transactions': {
        const params: Record<string, string> = { bank_account: args.bank_account_url };
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        params.per_page = '100';
        const data = await freeagentGet('/bank_transactions', params);
        const unexplained = data.bank_transactions?.filter((t: any) => parseFloat(t.unexplained_amount) !== 0)
          .map((t: any) => ({ dated_on: t.dated_on, description: t.description, amount: t.amount, unexplained_amount: t.unexplained_amount }));
        return ok({ count: unexplained?.length || 0, transactions: unexplained });
      }

      case 'list_invoices': {
        const params: Record<string, string> = {};
        if (args.status) params.view = args.status;
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        const data = await freeagentGet('/invoices', params);
        const invoices = data.invoices?.map((i: any) => ({
          reference: i.reference, contact: i.contact, dated_on: i.dated_on,
          due_on: i.due_on, total_value: i.total_value, status: i.status, url: i.url,
        }));
        return ok(invoices);
      }

      case 'create_invoice': {
        const invoice = {
          invoice: {
            contact: args.contact_url,
            dated_on: args.dated_on || new Date().toISOString().split('T')[0],
            payment_terms_in_days: args.payment_terms_in_days || 30,
            invoice_items: args.items,
          },
        };
        const data = await freeagentPost('/invoices', invoice);
        return ok({ message: 'Invoice created', invoice: data.invoice });
      }

      case 'list_contacts': {
        const data = await freeagentGet('/contacts');
        const contacts = data.contacts?.map((c: any) => ({
          name: c.organisation_name || `${c.first_name} ${c.last_name}`, url: c.url,
        }));
        return ok(contacts);
      }

      case 'list_expenses': {
        const params: Record<string, string> = {};
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        const data = await freeagentGet('/expenses', params);
        return ok(data.expenses?.map((e: any) => ({
          dated_on: e.dated_on, description: e.description, gross_value: e.gross_value,
          category: e.category, url: e.url,
        })));
      }

      case 'create_expense': {
        const expense = {
          expense: {
            dated_on: args.dated_on,
            description: args.description,
            gross_value: args.gross_value,
            category: args.category_url || 'https://api.freeagent.com/v2/categories/285',
          },
        };
        const data = await freeagentPost('/expenses', expense);
        return ok({ message: 'Expense created', expense: data.expense });
      }

      case 'compare_all_balances': {
        const data = await freeagentGet('/bank_accounts');
        const summary = data.bank_accounts?.map((a: any) => ({
          name: a.name, current_balance: a.current_balance, type: a.type,
        }));
        const total = summary?.reduce((sum: number, a: any) => sum + parseFloat(a.current_balance), 0);
        return ok({ accounts: summary, net_position: total?.toFixed(2) });
      }

      case 'find_subscriptions': {
        const params: Record<string, string> = {
          bank_account: args.bank_account_url, per_page: '100',
        };
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        const data = await freeagentGet('/bank_transactions', params);
        const txns = data.bank_transactions || [];
        const descCounts: Record<string, { count: number; total: number; amounts: number[] }> = {};
        for (const t of txns) {
          const key = t.description.replace(/\d{2}[A-Z]{3}\d{2}|CD \d+|\/\/\/|\d{10,}/g, '').trim();
          if (!descCounts[key]) descCounts[key] = { count: 0, total: 0, amounts: [] };
          descCounts[key].count++;
          descCounts[key].total += Math.abs(parseFloat(t.amount));
          descCounts[key].amounts.push(parseFloat(t.amount));
        }
        const recurring = Object.entries(descCounts)
          .filter(([, v]) => v.count >= 2)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([desc, v]) => ({ description: desc, occurrences: v.count, total_spent: v.total.toFixed(2), avg_amount: (v.total / v.count).toFixed(2) }));
        return ok({ subscriptions_found: recurring.length, subscriptions: recurring });
      }

      case 'spending_summary': {
        const params: Record<string, string> = {
          bank_account: args.bank_account_url, per_page: '100',
        };
        if (args.from_date) params.from_date = args.from_date;
        if (args.to_date) params.to_date = args.to_date;
        const data = await freeagentGet('/bank_transactions', params);
        const txns = data.bank_transactions || [];
        let totalIn = 0, totalOut = 0;
        for (const t of txns) {
          const amt = parseFloat(t.amount);
          if (amt > 0) totalIn += amt; else totalOut += Math.abs(amt);
        }
        return ok({ transaction_count: txns.length, total_income: totalIn.toFixed(2), total_expenditure: totalOut.toFixed(2), net: (totalIn - totalOut).toFixed(2) });
      }

      case 'tax_efficiency_report': {
        const data = await freeagentGet('/bank_accounts');
        const accounts = data.bank_accounts || [];
        const results: any[] = [];
        for (const acct of accounts) {
          const params: Record<string, string> = { bank_account: acct.url, per_page: '100' };
          if (args.from_date) params.from_date = args.from_date;
          if (args.to_date) params.to_date = args.to_date;
          const txData = await freeagentGet('/bank_transactions', params);
          const unexplained = (txData.bank_transactions || [])
            .filter((t: any) => parseFloat(t.unexplained_amount) !== 0);
          if (unexplained.length > 0) {
            results.push({ account: acct.name, unexplained_count: unexplained.length, unexplained_transactions: unexplained.slice(0, 20) });
          }
        }
        return ok({ message: 'Transactions needing categorisation for tax efficiency', accounts: results });
      }

      case 'import_bank_statement':
      case 'analyse_personal_transactions': {
        const filePath = args.file_path;
        if (!fs.existsSync(filePath)) return err(`File not found: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) return err('File appears empty or has no data rows');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = vals[i] || ''; });
          return row;
        });
        const descCounts: Record<string, { count: number; total: number }> = {};
        for (const r of rows) {
          const desc = r['Description'] || r['description'] || r['Merchant/Description'] || Object.values(r)[1] || '';
          const amt = Math.abs(parseFloat(r['Amount'] || r['Debit/Credit'] || r['Paid Out (£)'] || r['Debit (£)'] || '0'));
          const key = desc.replace(/\d{10,}/g, '').trim();
          if (!key) continue;
          if (!descCounts[key]) descCounts[key] = { count: 0, total: 0 };
          descCounts[key].count++;
          descCounts[key].total += amt;
        }
        const recurring = Object.entries(descCounts)
          .filter(([, v]) => v.count >= 2)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([desc, v]) => ({ description: desc, occurrences: v.count, total: v.total.toFixed(2) }));
        return ok({
          account: args.account_name || filePath,
          total_transactions: rows.length,
          recurring_items: recurring.length,
          recurring: recurring.slice(0, 30),
        });
      }

      case 'cross_reference_accounts': {
        const allDescs: Record<string, string[]> = {};
        for (const fp of args.file_paths) {
          if (!fs.existsSync(fp)) continue;
          const content = fs.readFileSync(fp, 'utf-8');
          const lines = content.split('\n').filter(l => l.trim());
          const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
          for (const line of lines.slice(1)) {
            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const desc = vals[headers.indexOf('Description')] || vals[1] || '';
            const key = desc.toLowerCase().replace(/\d{10,}/g, '').replace(/[^a-z ]/g, '').trim();
            if (key.length < 3) continue;
            if (!allDescs[key]) allDescs[key] = [];
            if (!allDescs[key].includes(fp)) allDescs[key].push(fp);
          }
        }
        const overlaps = Object.entries(allDescs)
          .filter(([, accounts]) => accounts.length > 1)
          .map(([desc, accounts]) => ({ description: desc, found_in_accounts: accounts.length, accounts }));
        return ok({ overlapping_services: overlaps.length, overlaps: overlaps.slice(0, 20) });
      }

      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (e: any) {
    return err(e.message || String(e));
  }
}
