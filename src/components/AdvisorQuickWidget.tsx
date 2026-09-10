import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bot, AlertTriangle, TrendingDown, ArrowRight, ShieldCheck } from "lucide-react";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { generateSmartInsights, calculateFinancialHealthScore } from "@/utils/financialAdvisorEngine";

export const AdvisorQuickWidget = () => {
  const navigate = useNavigate();
  const { transactions } = useExpenseData();
  const { budgets } = useBudgets();

  const health = useMemo(
    () => calculateFinancialHealthScore(transactions, budgets),
    [transactions, budgets]
  );

  const topInsight = useMemo(() => {
    const list = generateSmartInsights(transactions, budgets);
    return list[0] || null;
  }, [transactions, budgets]);

  if (!topInsight) return null;

  const getIcon = () => {
    switch (topInsight.type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />;
      case "saver":
        return <Sparkles className="h-5 w-5 text-violet-500 shrink-0" />;
      case "achievement":
        return <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />;
      default:
        return <Bot className="h-5 w-5 text-cyan-500 shrink-0" />;
    }
  };

  return (
    <Card className="border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-card to-cyan-500/10 shadow-md backdrop-blur-xl dark:border-violet-500/20 overflow-hidden">
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/20 text-violet-500">
              {getIcon()}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 text-[10px] px-2 py-0.5 font-semibold">
                  <Bot className="h-3 w-3 mr-1 inline-block" />
                  AI Financial Insight
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Health Score: <strong className="text-foreground">{health.score}/100 ({health.grade})</strong>
                </span>
              </div>

              <h4 className="text-sm font-semibold text-foreground leading-snug">{topInsight.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1 opacity-90">{topInsight.message}</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/features?tab=advisor")}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm text-xs h-8 shrink-0 w-full sm:w-auto"
          >
            Ask AI Advisor
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
