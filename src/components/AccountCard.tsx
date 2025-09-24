import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Account } from "@/hooks/useExpenseData";
import { CreditCardIcon, EditIcon } from "lucide-react";

interface AccountCardProps {
  account: Account;
  onEditAccount: (account: Account) => void;
}

export const AccountCard = ({ account, onEditAccount }: AccountCardProps) => {
  const isNegative = account.balance < 0;
  
  return (
    <Card className="bg-gradient-card shadow-card-shadow hover:shadow-financial transition-all duration-200 relative group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full bg-gradient-to-br ${account.color}`}>
            <CreditCardIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
              {account.type}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditAccount(account)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              <EditIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">{account.name}</h3>
          <p className={`text-2xl font-bold ${isNegative ? 'text-destructive' : 'text-success'}`}>
            {isNegative ? '-' : ''}₹{Math.abs(account.balance).toLocaleString('en-IN', { 
              minimumFractionDigits: 2 
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};