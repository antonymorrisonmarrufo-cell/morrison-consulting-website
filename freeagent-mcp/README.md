# FreeAgent MCP Server

An MCP (Model Context Protocol) server that connects Claude to your FreeAgent accounting system. Automates invoicing, bank reconciliation, expense management, mileage claims, subscription analysis, and tax efficiency.

## What It Does

Claude can now directly:
- **Raise invoices** and send them to clients
- **Reconcile bank accounts** — match FreeAgent balances to actual bank balances
- **Code transactions** — suggest and apply categories to unexplained bank transactions
- **Manage expenses** — create expenses, bulk mileage claims
- **Find subscriptions** — detect recurring payments across all accounts
- **Spot duplicates** — identify overlapping subscriptions you could cancel
- **Tax efficiency** — find unclaimed business expenses and estimate tax savings
- **Analyse personal accounts** — scan CSV bank/credit card statements for claimable expenses

## Setup

### 1. FreeAgent Developer App

You need a FreeAgent developer app at [dev.freeagent.com](https://dev.freeagent.com):
- Create an app with redirect URI: `http://localhost:8919/callback`
- Note the **Client ID** and **Client Secret**

### 2. Environment Variables

Set these before running the server:

```bash
export FREEAGENT_CLIENT_ID="your_client_id"
export FREEAGENT_CLIENT_SECRET="your_client_secret"
export FREEAGENT_REDIRECT_URI="http://localhost:8919/callback"  # optional, this is the default
export FREEAGENT_SANDBOX="false"  # set to "true" for sandbox/testing
```

### 3. Install & Build

```bash
cd freeagent-mcp
npm install
npm run build
```

### 4. Configure as MCP Server

Add to your Claude Desktop config (`~/.claude/settings.json` or Claude Desktop settings):

```json
{
  "mcpServers": {
    "freeagent": {
      "command": "node",
      "args": ["/path/to/freeagent-mcp/dist/index.js"],
      "env": {
        "FREEAGENT_CLIENT_ID": "your_client_id",
        "FREEAGENT_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### 5. First-Time Authorization

After starting Claude with the MCP server configured, say:

> "Connect to my FreeAgent account"

Claude will open a browser window for you to approve access. After that, you're connected permanently (tokens auto-refresh).

## Available Tools

### Core Accounting
| Tool | What it does |
|------|-------------|
| `freeagent_auth` | Connect to FreeAgent (one-time setup) |
| `freeagent_auth_status` | Check connection status |
| `create_invoice` | Create a new invoice |
| `list_invoices` | View invoices with filters |
| `send_invoice` | Email an invoice to a client |
| `list_contacts` | View all clients/contacts |
| `create_contact` | Add a new client |
| `list_bank_accounts` | View all bank accounts and balances |
| `get_bank_transactions` | View transactions for an account |
| `explain_transaction` | Code a transaction to a category |
| `suggest_transaction_categories` | Auto-suggest categories for uncoded transactions |
| `create_expense` | Add an expense |
| `list_expenses` | View expenses |
| `bulk_create_mileage` | Create multiple mileage claims at once |
| `get_mileage_rates` | View current HMRC mileage rates |

### Smart Analysis
| Tool | What it does |
|------|-------------|
| `reconcile_account` | Compare FreeAgent vs actual bank balance |
| `find_unexplained_transactions` | Find uncoded transactions across all accounts |
| `compare_all_balances` | Overview of all account balances |
| `find_subscriptions` | Detect recurring payments and their costs |
| `find_duplicate_subscriptions` | Find overlapping services you could cancel |
| `spending_summary` | Monthly income/spending breakdown |
| `tax_efficiency_report` | Find unclaimed expenses for the tax year |
| `identify_claimable_expenses` | Scan personal accounts for business expenses |

### Personal Account (CSV)
| Tool | What it does |
|------|-------------|
| `import_bank_statement` | Parse a CSV bank/credit card statement |
| `analyse_personal_transactions` | Find business expenses in personal statements |
| `cross_reference_accounts` | Compare personal spend vs FreeAgent records |

## Example Conversations

> "What's my current bank balance in FreeAgent?"

> "Raise an invoice to ClientCo for 5 days consultancy at £750/day"

> "Find all unexplained transactions this month and suggest categories"

> "Reconcile my business account — the bank shows £12,450.32"

> "Scan my bank transactions for the last 6 months and find all subscriptions"

> "Are there any duplicate subscriptions I'm paying for?"

> "Generate a tax efficiency report for 2025/2026"

> "I've exported my Amex statement as a CSV — analyse it for claimable expenses"

> "Add mileage for these journeys: Mon 10 Mar Home to Manchester 185 miles, Wed 12 Mar Home to Leeds 90 miles"
