import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileJson,
  AlertCircle,
  Check,
} from "lucide-react";
import { Transaction, Account } from "@/hooks/useExpenseData";
import {
  exportToCSV,
  exportToPDF,
  exportToExcel,
  exportBackup,
  importFromCSV,
  ImportedTransaction,
} from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportImportProps {
  transactions: Transaction[];
  accounts: Account[];
  onImportTransactions?: (transactions: ImportedTransaction[], accountId: string) => Promise<void>;
}

export const ExportImport = ({
  transactions,
  accounts,
  onImportTransactions,
}: ExportImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedTransaction[] | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [importing, setImporting] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(transactions, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    toast({
      title: "Export successful",
      description: "Transactions exported to CSV",
    });
  };

  const handleExportPDF = () => {
    exportToPDF(transactions, `transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: "Export successful",
      description: "Transactions exported to PDF",
    });
  };

  const handleExportExcel = () => {
    exportToExcel(transactions, accounts, `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`);
    toast({
      title: "Export successful",
      description: "Data exported for Excel",
    });
  };

  const handleExportBackup = () => {
    exportBackup(transactions, accounts, `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
    toast({
      title: "Backup created",
      description: "Full backup exported as JSON",
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromCSV(file);

      if (data.length === 0) {
        toast({
          title: "No data found",
          description: "The file doesn't contain valid transactions",
          variant: "destructive",
        });
        return;
      }

      setImportedData(data);
      setSelectedAccountId(accounts[0]?.id || "");
      setIsImportDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = async () => {
    if (!importedData || !selectedAccountId || !onImportTransactions) return;

    setImporting(true);
    try {
      await onImportTransactions(importedData, selectedAccountId);
      toast({
        title: "Import successful",
        description: `${importedData.length} transactions imported`,
      });
      setIsImportDialogOpen(false);
      setImportedData(null);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export & Import
          </CardTitle>
          <CardDescription>
            Backup your data or import from other sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Data</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleExportCSV} className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="justify-start">
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="justify-start">
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                Excel
              </Button>
              <Button variant="outline" onClick={handleExportBackup} className="justify-start">
                <FileJson className="h-4 w-4 mr-2 text-blue-500" />
                Full Backup
              </Button>
            </div>
          </div>

          {/* Import Options */}
          {onImportTransactions && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Import Data</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from CSV
              </Button>
              <p className="text-xs text-muted-foreground">
                Supports CSV files exported from this app or other finance apps
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Transactions</DialogTitle>
            <DialogDescription>
              Review and confirm the import
            </DialogDescription>
          </DialogHeader>
          
          {importedData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{importedData.length} transactions found</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    Income: {importedData.filter(t => t.type === 'income').length} |
                    Expense: {importedData.filter(t => t.type === 'expense').length}
                  </p>
                  <p>
                    Total: ₹{importedData.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Import to Account</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Imported transactions will be added to the selected account.
                  This action cannot be undone.
                </p>
              </div>

              {/* Preview first few transactions */}
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.slice(0, 5).map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{t.date}</td>
                        <td className="p-2 truncate max-w-[150px]">{t.description}</td>
                        <td className={`p-2 text-right ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    {importedData.length > 5 && (
                      <tr className="border-t">
                        <td colSpan={3} className="p-2 text-center text-muted-foreground">
                          ... and {importedData.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportConfirm} disabled={importing}>
              {importing ? "Importing..." : `Import ${importedData?.length || 0} Transactions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
