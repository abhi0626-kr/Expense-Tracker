import { Transaction } from "@/hooks/useExpenseData";
import { Budget } from "@/hooks/useBudgets";

export interface FinancialHealthScore {
  score: number; // 0 to 100
  grade: "Excellent" | "Good" | "Fair" | "Needs Attention";
  savingsRate: number; // percentage
  budgetAdherence: number; // percentage
  spendVelocity: number; // ratio vs last month
}

export interface CategoryTrend {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number; // e.g. +35% or -12%
  isIncrease: boolean;
}

export interface SubscriptionItem {
  name: string;
  amount: number;
  frequency: "monthly" | "yearly";
  lastDate: string;
  nextRenewalDate: string;
  daysUntilRenewal: number;
  category: string;
}

export interface SmartInsight {
  id: string;
  type: "warning" | "saver" | "renewal" | "achievement";
  title: string;
  message: string;
  actionText?: string;
  impactAmount?: number;
  category?: string;
  date?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestions?: string[];
}

// Common subscription keywords
const KNOWN_SUBSCRIPTIONS = [
  { keywords: ["netflix"], name: "Netflix" },
  { keywords: ["spotify"], name: "Spotify" },
  { keywords: ["youtube", "yt premium"], name: "YouTube Premium" },
  { keywords: ["amazon prime", "prime video"], name: "Amazon Prime" },
  { keywords: ["icloud", "apple.com/bill", "apple music"], name: "Apple Services" },
  { keywords: ["google one", "google storage"], name: "Google One" },
  { keywords: ["chatgpt", "openai"], name: "ChatGPT Plus" },
  { keywords: ["swiggy one", "zomato gold"], name: "Food Membership" },
  { keywords: ["gym", "fitness", "cult.fit"], name: "Gym & Fitness" },
  { keywords: ["wifi", "broadband", "jio fiber", "airtel Xstream"], name: "Internet Broadband" },
  { keywords: ["electricity", "eb bill", "bescom", "tnebulletin"], name: "Electricity Bill" },
];

/**
 * Calculates financial health metrics and 0-100 score
 */
export const calculateFinancialHealthScore = (
  transactions: Transaction[],
  budgets: Budget[]
): FinancialHealthScore => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthTx = transactions.filter((t) => new Date(t.date) >= startOfCurrentMonth);
  const lastMonthTx = transactions.filter(
    (t) => new Date(t.date) >= startOfLastMonth && new Date(t.date) < startOfCurrentMonth
  );

  const currentIncome = currentMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const currentExpenses = currentMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastExpenses = lastMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // 1. Savings Rate (40 points max)
  let savingsRate = 0;
  if (currentIncome > 0) {
    savingsRate = Math.max(0, ((currentIncome - currentExpenses) / currentIncome) * 100);
  }
  const savingsScore = Math.min(40, (savingsRate / 30) * 40); // 30% savings rate gives max points

  // 2. Budget Adherence (40 points max)
  let budgetScore = 30; // base score if no budgets set
  let totalPercentage = 0;
  if (budgets.length > 0) {
    budgets.forEach((b) => {
      totalPercentage += Math.min(120, b.percentage);
    });
    const avgUsage = totalPercentage / budgets.length;
    if (avgUsage <= 80) budgetScore = 40;
    else if (avgUsage <= 100) budgetScore = 30;
    else budgetScore = 15;
  }

  // 3. Spend Velocity / Stability (20 points max)
  let velocityScore = 15;
  const spendVelocity = lastExpenses > 0 ? currentExpenses / lastExpenses : 1.0;
  if (spendVelocity <= 1.0) velocityScore = 20;
  else if (spendVelocity <= 1.2) velocityScore = 12;
  else velocityScore = 5;

  const totalScore = Math.min(100, Math.max(10, Math.round(savingsScore + budgetScore + velocityScore)));

  let grade: FinancialHealthScore["grade"] = "Good";
  if (totalScore >= 85) grade = "Excellent";
  else if (totalScore >= 70) grade = "Good";
  else if (totalScore >= 50) grade = "Fair";
  else grade = "Needs Attention";

  return {
    score: totalScore,
    grade,
    savingsRate: Math.round(savingsRate),
    budgetAdherence: Math.round(100 - (totalPercentage / (budgets.length || 1))),
    spendVelocity: Math.round(spendVelocity * 100) / 100,
  };
};

