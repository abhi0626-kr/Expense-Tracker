import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bot, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { useExpenseData } from "@/hooks/useExpenseData";
import { useBudgets } from "@/hooks/useBudgets";
import { generateSmartInsights, calculateFinancialHealthScore } from "@/utils/financialAdvisorEngine";
import { ExpandableText } from "@/components/ExpandableText";

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
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />;
      case "saver":
        return <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 shrink-0" />;
      case "achievement":
        return <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />;
      default:
        return <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500 shrink-0" />;
    }
  };

  return (
    <Card className="border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-card to-cyan-500/10 shadow-sm backdrop-blur-xl dark:border-violet-500/20 overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        {/* Top Header Row: Icon + Badge + Health Score */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-500 shrink-0">
              {getIcon()}
            </div>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30 text-[10px] px-2 py-0.5 font-semibold truncate">
              <Bot className="h-3 w-3 mr-1 inline-block shrink-0" />
              AI Insight
            </Badge>
          </div>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            Health: <strong className="text-foreground">{health.score}/100</strong> <span className="hidden sm:inline">({health.grade})</span>
          </span>
        </div>

        {/* Content & Action Section */}
        <div className="space-y-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">{topInsight.title}</h4>
            <ExpandableText
              text={topInsight.message}
              maxChars={50}
              className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5"
            />
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/features?tab=advisor")}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-sm text-xs h-7 sm:h-8 rounded-lg font-medium gap-1"
          >
            Ask AI Advisor
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
