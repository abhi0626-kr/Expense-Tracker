import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Bot,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
  Bell,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { useToast } from "@/hooks/use-toast";
import {
  generateSmartInsights,
  calculateFinancialHealthScore,
  SmartInsight,
} from "@/utils/financialAdvisorEngine";
import { ExpandableText } from "@/components/ExpandableText";

const STORAGE_HIDE_WIDGET = "expense-tracker:hide-ai-widget";
const STORAGE_DISMISSED_INSIGHTS = "expense-tracker:dismissed-insights";

export const AdvisorQuickWidget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions } = useExpenseData();
  const { budgets } = useBudgets();

  const [isBannerHidden, setIsBannerHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_HIDE_WIDGET) === "true";
    } catch {
      return false;
    }
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DISMISSED_INSIGHTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Health calculation
  const health = useMemo(
    () => calculateFinancialHealthScore(transactions, budgets),
    [transactions, budgets]
  );

  // All generated insights
  const allInsights = useMemo(() => {
    return generateSmartInsights(transactions, budgets);
  }, [transactions, budgets]);

  // Active (non-dismissed) insights
  const activeInsights = useMemo(() => {
    return allInsights.filter((item) => !dismissedIds.includes(item.id));
  }, [allInsights, dismissedIds]);

  const topInsight = activeInsights[0] || null;

  const toggleBannerVisibility = (hidden: boolean) => {
    setIsBannerHidden(hidden);
    try {
      localStorage.setItem(STORAGE_HIDE_WIDGET, String(hidden));
    } catch (err) {
      console.error(err);
    }
    toast({
      title: hidden ? "AI Banner Hidden" : "AI Banner Visible",
      description: hidden
        ? "AI section hidden from dashboard. View notifications anytime via the AI Bell icon."
        : "AI section is now visible on your dashboard.",
    });
  };

  const handleDismissInsight = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(STORAGE_DISMISSED_INSIGHTS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    toast({
      title: "Notification Dismissed",
      description: "Insight removed from list.",
    });
  };

  const handleClearAll = () => {
    const allIds = allInsights.map((i) => i.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem(STORAGE_DISMISSED_INSIGHTS, JSON.stringify(allIds));
    } catch (err) {
      console.error(err);
    }
    toast({
      title: "All Cleared",
      description: "All AI notifications dismissed.",
    });
  };

  const handleRestoreAll = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem(STORAGE_DISMISSED_INSIGHTS);
    } catch (err) {
      console.error(err);
    }
    toast({
      title: "Notifications Restored",
      description: "All AI insights are visible again.",
    });
  };

  const getIcon = (type: SmartInsight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "saver":
        return <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />;
      case "achievement":
        return <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />;
      default:
        return <Bot className="h-4 w-4 text-cyan-500 shrink-0" />;
    }
  };

  return (
    <>
      {/* Top Action Bar: Notification Bell Trigger + Unhide Banner Button */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isBannerHidden && (
            <Badge
              variant="outline"
              className="bg-muted/40 text-muted-foreground border-border text-[10px] px-2 sm:px-2.5 py-1 font-medium flex items-center gap-1 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => toggleBannerVisibility(false)}
              title="Click to show AI section on dashboard"
            >
              <Eye className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span className="hidden sm:inline">AI Section Hidden (Click to Show)</span>
              <span className="sm:hidden">Show AI</span>
            </Badge>
          )}
        </div>

        {/* AI Notification Bell Button */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-medium gap-1.5 rounded-xl ml-auto shadow-sm px-2.5 sm:px-3"
              title="Open AI Notifications & Insights"
            >
              <Bell className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span className="hidden sm:inline">AI Notifications</span>
              {activeInsights.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-sm shrink-0">
                  {activeInsights.length}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l border-border">
            <SheetHeader className="p-4 border-b border-border space-y-1">
              <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Bot className="h-5 w-5 text-violet-500" />
                AI Notifications & Insights
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Real-time financial analysis & smart recommendations
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 p-4 space-y-4">
              {/* Financial Health Summary Box */}
              <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-card to-cyan-500/10 p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    Financial Health Score
                  </span>
                  <Badge variant="outline" className="border-violet-500/30 text-violet-500 text-[10px] font-bold">
                    {health.grade}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-extrabold text-foreground">
                    {health.score}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Adherence: {health.budgetAdherence}%
                  </span>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${health.score}%` }}
                  />
                </div>
              </Card>

              {/* Dashboard Banner Display Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20 my-3">
                <div className="space-y-0.5 pr-2">
                  <p className="text-xs font-medium text-foreground">Show AI Card on Dashboard</p>
                  <p className="text-[11px] text-muted-foreground">
                    Keep top insight card visible on main screen
                  </p>
                </div>
                <Switch
                  checked={!isBannerHidden}
                  onCheckedChange={(checked) => toggleBannerVisibility(!checked)}
                />
              </div>

              {/* Insights Section Header */}
              <div className="flex items-center justify-between pt-2 mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Insights ({activeInsights.length})
                </h4>
                {activeInsights.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-6 text-[11px] text-muted-foreground hover:text-destructive p-0"
                  >
                    Dismiss All
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestoreAll}
                    className="h-6 text-[11px] text-violet-500 hover:text-violet-600 p-0"
                  >
                    Restore All
                  </Button>
                )}
              </div>

              {/* Active Insights List */}
              {activeInsights.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-card/40 my-2">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <p className="text-xs font-medium text-foreground">All caught up!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    No active AI notifications right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeInsights.map((insight) => (
                    <Card
                      key={insight.id}
                      className="border-border bg-card/90 shadow-sm p-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-muted border border-border mt-0.5 shrink-0">
                            {getIcon(insight.type)}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-foreground leading-tight">
                              {insight.title}
                            </h5>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {insight.message}
                            </p>
                            <div className="pt-1.5 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsSheetOpen(false);
                                  navigate("/features?tab=advisor");
                                }}
                                className="h-6 text-[10px] px-2 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                              >
                                Ask Advisor <ArrowRight className="h-2.5 w-2.5 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDismissInsight(insight.id)}
                                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              <Button
                onClick={() => {
                  setIsSheetOpen(false);
                  navigate("/features?tab=advisor");
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 rounded-xl font-medium gap-1.5 shadow-sm"
              >
                <Bot className="h-4 w-4" />
                Open AI Advisor Chat
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Dashboard Top Banner (rendered if not hidden and has active topInsight) */}
      {!isBannerHidden && topInsight && (
        <Card className="border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-card to-cyan-500/10 shadow-sm backdrop-blur-xl dark:border-violet-500/20 overflow-hidden relative">
          <CardContent className="p-3 sm:p-4">
            {/* Top Header Row: Icon + Badge + Health Score + Close X */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-500 shrink-0">
                  {getIcon(topInsight.type)}
                </div>
                <Badge
                  variant="outline"
                  className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 text-[10px] px-2 py-0.5 font-semibold truncate"
                >
                  <Bot className="h-3 w-3 mr-1 inline-block shrink-0" />
                  AI Insight
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
                  Health: <strong className="text-foreground">{health.score}/100</strong>{" "}
                  <span className="hidden sm:inline">({health.grade})</span>
                </span>

                {/* Hide / Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleBannerVisibility(true)}
                  title="Make AI section not visible on dashboard"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Content & Action Section */}
            <div className="space-y-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                  {topInsight.title}
                </h4>
                <ExpandableText
                  text={topInsight.message}
                  maxChars={50}
                  className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  size="sm"
                  onClick={() => navigate("/features?tab=advisor")}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-sm text-xs h-7 sm:h-8 rounded-lg font-medium gap-1"
                >
                  Ask AI Advisor
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsSheetOpen(true)}
                  className="w-full sm:w-auto text-xs h-7 sm:h-8 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-medium gap-1"
                >
                  <Bell className="h-3 w-3" />
                  View All ({activeInsights.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
