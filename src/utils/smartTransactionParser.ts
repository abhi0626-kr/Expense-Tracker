type TransactionType = "income" | "expense";

interface ParseContext {
  accountNames: string[];
  expenseCategories: string[];
  incomeCategories: string[];
}

export interface ParsedTransactionDraft {
  type?: TransactionType;
  amount?: string;
  category?: string;
  accountName?: string;
  description?: string;
  date?: string;
}

const expenseHints: Record<string, string[]> = {
  Groceries: ["grocery", "groceries", "supermarket", "mart", "vegetables"],
  Transportation: ["uber", "ola", "taxi", "fuel", "petrol", "diesel", "bus", "metro", "train"],
  "Food & Dining": ["food", "dinner", "lunch", "breakfast", "restaurant", "cafe", "zomato", "swiggy"],
  Shopping: ["shopping", "amazon", "flipkart", "mall", "clothes"],
  "Bills & Utilities": ["bill", "electricity", "water", "recharge", "internet", "wifi", "gas"],
  Healthcare: ["doctor", "medicine", "hospital", "pharmacy", "health"],
  Entertainment: ["movie", "netflix", "spotify", "game", "entertainment"]
};

const incomeHints: Record<string, string[]> = {
  Salary: ["salary", "paycheck", "pay day", "monthly pay"],
  Freelance: ["freelance", "client", "project payment"],
  Business: ["business", "sale", "profit"],
  Investment: ["dividend", "interest", "investment", "stocks", "mutual fund"],
  Other: ["refund", "cashback", "bonus", "gift", "received"]
};

const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

const parseDate = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes("today")) {
    return toIsoDate(now);
  }

  if (lower.includes("yesterday")) {
    const d = new Date(now);
    d.setDate(now.getDate() - 1);
    return toIsoDate(d);
  }

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const slash = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (slash) {
    const day = slash[1].padStart(2, "0");
    const month = slash[2].padStart(2, "0");
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${month}-${day}`;
  }

  return undefined;
};

const parseAmount = (text: string): string | undefined => {
  const amountMatch = text.match(/(?:₹|rs\.?|inr\s*)?\s*(\d+(?:[\.,]\d{1,2})?)/i);
  if (!amountMatch?.[1]) return undefined;
  const normalized = amountMatch[1].replace(",", "");
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount) || amount <= 0) return undefined;
  return amount.toFixed(2);
};

const detectType = (text: string): TransactionType | undefined => {
  const lower = text.toLowerCase();

  const incomeWords = ["received", "salary", "earned", "income", "credit", "cashback", "bonus"];
  const expenseWords = ["spent", "paid", "bought", "expense", "debit", "purchase", "recharge", "bill"];

  if (incomeWords.some((w) => lower.includes(w))) return "income";
  if (expenseWords.some((w) => lower.includes(w))) return "expense";

  return undefined;
};

const detectAccount = (text: string, accountNames: string[]): string | undefined => {
  const lower = text.toLowerCase();
  return accountNames.find((name) => lower.includes(name.toLowerCase()));
};

const byCategoryName = (text: string, categories: string[]) => {
  const lower = text.toLowerCase();
  return categories.find((category) => lower.includes(category.toLowerCase()));
};

const byHints = (text: string, dictionary: Record<string, string[]>) => {
  const lower = text.toLowerCase();
  return Object.entries(dictionary).find(([, hints]) => hints.some((hint) => lower.includes(hint)))?.[0];
};

const detectCategory = (
  text: string,
  type: TransactionType | undefined,
  expenseCategories: string[],
  incomeCategories: string[]
) => {
  if (!type) return undefined;

  const categoryList = type === "expense" ? expenseCategories : incomeCategories;
  const direct = byCategoryName(text, categoryList);
  if (direct) return direct;

  const inferred = type === "expense" ? byHints(text, expenseHints) : byHints(text, incomeHints);
  if (!inferred) return undefined;

  return categoryList.find((c) => c.toLowerCase() === inferred.toLowerCase()) || categoryList[0];
};

export const parseSmartTransactionInput = (
  input: string,
  context: ParseContext
): ParsedTransactionDraft => {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const type = detectType(trimmed);
  const amount = parseAmount(trimmed);
  const accountName = detectAccount(trimmed, context.accountNames);
  const category = detectCategory(trimmed, type, context.expenseCategories, context.incomeCategories);
  const date = parseDate(trimmed);

  return {
    type,
    amount,
    category,
    accountName,
    date,
    description: trimmed
  };
};
