import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bot,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Send,
  ShieldCheck,
  Zap,
  Lightbulb,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  PiggyBank,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { ExpandableText } from "@/components/ExpandableText";
import {
  calculateFinancialHealthScore,
  calculateCategoryTrends,
  detectSubscriptions,
  saveCustomSubscription,
  deleteCustomSubscription,
  generateSmartInsights,
  askFinancialAdvisor,
  ChatMessage,
  SubscriptionItem,
} from "@/utils/financialAdvisorEngine";

export const FinancialAdvisor = () => {
  const { transactions } = useExpenseData();
  const { budgets } = useBudgets();

  const [activeTab, setActiveTab] = useState<"insights" | "subscriptions" | "chat">("insights");

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "bot",
      text: "Hello! I am your AI Financial Advisor. 🤖💡 Ask me anything about your spending, subscriptions, or how to save money this month!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestions: [
        "Where did I spend the most money?",
        "How can I save ₹5,000 next month?",
        "What are my active subscriptions?",
        "Am I staying within my budget?",
      ],
    },
  ]);

  // Custom Subscriptions State
  const [subRefreshKey, setSubRefreshKey] = useState(0);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubAmount, setNewSubAmount] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("Subscriptions");
  const [newSubNextDate, setNewSubNextDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubAmount || isNaN(Number(newSubAmount))) return;

    const subItem: SubscriptionItem = {
      name: newSubName.trim(),
      amount: parseFloat(newSubAmount),
      frequency: "monthly",
      lastDate: new Date().toISOString().split("T")[0],
      nextRenewalDate: newSubNextDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysUntilRenewal: 30,
      category: newSubCategory || "Subscriptions",
    };

    saveCustomSubscription(subItem);
    setSubRefreshKey((prev) => prev + 1);
    setNewSubName("");
    setNewSubAmount("");
    setIsAddSubOpen(false);
  };

  const handleDeleteSubscription = (name: string) => {
    deleteCustomSubscription(name);
    setSubRefreshKey((prev) => prev + 1);
  };

  // Calculated Analytics
  const health = useMemo(
    () => calculateFinancialHealthScore(transactions, budgets),
    [transactions, budgets]
  );

  const trends = useMemo(
    () => calculateCategoryTrends(transactions),
    [transactions]
  );

  const subscriptions = useMemo(
    () => detectSubscriptions(transactions),
    [transactions, subRefreshKey]
  );

  const insights = useMemo(
    () => generateSmartInsights(transactions, budgets),
    [transactions, budgets]
  );

  // Total monthly subscription load
  const totalSubCost = useMemo(
    () => subscriptions.reduce((sum, s) => sum + s.amount, 0),
    [subscriptions]
  );

  // Send message to AI Chatbot
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");

    // Simulate AI thinking and response
    setTimeout(() => {
      const responseText = askFinancialAdvisor(query, transactions, budgets);
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const getInsightBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px]">High Spike Warning 🚨</Badge>;
      case "saver":
        return <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[10px]">Money Saver Tip 💡</Badge>;
      case "renewal":
        return <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px]">Renewal Alert 📅</Badge>;
      case "achievement":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[10px]">Milestone Achieved 🎉</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Insight</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEALTH SCORE HERO CARD */}
      <Card className="border-border bg-gradient-to-r from-violet-500/15 via-card to-cyan-500/15 shadow-lg backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/10 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Score & Gauge */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center h-20 w-20 rounded-full border-4 border-violet-500/30 bg-violet-500/10 shrink-0">
                <div className="text-center">
                  <span className="text-2xl font-black text-foreground leading-none">{health.score}</span>
                  <span className="text-[10px] text-muted-foreground block font-medium">/ 100</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Financial Health Score</h2>
                  <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 font-bold ${
                    health.score >= 85
                      ? "bg-green-500/15 text-green-500 border border-green-500/30"
                      : health.score >= 70
                      ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/30"
                      : health.score >= 50
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : "bg-red-500/15 text-red-500 border border-red-500/30"
                  }`}>
                    {health.grade}
                  </Badge>
                </div>
                <ExpandableText
                  text="Based on your savings rate, budget usage, and spending velocity this month."
                  maxChars={50}
                  className="text-xs text-muted-foreground mt-1"
                />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Savings Rate</p>
                <p className="text-base font-bold text-green-500">{health.savingsRate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Budget Adherence</p>
                <p className="text-base font-bold text-cyan-500">{health.budgetAdherence}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Monthly Velocity</p>
                <p className="text-base font-bold text-violet-500">{health.spendVelocity}x</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-border space-x-4 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "insights"
              ? "border-violet-500 text-violet-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="sm:hidden">Insights ({insights.length})</span>
          <span className="hidden sm:inline">Smart Insights ({insights.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "subscriptions"
              ? "border-violet-500 text-violet-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="sm:hidden">Subs ({subscriptions.length})</span>
          <span className="hidden sm:inline">Subscriptions ({subscriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "chat"
              ? "border-violet-500 text-violet-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="sm:hidden">AI Chat 🤖</span>
          <span className="hidden sm:inline">AI Assistant Chat 🤖</span>
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. SMART INSIGHTS TAB */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="border-border bg-card/90 shadow-md backdrop-blur-xl dark:bg-slate-950/80 hover:border-violet-500/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    {getInsightBadge(insight.type)}
                    {insight.impactAmount && (
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        +₹{insight.impactAmount.toLocaleString("en-IN")} / mo
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-foreground mt-2">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ExpandableText text={insight.message} maxChars={60} className="text-xs text-muted-foreground leading-relaxed" />
                  {insight.actionText && (
                    <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center justify-between">
                      <span>{insight.actionText}</span>
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Category Trends Comparison */}
          <Card className="border-border bg-card/90 shadow-md backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="sm:hidden">Category Inflation (This Month vs Last)</span>
                <span className="hidden sm:inline">Category Spending Inflation (This Month vs Last Month)</span>
              </CardTitle>
              <ExpandableText text="Track which categories saw the highest percentage spending changes" maxChars={45} className="text-xs text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {trends.slice(0, 5).map((trend) => (
                <div key={trend.category} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{trend.category}</p>
                    <p className="text-[11px] text-muted-foreground">
                      This Month: <strong>₹{trend.currentAmount.toLocaleString("en-IN")}</strong> vs Last: ₹{trend.previousAmount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 ${
                    trend.isIncrease
                      ? "border-red-500/30 text-red-500 bg-red-500/10"
                      : "border-green-500/30 text-green-500 bg-green-500/10"
                  }`}>
                    {trend.isIncrease ? `+${trend.percentageChange}%` : `${trend.percentageChange}%`}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. SUBSCRIPTIONS TAB */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <Card className="border-cyan-500/30 bg-cyan-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">
                  <span className="sm:hidden">Monthly Subscriptions Load</span>
                  <span className="hidden sm:inline">Total Monthly Subscriptions Load</span>
                </p>
                <p className="text-2xl font-bold text-foreground">₹{totalSubCost.toLocaleString("en-IN")}<span className="text-xs font-normal text-muted-foreground">/month</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Annual recurring cost: <strong>₹{(totalSubCost * 12).toLocaleString("en-IN")}</strong>
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                <RefreshCw className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="sm:hidden">Active Subscriptions</span>
                <span className="hidden sm:inline">Active & Tracked Subscriptions</span>
              </h3>

              <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8 gap-1.5 rounded-lg">
                    <Plus className="h-3.5 w-3.5" />
                    Add Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-border bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-cyan-500" />
                      Add Custom Subscription
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSubscription} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Service Name</label>
                      <Input
                        placeholder="e.g. ChatGPT Plus, Prime Video, Gym"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Monthly Cost (₹)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 1999"
                          value={newSubAmount}
                          onChange={(e) => setNewSubAmount(e.target.value)}
                          required
                          min="1"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Category</label>
                        <Input
                          placeholder="e.g. Entertainment, Bills"
                          value={newSubCategory}
                          onChange={(e) => setNewSubCategory(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Next Renewal Date</label>
                      <Input
                        type="date"
                        value={newSubNextDate}
                        onChange={(e) => setNewSubNextDate(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddSubOpen(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
                        Save Subscription
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
                <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No active subscriptions detected yet</p>
                <p className="text-xs opacity-75 mt-1">
                  Subscriptions are detected automatically from transactions (Netflix, Spotify, Internet) or you can add them manually above.
                </p>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.name} className="p-3.5 rounded-xl border border-border bg-card/90 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{sub.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Category: {sub.category} • Last charge: {sub.lastDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">₹{sub.amount.toLocaleString("en-IN")}<span className="text-[10px] text-muted-foreground">/mo</span></p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                        Renews in {sub.daysUntilRenewal} days ({sub.nextRenewalDate})
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubscription(sub.name)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0"
                      title="Delete subscription"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. AI CHATBOT TAB */}
      {activeTab === "chat" && (
        <Card className="border-border bg-card/90 shadow-md backdrop-blur-xl dark:bg-slate-950/80 flex flex-col h-[520px]">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-500">
                <Bot className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  AI Financial Assistant
                  <Badge variant="secondary" className="bg-violet-500/10 text-violet-500 text-[10px]">Active</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ask questions about your transactions, budgets, or money-saving advice
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages Stream */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <Avatar className="h-8 w-8 border border-violet-500/30">
                    <AvatarFallback className="bg-violet-500/20 text-violet-500 text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] space-y-2`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-violet-600 text-white rounded-br-none shadow-md"
                        : "bg-muted/60 border border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((sug) => (
                        <button
                          key={sug}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/15 text-violet-600 dark:text-violet-400 transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-muted-foreground block text-right px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Chat Input */}
          <div className="p-3 border-t border-border bg-muted/20 flex gap-2">
            <Input
              placeholder="Ask AI Advisor e.g. Where did I spend the most?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="text-xs bg-background"
            />
            <Button
              onClick={() => handleSendMessage()}
              className="bg-violet-600 hover:bg-violet-700 text-white h-9 px-4 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
