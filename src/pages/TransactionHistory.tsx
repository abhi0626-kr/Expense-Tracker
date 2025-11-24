import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, SearchIcon, DownloadIcon, FileTextIcon, FileSpreadsheetIcon } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useExpenseData } from "@/hooks/useExpenseData";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, deleteTransaction, loading } = useExpenseData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredTransactions, filename);
    
    toast({
      title: "Export successful",
      description: `${filteredTransactions.length} transactions exported to CSV.`,
    });
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    exportToPDF(filteredTransactions, filename);
    
    toast({
      title: "Export successful",
      description: `${filteredTransactions.length} transactions exported to PDF.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading transactions...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-muted"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Transaction History</h1>
                <p className="text-sm text-muted-foreground">View all your transactions</p>
              </div>
            </div>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={filteredTransactions.length === 0}
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filters */}
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-input border-border"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-input border-border">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-input border-border">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-full flex-shrink-0 ${
                        transaction.type === "income" 
                          ? "bg-success/20 text-success" 
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {transaction.type === "income" ? (
                          <ArrowUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{transaction.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={transaction.category} />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(transaction.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`text-base md:text-lg font-bold whitespace-nowrap ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString('en-IN', { 
                          minimumFractionDigits: 2 
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TransactionHistory;