/**
 * Calculates category spending changes (This Month vs Previous Month)
 */
export const calculateCategoryTrends = (transactions: Transaction[]): CategoryTrend[] => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();

  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const d = new Date(t.date);
    const amt = Math.abs(t.amount);

    if (d >= startOfCurrentMonth) {
      currentMap.set(t.category, (currentMap.get(t.category) || 0) + amt);
    } else if (d >= startOfLastMonth && d < startOfCurrentMonth) {
      previousMap.set(t.category, (previousMap.get(t.category) || 0) + amt);
    }
  });

  const categories = Array.from(new Set([...currentMap.keys(), ...previousMap.keys()]));

  return categories
    .map((cat) => {
      const cur = currentMap.get(cat) || 0;
      const prev = previousMap.get(cat) || 0;
      let pct = 0;
      if (prev > 0) {
        pct = Math.round(((cur - prev) / prev) * 100);
      } else if (cur > 0) {
        pct = 100;
      }

      return {
        category: cat,
        currentAmount: cur,
        previousAmount: prev,
        percentageChange: pct,
        isIncrease: pct > 0,
      };
    })
    .sort((a, b) => b.currentAmount - a.currentAmount);
};

const STORAGE_CUSTOM_SUBS = "expense-tracker:custom-subscriptions";

