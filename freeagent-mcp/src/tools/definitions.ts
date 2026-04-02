export const TOOL_DEFINITIONS = [
  // Auth
  { name: 'freeagent_auth', description: 'Connect Claude to your FreeAgent account via OAuth.', inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  { name: 'freeagent_auth_status', description: 'Check if Claude is connected to FreeAgent.', inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  // Banking
  { name: 'list_bank_accounts', description: 'List all bank accounts in FreeAgent with balances.', inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  { name: 'get_bank_transactions', description: 'Get bank transactions for a specific account.', inputSchema: { type: 'object' as const, properties: { bank_account_url: { type: 'string', description: 'Bank account URL from list_bank_accounts' }, from_date: { type: 'string', description: 'Start date YYYY-MM-DD' }, to_date: { type: 'string', description: 'End date YYYY-MM-DD' }, page: { type: 'number', description: 'Page number (100 per page)' } }, required: ['bank_account_url'], additionalProperties: false } },
  { name: 'find_unexplained_transactions', description: 'Find transactions not yet categorised in FreeAgent.', inputSchema: { type: 'object' as const, properties: { bank_account_url: { type: 'string' }, from_date: { type: 'string' }, to_date: { type: 'string' } }, required: ['bank_account_url'], additionalProperties: false } },
  // Invoicing
  { name: 'list_invoices', description: 'List invoices with optional status filter.', inputSchema: { type: 'object' as const, properties: { status: { type: 'string', enum: ['draft', 'sent', 'overdue', 'paid'] }, from_date: { type: 'string' }, to_date: { type: 'string' } }, additionalProperties: false } },
  { name: 'create_invoice', description: 'Create a new invoice.', inputSchema: { type: 'object' as const, properties: { contact_url: { type: 'string', description: 'Contact URL' }, dated_on: { type: 'string' }, payment_terms_in_days: { type: 'number' }, items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, quantity: { type: 'number' }, price: { type: 'number' }, category_url: { type: 'string' } } } } }, required: ['contact_url', 'items'], additionalProperties: false } },
  { name: 'list_contacts', description: 'List all contacts/clients.', inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  // Expenses
  { name: 'list_expenses', description: 'List expenses with optional date filter.', inputSchema: { type: 'object' as const, properties: { from_date: { type: 'string' }, to_date: { type: 'string' } }, additionalProperties: false } },
  { name: 'create_expense', description: 'Create an expense claim.', inputSchema: { type: 'object' as const, properties: { dated_on: { type: 'string' }, description: { type: 'string' }, gross_value: { type: 'number' }, category_url: { type: 'string' } }, required: ['dated_on', 'description', 'gross_value'], additionalProperties: false } },
  // Reconciliation
  { name: 'compare_all_balances', description: 'Compare FreeAgent balances to identify discrepancies.', inputSchema: { type: 'object' as const, properties: {}, additionalProperties: false } },
  // Analysis
  { name: 'find_subscriptions', description: 'Analyse transactions to find recurring subscriptions.', inputSchema: { type: 'object' as const, properties: { bank_account_url: { type: 'string' }, from_date: { type: 'string' }, to_date: { type: 'string' } }, required: ['bank_account_url'], additionalProperties: false } },
  { name: 'spending_summary', description: 'Categorised spending summary for a period.', inputSchema: { type: 'object' as const, properties: { bank_account_url: { type: 'string' }, from_date: { type: 'string' }, to_date: { type: 'string' } }, required: ['bank_account_url'], additionalProperties: false } },
  // Tax
  { name: 'tax_efficiency_report', description: 'Analyse transactions for tax efficiency and claimable expenses.', inputSchema: { type: 'object' as const, properties: { from_date: { type: 'string' }, to_date: { type: 'string' } }, additionalProperties: false } },
  // CSV Import
  { name: 'import_bank_statement', description: 'Import and analyse a CSV bank statement from a file path.', inputSchema: { type: 'object' as const, properties: { file_path: { type: 'string', description: 'Path to CSV file' }, account_name: { type: 'string', description: 'Name for this account' }, from_date: { type: 'string' }, to_date: { type: 'string' } }, required: ['file_path'], additionalProperties: false } },
  { name: 'analyse_personal_transactions', description: 'Analyse personal bank/card transactions for subscriptions, duplicates, and potential business expenses.', inputSchema: { type: 'object' as const, properties: { file_path: { type: 'string', description: 'Path to CSV file' }, account_name: { type: 'string' } }, required: ['file_path'], additionalProperties: false } },
  { name: 'cross_reference_accounts', description: 'Cross-reference transactions across multiple accounts to find duplicates and overlapping subscriptions.', inputSchema: { type: 'object' as const, properties: { file_paths: { type: 'array', items: { type: 'string' }, description: 'Array of CSV file paths to cross-reference' } }, required: ['file_paths'], additionalProperties: false } },
];
