// FreeAgent expense/transaction category mappings
// See: https://dev.freeagent.com/docs/categories

export const EXPENSE_CATEGORIES: Record<string, string> = {
  // Admin costs
  "Admin Expenses - General": "230",
  "Admin Expenses - Stationery": "231",
  "Admin Expenses - Printing & Postage": "232",
  "Admin Expenses - Software & IT": "233",

  // Travel
  "Travel - Car": "311",
  "Travel - Train/Bus": "312",
  "Travel - Air": "313",
  "Travel - Hotel/Accommodation": "314",
  "Travel - Subsistence": "315",
  "Travel - Mileage": "316",

  // Cost of sales
  "Cost of Sales": "100",
  Subcontractors: "110",

  // Professional
  "Accountancy Fees": "250",
  "Legal & Professional Fees": "251",
  "Bank Charges": "252",
  Insurance: "253",

  // Marketing
  Advertising: "260",
  "Marketing & Entertainment": "261",

  // Premises
  Rent: "270",
  "Rates & Water": "271",
  "Light & Heat": "272",
  "Repairs & Maintenance": "273",

  // Phone & Internet
  "Telephone & Internet": "280",

  // Subscriptions
  "Subscriptions & Memberships": "290",

  // Equipment
  "Computer Equipment": "300",
  "Office Equipment": "301",
};

// Common transaction description patterns → suggested categories
export const TRANSACTION_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  description: string;
}> = [
  {
    pattern: /amazon|amzn/i,
    category: "Admin Expenses - General",
    description: "Amazon purchase — check if office supplies or personal",
  },
  {
    pattern: /microsoft|office\s*365|azure/i,
    category: "Admin Expenses - Software & IT",
    description: "Microsoft software/service subscription",
  },
  {
    pattern: /google|gcp|workspace/i,
    category: "Admin Expenses - Software & IT",
    description: "Google service/subscription",
  },
  {
    pattern: /adobe|creative\s*cloud/i,
    category: "Admin Expenses - Software & IT",
    description: "Adobe software subscription",
  },
  {
    pattern: /zoom|teams|slack|notion|asana|trello|monday/i,
    category: "Admin Expenses - Software & IT",
    description: "Productivity/collaboration software",
  },
  {
    pattern: /chatgpt|openai|anthropic|claude/i,
    category: "Admin Expenses - Software & IT",
    description: "AI service subscription",
  },
  {
    pattern: /trainline|railway|national\s*rail|gwr|avanti|lner/i,
    category: "Travel - Train/Bus",
    description: "Rail travel",
  },
  {
    pattern: /uber|bolt|taxi|cab/i,
    category: "Travel - Car",
    description: "Taxi/ride-hailing",
  },
  {
    pattern: /easyjet|ryanair|british\s*airways|ba\s|flybe/i,
    category: "Travel - Air",
    description: "Air travel",
  },
  {
    pattern: /hotel|premier\s*inn|travelodge|hilton|marriott|airbnb/i,
    category: "Travel - Hotel/Accommodation",
    description: "Accommodation",
  },
  {
    pattern: /costa|starbucks|pret|greggs|subway|mcdonald/i,
    category: "Travel - Subsistence",
    description: "Food & drink (check if business travel)",
  },
  {
    pattern: /vodafone|ee\s|three\s|o2\s|bt\s|virgin\s*media|sky\s*broadband/i,
    category: "Telephone & Internet",
    description: "Phone/internet service",
  },
  {
    pattern: /insurance|aviva|axa|zurich|hiscox/i,
    category: "Insurance",
    description: "Insurance",
  },
  {
    pattern: /hmrc|tax|vat\s*payment/i,
    category: "Admin Expenses - General",
    description: "Tax payment to HMRC",
  },
  {
    pattern: /parking|ncp|ringgo|paybyphone/i,
    category: "Travel - Car",
    description: "Parking (check if business related)",
  },
  {
    pattern: /fuel|shell|bp\s|esso|texaco|petrol/i,
    category: "Travel - Car",
    description: "Fuel (consider mileage claim instead)",
  },
  {
    pattern: /linkedin|premium/i,
    category: "Subscriptions & Memberships",
    description: "Professional subscription",
  },
  {
    pattern: /netflix|spotify|disney|apple\s*tv|youtube\s*premium/i,
    category: "Subscriptions & Memberships",
    description: "Entertainment subscription — likely personal",
  },
];

export function suggestCategory(
  description: string
): { category: string; reason: string } | null {
  for (const { pattern, category, description: reason } of TRANSACTION_PATTERNS) {
    if (pattern.test(description)) {
      return { category, reason };
    }
  }
  return null;
}

// Known subscription services grouped by capability for duplicate detection
export const SUBSCRIPTION_GROUPS: Record<string, string[]> = {
  "Video Conferencing": ["zoom", "teams", "google meet", "webex"],
  "Project Management": [
    "asana",
    "trello",
    "monday",
    "jira",
    "notion",
    "clickup",
  ],
  "Cloud Storage": [
    "dropbox",
    "google drive",
    "onedrive",
    "icloud",
    "box",
  ],
  "AI Assistants": [
    "chatgpt",
    "claude",
    "copilot",
    "gemini",
    "perplexity",
  ],
  Communication: ["slack", "teams", "discord"],
  "Email & Calendar": [
    "google workspace",
    "microsoft 365",
    "outlook",
    "zoho",
  ],
  "Password Manager": [
    "1password",
    "lastpass",
    "bitwarden",
    "dashlane",
  ],
  VPN: [
    "nordvpn",
    "expressvpn",
    "surfshark",
    "protonvpn",
  ],
  "Design Tools": [
    "canva",
    "figma",
    "adobe",
    "sketch",
  ],
  "Accounting Software": [
    "freeagent",
    "xero",
    "quickbooks",
    "sage",
    "freshbooks",
  ],
  "Website Builder": [
    "squarespace",
    "wix",
    "wordpress",
    "webflow",
  ],
  Streaming: [
    "netflix",
    "disney+",
    "amazon prime",
    "apple tv",
    "now tv",
    "spotify",
    "apple music",
    "youtube premium",
  ],
};