export const getCustomSubscriptions = (): SubscriptionItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_CUSTOM_SUBS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveCustomSubscription = (sub: SubscriptionItem) => {
  try {
    const list = getCustomSubscriptions();
    const updated = [sub, ...list.filter((item) => item.name.toLowerCase() !== sub.name.toLowerCase())];
    localStorage.setItem(STORAGE_CUSTOM_SUBS, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving custom subscription:", e);
  }
};

export const deleteCustomSubscription = (name: string) => {
  try {
    const list = getCustomSubscriptions();
    const updated = list.filter((item) => item.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(STORAGE_CUSTOM_SUBS, JSON.stringify(updated));
  } catch (e) {
    console.error("Error deleting custom subscription:", e);
  }
};

/**
 * Detects recurring subscriptions and predicts upcoming renewals
 */
export const detectSubscriptions = (transactions: Transaction[]): SubscriptionItem[] => {
  const now = new Date();
  const detected: SubscriptionItem[] = [];
  const foundMap = new Map<string, { lastDate: Date; amount: number; category: string }>();

  // Filter expense transactions sorted newest first
  const sortedTx = [...transactions]
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sortedTx.forEach((t) => {
    const desc = t.description.toLowerCase();
    const subMatch = KNOWN_SUBSCRIPTIONS.find((sub) =>
      sub.keywords.some((kw) => desc.includes(kw))
    );

    if (subMatch && !foundMap.has(subMatch.name)) {
      foundMap.set(subMatch.name, {
        lastDate: new Date(t.date),
        amount: Math.abs(t.amount),
        category: t.category,
      });
    }
  });

  foundMap.forEach((info, name) => {
    // Estimate next renewal 30 days after last date
    const nextRenewal = new Date(info.lastDate);
    nextRenewal.setDate(nextRenewal.getDate() + 30);

    const diffTime = nextRenewal.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    detected.push({
      name,
      amount: info.amount,
      frequency: "monthly",
      lastDate: info.lastDate.toISOString().split("T")[0],
      nextRenewalDate: nextRenewal.toISOString().split("T")[0],
      daysUntilRenewal: diffDays,
      category: info.category,
    });
  });

  // Merge custom manual subscriptions
  const customList = getCustomSubscriptions();
  customList.forEach((c) => {
    if (!detected.some((d) => d.name.toLowerCase() === c.name.toLowerCase())) {
      const nextRenewal = new Date(c.nextRenewalDate || now);
      const diffTime = nextRenewal.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      detected.push({
        ...c,
        daysUntilRenewal: diffDays,
      });
    }
  });

  return detected.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
};

/**
 * Generates Smart Insight cards based on financial data
 */
export const generateSmartInsights = (
  transactions: Transaction[],
  budgets: Budget[]
): SmartInsight[] => {
  const insights: SmartInsight[] = [];
  const trends = calculateCategoryTrends(transactions);
  const subscriptions = detectSubscriptions(transactions);

  // 1. High Spending Spike Warnings
  const spikeCategory = trends.find((t) => t.isIncrease && t.percentageChange >= 30 && t.currentAmount > 1500);
  if (spikeCategory) {
    const savingsEst = Math.round(spikeCategory.currentAmount * 0.25);
    insights.push({
      id: `insight-spike-${spikeCategory.category}`,
      type: "warning",
      title: `High Spending in ${spikeCategory.category}`,
      message: `You spent ${spikeCategory.percentageChange}% more on ${spikeCategory.category} this month (₹${spikeCategory.currentAmount.toLocaleString("en-IN")}) compared to last month.`,
      actionText: `Cutting back 25% could save ₹${savingsEst.toLocaleString("en-IN")}/mo`,
      impactAmount: savingsEst,
      category: spikeCategory.category,
    });
  }

  // 2. Upcoming Subscription Renewals
  const upcomingSub = subscriptions.find((s) => s.daysUntilRenewal <= 5);
  if (upcomingSub) {
    insights.push({
      id: `insight-renewal-${upcomingSub.name}`,
      type: "renewal",
      title: `${upcomingSub.name} Renewal Coming Up`,
      message: `Your ${upcomingSub.name} subscription (₹${upcomingSub.amount.toLocaleString("en-IN")}) renews in ${upcomingSub.daysUntilRenewal === 0 ? "today" : `${upcomingSub.daysUntilRenewal} days`}.`,
      actionText: `Renews on ${upcomingSub.nextRenewalDate}`,
      impactAmount: upcomingSub.amount,
    });
  }

  // 3. Money Saver Tip
  const diningTrend = trends.find((t) => t.category.toLowerCase().includes("food") || t.category.toLowerCase().includes("dining"));
  if (diningTrend && diningTrend.currentAmount > 2500) {
    const saveAmt = Math.round(diningTrend.currentAmount * 0.3);
    insights.push({
      id: "insight-dining-saver",
      type: "saver",
      title: "Smart Dining Saver Tip",
      message: `You've spent ₹${diningTrend.currentAmount.toLocaleString("en-IN")} on food & dining this month. Cooking 2 extra meals at home each week could save you money!`,
      actionText: `Potential monthly savings: ₹${saveAmt.toLocaleString("en-IN")}`,
      impactAmount: saveAmt,
    });
  }

  // 4. Budget Achievement / Good Milestone
  const healthyBudgets = budgets.filter((b) => b.percentage <= 75 && b.amount > 0);
  if (healthyBudgets.length > 0) {
    const topBudget = healthyBudgets[0];
    insights.push({
      id: `insight-budget-good-${topBudget.id}`,
      type: "achievement",
      title: `On Track with ${topBudget.category} Budget`,
      message: `Great job! You've used only ${topBudget.percentage.toFixed(0)}% of your ${topBudget.category} budget this month.`,
      actionText: `₹${(topBudget.amount - topBudget.spent).toLocaleString("en-IN")} remaining`,
    });
  }

  // Fallback default insight if list is short
  if (insights.length < 2) {
    insights.push({
      id: "insight-default-savings",
      type: "saver",
      title: "Automate Your Savings Habit",
      message: "Setting aside 15% of your income into savings at the start of each month builds a solid financial cushion.",
      actionText: "Set a monthly savings goal",
    });
  }

  return insights;
};

/**
 * AI Assistant Chatbot logic - processes natural language questions against user data
 */
export const askFinancialAdvisor = (
  query: string,
  transactions: Transaction[],
  budgets: Budget[]
): string => {
  const q = query.toLowerCase();
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthExpenses = transactions.filter(
    (t) => t.type === "expense" && new Date(t.date) >= startOfCurrentMonth
  );

  const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // 1. Where did I spend the most / top spending category
  if (q.includes("most") || q.includes("highest") || q.includes("top category") || q.includes("where did i spend")) {
    const catMap = new Map<string, number>();
    currentMonthExpenses.forEach((t) => {
      catMap.set(t.category, (catMap.get(t.category) || 0) + Math.abs(t.amount));
    });

    const sorted = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
      return "You haven't recorded any expenses for this month yet!";
    }

    const top = sorted[0];
    const topPct = totalExpense > 0 ? Math.round((top[1] / totalExpense) * 100) : 0;

    return `Your highest spending category this month is **${top[0]}** with a total of **₹${top[1].toLocaleString("en-IN")}** (${topPct}% of your monthly expenses). ${
      sorted.length > 1
        ? `Followed by **${sorted[1][0]}** (₹${sorted[1][1].toLocaleString("en-IN")}).`
        : ""
    }`;
  }

  // 2. How to save money / savings advice
  if (q.includes("save") || q.includes("advice") || q.includes("tip") || q.includes("reduce")) {
    const trends = calculateCategoryTrends(transactions);
    const topIncrease = trends.find((t) => t.isIncrease && t.currentAmount > 1000);

    if (topIncrease) {
      const potentialSave = Math.round(topIncrease.currentAmount * 0.3);
      return `💡 **Money Saving Advice:**\n\nYour spending in **${topIncrease.category}** grew by **${topIncrease.percentageChange}%** this month to ₹${topIncrease.currentAmount.toLocaleString("en-IN")}.\n\nReducing this category by 30% would instantly save you **₹${potentialSave.toLocaleString("en-IN")}** per month!`;
    }

    return "💡 **General Financial Advice:**\n\n1. Follow the **50/30/20 rule**: 50% for Needs, 30% for Wants, and 20% for Savings.\n2. Set up category budgets in the Budget Manager tab to alert you when approaching limits.\n3. Track recurring subscriptions and cancel any unused services.";
  }

  // 3. Subscriptions / Recurring bills
  if (q.includes("subscription") || q.includes("recurring") || q.includes("renew")) {
    const subs = detectSubscriptions(transactions);
    if (subs.length === 0) {
      return "No recurring subscriptions were automatically detected in your recent transaction history.";
    }

    const totalSubCost = subs.reduce((sum, s) => sum + s.amount, 0);
    const subListText = subs
      .map((s) => `- **${s.name}**: ₹${s.amount.toLocaleString("en-IN")}/mo (Next renewal: ${s.nextRenewalDate})`)
      .join("\n");

    return `📅 **Your Detected Active Subscriptions:**\n\n${subListText}\n\n**Total Monthly Subscription Load:** ₹${totalSubCost.toLocaleString("en-IN")}/month.`;
  }

  // 4. Budget status
  if (q.includes("budget") || q.includes("limit") || q.includes("overbudget")) {
    if (budgets.length === 0) {
      return "You haven't created any budgets yet! You can set category or account budgets under Features > Budgets.";
    }

    const exceeded = budgets.filter((b) => b.percentage >= 100);
    const warning = budgets.filter((b) => b.percentage >= b.alert_threshold && b.percentage < 100);

    if (exceeded.length > 0) {
      return `⚠️ **Budget Alert:** You have exceeded your budget for **${exceeded.map((b) => b.category).join(", ")}**!`;
    }

    if (warning.length > 0) {
      return `⚠️ **Warning:** You are close to your limit on **${warning.map((b) => b.category).join(", ")}**.`;
    }

    return "✅ All your set budgets are currently within safe limits!";
  }

  // Fallback total monthly summary
  return `📊 **Monthly Summary:**\n\nYou have spent a total of **₹${totalExpense.toLocaleString("en-IN")}** across ${currentMonthExpenses.length} expense transactions this month.\n\nAsk me specific questions like: *"Where did I spend the most?"*, *"What are my subscriptions?"*, or *"How can I save money?"*`;
};
