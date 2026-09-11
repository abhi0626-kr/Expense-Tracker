import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Landmark,
  CreditCard,
  Car,
  Home as HomeIcon,
  GraduationCap,
  HelpCircle,
  Zap,
  ArrowRight,
  Receipt,
  Calendar,
  Layers,
} from "lucide-react";
import {
  useLoans,
  Loan,
  LoanType,
  calculateEMI,
  generateAmortizationSchedule,
  calculatePayoffComparison,
} from "@/hooks/useLoans";

const LOAN_TYPE_CONFIG: Record<LoanType, { label: string; icon: any; color: string }> = {
  home: { label: "Home Loan", icon: HomeIcon, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  car: { label: "Car Loan", icon: Car, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  personal: { label: "Personal Loan", icon: Landmark, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  credit_card: { label: "Credit Card Dues", icon: CreditCard, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  education: { label: "Education Loan", icon: GraduationCap, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  other: { label: "Other Debt", icon: HelpCircle, color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
};

export const LoanTracker = () => {
  const { loans, addLoan, deleteLoan, logRepayment } = useLoans();

  // Active view tab: "portfolio" vs "calculator"
  const [viewMode, setViewMode] = useState<"portfolio" | "calculator">("portfolio");

  // Add Loan Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<LoanType>("personal");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState("0");

  // Log Repayment State
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");

  // Standalone Simulator Calculator State
  const [simPrincipal, setSimPrincipal] = useState(500000);
  const [simRate, setSimRate] = useState(9.5);
  const [simTenure, setSimTenure] = useState(60);
  const [simExtra, setSimExtra] = useState(2500);

  // Amortization Schedule Drawer/State
  const [selectedLoanForAmortization, setSelectedLoanForAmortization] = useState<Loan | null>(null);
  const [showSimAmortization, setShowSimAmortization] = useState(false);

  // Computed Portfolio Totals
  const totalDebt = useMemo(
    () => loans.reduce((sum, l) => sum + l.remainingBalance, 0),
    [loans]
  );

  const totalMonthlyEMI = useMemo(
    () => loans.reduce((sum, l) => sum + l.monthlyEMI, 0),
    [loans]
  );

  const totalInterestSavings = useMemo(() => {
    return loans.reduce((sum, l) => {
      if (l.extraMonthlyPayment > 0) {
        const comp = calculatePayoffComparison(
          l.remainingBalance,
          l.interestRate,
          l.monthlyEMI,
          l.extraMonthlyPayment,
          l.startDate,
          l.tenureMonths
        );
        return sum + comp.interestSaved;
      }
      return sum;
    }, 0);
  }, [loans]);

  // Simulator EMI calculation
  const simEMI = useMemo(
    () => calculateEMI(simPrincipal, simRate, simTenure),
    [simPrincipal, simRate, simTenure]
  );

  const simComparison = useMemo(
    () => calculatePayoffComparison(simPrincipal, simRate, simEMI, simExtra, new Date().toISOString().split("T")[0], simTenure),
    [simPrincipal, simRate, simEMI, simExtra, simTenure]
  );

  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    const t = parseInt(tenureMonths, 10);
    const extra = parseFloat(extraMonthlyPayment) || 0;

    if (!name.trim() || isNaN(p) || isNaN(r) || isNaN(t)) return;

    const emi = calculateEMI(p, r, t);

    addLoan({
      name: name.trim(),
      type,
      principal: p,
      remainingBalance: p,
      interestRate: r,
      tenureMonths: t,
      startDate: new Date().toISOString().split("T")[0],
      monthlyEMI: emi,
      extraMonthlyPayment: extra,
    });

    setName("");
    setPrincipal("");
    setInterestRate("");
    setTenureMonths("");
    setExtraMonthlyPayment("0");
    setIsAddOpen(false);
  };

  const handleLogRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId || !repayAmount || isNaN(Number(repayAmount))) return;
    logRepayment(repayLoanId, parseFloat(repayAmount));
    setRepayLoanId(null);
    setRepayAmount("");
  };

  return (
    <div className="space-y-6">
      {/* HERO SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 via-card to-background shadow-md">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Outstanding Debt</p>
              <h3 className="text-2xl font-black text-foreground">₹{totalDebt.toLocaleString("en-IN")}</h3>
              <p className="text-[11px] text-muted-foreground">Across {loans.length} active loan accounts</p>
            </div>
            <div className="p-3 rounded-2xl bg-red-500/15 text-red-500 shrink-0">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-background shadow-md">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Monthly EMI Load</p>
              <h3 className="text-2xl font-black text-foreground">₹{totalMonthlyEMI.toLocaleString("en-IN")}</h3>
              <p className="text-[11px] text-muted-foreground">Required recurring debt service</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500 shrink-0">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-background shadow-md">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Interest Savings Potential</p>
              <h3 className="text-2xl font-black text-emerald-500">₹{totalInterestSavings.toLocaleString("en-IN")}</h3>
              <p className="text-[11px] text-muted-foreground">Saved via extra prepayments</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOP NAVIGATION TOGGLE & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
          <Button
            variant={viewMode === "portfolio" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("portfolio")}
            className="flex-1 sm:flex-initial text-xs font-semibold rounded-lg gap-1.5"
          >
            <Landmark className="h-3.5 w-3.5" />
            My Debt Portfolio ({loans.length})
          </Button>
          <Button
            variant={viewMode === "calculator" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calculator")}
            className="flex-1 sm:flex-initial text-xs font-semibold rounded-lg gap-1.5"
          >
            <Calculator className="h-3.5 w-3.5 text-violet-500" />
            Prepayment Savings Calculator
          </Button>
        </div>

        {viewMode === "portfolio" && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5 w-full sm:w-auto rounded-xl">
                <Plus className="h-4 w-4" />
                Add Loan / Debt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-violet-500" />
                  Add Debt or Loan Account
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddLoanSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Loan Title / Bank Name</label>
                  <Input
                    placeholder="e.g. HDFC Home Loan, ICICI Car Loan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <Select value={type} onValueChange={(v) => setType(v as LoanType)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LOAN_TYPE_CONFIG).map(([k, cfg]) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Loan Principal (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      required
                      min="1"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Interest Rate (% p.a.)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 8.75"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      required
                      min="0.1"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Tenure (Months)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 120"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(e.target.value)}
                      required
                      min="1"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Extra Prepayment per Month (Optional ₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={extraMonthlyPayment}
                    onChange={(e) => setExtraMonthlyPayment(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Calculates how much faster you become debt-free by paying extra EMI.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                    Save Loan Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* VIEW 1: MY DEBT PORTFOLIO LIST */}
      {viewMode === "portfolio" && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <Card className="border-dashed border-2 border-border bg-card/50 py-12 text-center">
              <CardContent className="space-y-3">
                <div className="p-4 rounded-full bg-violet-500/10 text-violet-500 w-16 h-16 mx-auto flex items-center justify-center">
                  <Landmark className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">No Debt Records Added Yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Track your Home Loan, Personal Loan, Car Loan, or Credit Card Dues to visualize payoff schedules and save interest.
                </p>
                <Button onClick={() => setIsAddOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Your First Loan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map((loan) => {
                const config = LOAN_TYPE_CONFIG[loan.type] || LOAN_TYPE_CONFIG.other;
                const IconComponent = config.icon;
                const pctRepaid = Math.round(((loan.principal - loan.remainingBalance) / loan.principal) * 100);

                const comparison = calculatePayoffComparison(
                  loan.remainingBalance,
                  loan.interestRate,
                  loan.monthlyEMI,
                  loan.extraMonthlyPayment,
                  loan.startDate,
                  loan.tenureMonths
                );

                return (
                  <Card key={loan.id} className="border-border bg-card/90 shadow-md backdrop-blur-xl hover:border-violet-500/30 transition-all overflow-hidden">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${config.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{loan.name}</h4>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 border-border">
                            {config.label} • {loan.interestRate}% p.a.
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLoanForAmortization(loan)}
                          title="View Amortization Schedule"
                          className="h-8 w-8 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10"
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLoan(loan.id)}
                          title="Delete Loan"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Repayment Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Repayment Progress</span>
                          <span className="font-bold text-foreground">{pctRepaid}% Paid</span>
                        </div>
                        <Progress value={pctRepaid} className="h-2 bg-muted" />
                      </div>

                      {/* Loan Figures Grid */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 text-xs">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Remaining Balance</p>
                          <p className="font-bold text-foreground">₹{loan.remainingBalance.toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Monthly EMI</p>
                          <p className="font-bold text-foreground">₹{loan.monthlyEMI.toLocaleString("en-IN")}/mo</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Original Loan</p>
                          <p className="font-medium text-muted-foreground">₹{loan.principal.toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Tenure</p>
                          <p className="font-medium text-muted-foreground">{loan.tenureMonths} Months</p>
                        </div>
                      </div>

                      {/* Extra Payment Insight Badge */}
                      {loan.extraMonthlyPayment > 0 ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-4 w-4 shrink-0" />
                            <span className="text-[11px]">
                              Extra <strong>₹{loan.extraMonthlyPayment.toLocaleString("en-IN")}/mo</strong> saves{" "}
                              <strong>₹{comparison.interestSaved.toLocaleString("en-IN")}</strong> interest!
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 shrink-0">
                            {comparison.monthsSaved} mo earlier
                          </Badge>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15 text-xs flex items-center justify-between text-muted-foreground">
                          <span className="text-[11px]">Tip: Add an extra prepayment to save interest</span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setSelectedLoanForAmortization(loan)}
                            className="text-violet-500 text-[11px] h-auto p-0"
                          >
                            Simulate Extra
                          </Button>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRepayLoanId(loan.id);
                            setRepayAmount(loan.monthlyEMI.toString());
                          }}
                          className="w-full text-xs gap-1.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Log EMI / Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE PREPAYMENT & SAVINGS SIMULATOR */}
      {viewMode === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulator Inputs */}
          <Card className="lg:col-span-1 border-border bg-card/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-violet-500" />
                Loan & Prepayment Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust parameters to calculate your EMI and see how extra monthly payments save huge interest.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-foreground">Loan Amount (Principal)</label>
                  <span className="font-bold text-violet-500">₹{simPrincipal.toLocaleString("en-IN")}</span>
                </div>
                <Input
                  type="number"
                  step="10000"
                  value={simPrincipal}
                  onChange={(e) => setSimPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-foreground">Interest Rate (% p.a.)</label>
                  <span className="font-bold text-violet-500">{simRate}%</span>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  value={simRate}
                  onChange={(e) => setSimRate(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="font-semibold text-foreground">Tenure (Months)</label>
                  <span className="font-bold text-violet-500">{simTenure} months ({Math.round(simTenure / 12 * 10) / 10} yrs)</span>
                </div>
                <Input
                  type="number"
                  value={simTenure}
                  onChange={(e) => setSimTenure(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex justify-between">
                  <label className="font-semibold text-emerald-500 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" /> Extra Monthly Prepayment (₹)
                  </label>
                  <span className="font-bold text-emerald-500">₹{simExtra.toLocaleString("en-IN")}</span>
                </div>
                <Input
                  type="number"
                  step="500"
                  value={simExtra}
                  onChange={(e) => setSimExtra(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="text-xs border-emerald-500/40 focus:border-emerald-500"
                />
                <p className="text-[11px] text-muted-foreground">
                  Additional payment added to your regular monthly EMI.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Savings Result Cards & Amortization Schedule */}
          <div className="lg:col-span-2 space-y-4">
            {/* Savings Banner Card */}
            <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-card to-cyan-500/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs px-2.5 py-0.5">
                      Fast-Track Payoff Savings 🎉
                    </Badge>
                    <h3 className="text-3xl font-black text-foreground mt-2">
                      Save ₹{simComparison.interestSaved.toLocaleString("en-IN")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Become debt-free <strong>{simComparison.monthsSaved} months ({Math.round(simComparison.monthsSaved / 12 * 10) / 10} yrs)</strong> earlier!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-500 text-center shrink-0 border border-emerald-500/30">
                    <p className="text-[11px] uppercase font-bold text-muted-foreground">Standard Monthly EMI</p>
                    <p className="text-2xl font-black text-foreground">₹{simEMI.toLocaleString("en-IN")}</p>
                    {simExtra > 0 && (
                      <p className="text-[11px] font-bold text-emerald-500 mt-1">
                        + ₹{simExtra.toLocaleString("en-IN")} extra = ₹{(simEMI + simExtra).toLocaleString("en-IN")}/mo
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Standard Payoff */}
              <Card className="border-border bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
                    <span>Standard Repayment</span>
                    <Badge variant="outline" className="text-[10px]">Baseline</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Repayment Duration</span>
                    <span className="font-bold text-foreground">{simComparison.standardMonths} months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Total Interest Paid</span>
                    <span className="font-bold text-red-500">₹{simComparison.standardTotalInterest.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Total Amount Paid</span>
                    <span className="font-bold text-foreground">₹{simComparison.standardTotalPayment.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Debt Free Target</span>
                    <span className="font-semibold text-foreground">{simComparison.standardPayoffDate}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fast-Track Payoff */}
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Fast-Track Repayment</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 text-[10px]">With Extra</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-emerald-500/20">
                    <span className="text-muted-foreground">Repayment Duration</span>
                    <span className="font-bold text-emerald-500">{simComparison.fastTrackMonths} months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-500/20">
                    <span className="text-muted-foreground">Total Interest Paid</span>
                    <span className="font-bold text-emerald-500">₹{simComparison.fastTrackTotalInterest.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Total Amount Paid</span>
                    <span className="font-bold text-foreground">₹{simComparison.fastTrackTotalPayment.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Debt Free Target</span>
                    <span className="font-semibold text-emerald-500">{simComparison.fastTrackPayoffDate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Toggle Amortization Schedule View */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSimAmortization(!showSimAmortization)}
                className="text-xs gap-1.5 border-violet-500/30 text-violet-500"
              >
                <Layers className="h-3.5 w-3.5" />
                {showSimAmortization ? "Hide Monthly Amortization Table" : "View Full Amortization Schedule Table"}
              </Button>
            </div>

            {/* Amortization Table */}
            {showSimAmortization && (
              <Card className="border-border bg-card/90 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-foreground">
                    Month-by-Month Amortization Schedule (First 24 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-muted text-muted-foreground uppercase">
                      <tr>
                        <th className="p-2.5">Month</th>
                        <th className="p-2.5">Principal Paid</th>
                        <th className="p-2.5">Interest Paid</th>
                        <th className="p-2.5">Total Payment</th>
                        <th className="p-2.5">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {generateAmortizationSchedule(simPrincipal, simRate, simEMI, simExtra, new Date().toISOString().split("T")[0], simTenure)
                        .slice(0, 24)
                        .map((m) => (
                          <tr key={m.month} className="hover:bg-muted/30">
                            <td className="p-2.5 font-medium">{m.month} ({m.date})</td>
                            <td className="p-2.5 font-bold text-emerald-500">₹{m.principalPaid.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 text-amber-500">₹{m.interestPaid.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 font-semibold">₹{m.totalPayment.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 text-muted-foreground">₹{m.endingBalance.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* LOG REPAYMENT DIALOG */}
      <Dialog open={!!repayLoanId} onOpenChange={(open) => !open && setRepayLoanId(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Log Loan Repayment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLogRepaymentSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Repayment Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter amount paid"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                required
                min="1"
                className="text-xs"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Logging a payment subtracts directly from your remaining loan principal.
            </p>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRepayLoanId(null)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Record Repayment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AMORTIZATION MODAL FOR SPECIFIC LOAN */}
      <Dialog open={!!selectedLoanForAmortization} onOpenChange={(open) => !open && setSelectedLoanForAmortization(null)}>
        <DialogContent className="sm:max-w-2xl border-border bg-card max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-500" />
              Amortization Schedule: {selectedLoanForAmortization?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedLoanForAmortization && (
            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-muted/40 text-[11px]">
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-bold">₹{selectedLoanForAmortization.remainingBalance.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-bold">{selectedLoanForAmortization.interestRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly EMI</p>
                  <p className="font-bold">₹{selectedLoanForAmortization.monthlyEMI.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Extra Prepayment</p>
                  <p className="font-bold text-emerald-500">₹{selectedLoanForAmortization.extraMonthlyPayment.toLocaleString("en-IN")}/mo</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-muted text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2">Month</th>
                      <th className="p-2">Principal</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">Total Payment</th>
                      <th className="p-2">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {generateAmortizationSchedule(
                      selectedLoanForAmortization.remainingBalance,
                      selectedLoanForAmortization.interestRate,
                      selectedLoanForAmortization.monthlyEMI,
                      selectedLoanForAmortization.extraMonthlyPayment,
                      selectedLoanForAmortization.startDate,
                      selectedLoanForAmortization.tenureMonths
                    ).map((m) => (
                      <tr key={m.month} className="hover:bg-muted/30">
                        <td className="p-2 font-medium">{m.month} ({m.date})</td>
                        <td className="p-2 font-bold text-emerald-500">₹{m.principalPaid.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-amber-500">₹{m.interestPaid.toLocaleString("en-IN")}</td>
                        <td className="p-2 font-semibold">₹{m.totalPayment.toLocaleString("en-IN")}</td>
                        <td className="p-2 text-muted-foreground">₹{m.endingBalance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setSelectedLoanForAmortization(null)} className="text-xs">
              Close Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
