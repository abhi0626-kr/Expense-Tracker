import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { TransactionList } from "./TransactionList";
import { AddTransaction } from "./AddTransaction";
import { SpendingChart } from "./SpendingChart";
import { useToast } from "@/hooks/use-toast";

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: "1",
      name: "Main Checking",
      type: "Checking",
      balance: 2750.50,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "2", 
      name: "Savings Account",
      type: "Savings",
      balance: 8420.00,
      color: "from-green-500 to-green-600"
    },
    {
      id: "3",
      name: "Credit Card",
      type: "Credit",
      balance: -1205.75,
      color: "from-purple-500 to-purple-600"
    }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      accountId: "1",
      type: "expense",
      amount: 85.50,
      category: "Food & Dining", 
      description: "Grocery shopping",
      date: "2024-01-15"
    },
    {
      id: "2", 
      accountId: "1",
      type: "income",
      amount: 3200.00,
      category: "Salary",
      description: "Monthly salary",
      date: "2024-01-01"
    },
    {
      id: "3",
      accountId: "2",
      type: "expense", 
      amount: 45.00,
      category: "Transportation",
      description: "Gas station",
      date: "2024-01-14"
    }
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === "income" && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === "expense" && new Date(t.date).getMonth() === new Date().getMonth()) 
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update account balance
    setAccounts(prev => prev.map(account => {
      if (account.id === transaction.accountId) {
        const balanceChange = transaction.type === "income" 
          ? transaction.amount 
          : -transaction.amount;
        return { ...account, balance: account.balance + balanceChange };
      }
      return account;
    }));

    setShowAddTransaction(false);
    toast({
      title: "Transaction added",
      description: "Your transaction has been successfully recorded.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
            <p className="text-muted-foreground">Track your accounts and spending</p>
          </div>
          <Button 
            onClick={() => setShowAddTransaction(true)}
            className="bg-gradient-primary text-white shadow-financial"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
              <WalletIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Income
              </CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                +₹{monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Expenses
              </CardTitle>
              <TrendingDownIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                -₹{monthlyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingChart transactions={transactions} />
          <TransactionList transactions={transactions.slice(0, 5)} />
        </div>

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <AddTransaction
            accounts={accounts}
            onAddTransaction={handleAddTransaction}
            onClose={() => setShowAddTransaction(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;