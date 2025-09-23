import { Card, CardContent } from "@/components/ui/card";
import { Account } from "./Dashboard";
import { CreditCardIcon } from "lucide-react";

interface AccountCardProps {
  account: Account;
}

export const AccountCard = ({ account }: AccountCardProps) => {
  const isNegative = account.balance < 0;
  
  return (
    <Card className="bg-gradient-card shadow-card-shadow hover:shadow-financial transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full bg-gradient-to-br ${account.color}`}>
            <CreditCardIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
            {account.type}
          </span>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">{account.name}</h3>
          <p className={`text-2xl font-bold ${isNegative ? 'text-destructive' : 'text-success'}`}>
            {isNegative ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', { 
              minimumFractionDigits: 2 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};