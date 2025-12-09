import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Investment } from "@/hooks/useInvestments";
import { TrendingUpIcon, TrendingDownIcon, TrashIcon, Edit2Icon } from "lucide-react";

interface InvestmentCardProps {
  investment: Investment;
  onEdit?: (investment: Investment) => void;
  onDelete?: (id: string) => void;
}

const platformLogos: Record<string, string> = {
  "GPay": "💳",
  "PhonePe": "📱",
  "Zerodha": "📈",
  "Groww": "🌱",
  "Upstox": "📊",
  "Paytm Money": "💰",
  "ET Money": "💵",
  "Kuvera": "🎯",
  "Other": "💼"
};

export const InvestmentCard = ({ investment, onEdit, onDelete }: InvestmentCardProps) => {
  const returns = investment.current_value - investment.amount;
  const returnsPercentage = (returns / investment.amount) * 100;
  const isPositive = returns >= 0;

  return (
    <Card className="bg-gradient-card shadow-card-shadow hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {platformLogos[investment.platform] || platformLogos["Other"]}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{investment.name}</h3>
              <p className="text-sm text-muted-foreground">{investment.platform} • {investment.investment_type}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(investment)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Edit2Icon className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(investment.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="text-lg font-bold text-foreground">
              ₹{investment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-bold text-foreground">
              ₹{investment.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isPositive 
                  ? "bg-success/20 text-success" 
                  : "bg-destructive/20 text-destructive"
              }`}>
                {isPositive ? (
                  <TrendingUpIcon className="w-3 h-3" />
                ) : (
                  <TrendingDownIcon className="w-3 h-3" />
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${
                  isPositive ? "text-success" : "text-destructive"
                }`}>
                  {isPositive ? "+" : ""}₹{Math.abs(returns).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <p className={`text-sm font-semibold ${
              isPositive ? "text-success" : "text-destructive"
            }`}>
              {returnsPercentage > 0 ? "+" : ""}{returnsPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {investment.notes && (
          <p className="mt-2 text-xs text-muted-foreground italic">{investment.notes}</p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Purchased: {new Date(investment.purchase_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </p>
      </CardContent>
    </Card>
  );
};
