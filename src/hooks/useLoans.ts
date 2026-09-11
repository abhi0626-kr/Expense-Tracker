import { useState, useEffect, useCallback } from "react";

export type LoanType = "home" | "personal" | "car" | "credit_card" | "education" | "other";

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  principal: number; // Original loan amount
  remainingBalance: number;
  interestRate: number; // Annual % e.g. 9.5
  tenureMonths: number; // Original tenure in months
  startDate: string;
  monthlyEMI: number;
  extraMonthlyPayment: number;
  created_at: string;
}

export interface AmortizationMonth {
  month: number;
  date: string;
  beginningBalance: number;
  interestPaid: number;
  principalPaid: number;
  totalPayment: number;
  endingBalance: number;
}

export interface PayoffComparison {
  standardMonths: number;
  standardTotalInterest: number;
  standardTotalPayment: number;
  standardPayoffDate: string;

  fastTrackMonths: number;
  fastTrackTotalInterest: number;
  fastTrackTotalPayment: number;
  fastTrackPayoffDate: string;

  monthsSaved: number;
  interestSaved: number;
}

const STORAGE_LOANS = "expense-tracker:loans";

/**
 * Calculates standard EMI given Principal, Annual Rate (%), and Tenure in months
 * Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenureMonths);

  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

/**
 * Generates month-by-month amortization schedule with optional extra prepayment
 */
export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  monthlyEMI: number,
  extraPayment: number = 0,
  startDateStr: string = new Date().toISOString().split("T")[0]
): AmortizationMonth[] => {
  const schedule: AmortizationMonth[] = [];
  if (principal <= 0 || monthlyEMI <= 0) return schedule;

  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;
  let month = 1;
  const startDate = new Date(startDateStr);

  while (balance > 0.01 && month <= 600) {
    const interestForMonth = Math.round(balance * monthlyRate);
    const standardPrincipalPortion = monthlyEMI - interestForMonth;

    let principalPaid = Math.max(0, standardPrincipalPortion) + extraPayment;
    if (principalPaid > balance) {
      principalPaid = balance;
    }

    const totalPayment = interestForMonth + principalPaid;
    const endingBalance = Math.max(0, balance - principalPaid);

    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month - 1);

    schedule.push({
      month,
      date: currentDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      beginningBalance: Math.round(balance),
      interestPaid: Math.round(interestForMonth),
      principalPaid: Math.round(principalPaid),
      totalPayment: Math.round(totalPayment),
      endingBalance: Math.round(endingBalance),
    });

    balance = endingBalance;
    month++;
  }

  return schedule;
};

/**
 * Compares standard repayment vs extra prepayment payoff schedules
 */
export const calculatePayoffComparison = (
  principal: number,
  annualRate: number,
  monthlyEMI: number,
  extraPayment: number,
  startDateStr: string = new Date().toISOString().split("T")[0]
): PayoffComparison => {
  const standardSchedule = generateAmortizationSchedule(principal, annualRate, monthlyEMI, 0, startDateStr);
  const fastTrackSchedule = generateAmortizationSchedule(principal, annualRate, monthlyEMI, extraPayment, startDateStr);

  const standardTotalInterest = standardSchedule.reduce((sum, m) => sum + m.interestPaid, 0);
  const standardTotalPayment = standardSchedule.reduce((sum, m) => sum + m.totalPayment, 0);
  const standardMonths = standardSchedule.length;
  const standardPayoffDate = standardSchedule.length > 0 ? standardSchedule[standardSchedule.length - 1].date : "N/A";

  const fastTrackTotalInterest = fastTrackSchedule.reduce((sum, m) => sum + m.interestPaid, 0);
  const fastTrackTotalPayment = fastTrackSchedule.reduce((sum, m) => sum + m.totalPayment, 0);
  const fastTrackMonths = fastTrackSchedule.length;
  const fastTrackPayoffDate = fastTrackSchedule.length > 0 ? fastTrackSchedule[fastTrackSchedule.length - 1].date : "N/A";

  return {
    standardMonths,
    standardTotalInterest,
    standardTotalPayment,
    standardPayoffDate,

    fastTrackMonths,
    fastTrackTotalInterest,
    fastTrackTotalPayment,
    fastTrackPayoffDate,

    monthsSaved: Math.max(0, standardMonths - fastTrackMonths),
    interestSaved: Math.max(0, standardTotalInterest - fastTrackTotalInterest),
  };
};

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOANS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOANS, JSON.stringify(loans));
    } catch (err) {
      console.error("Failed to save loans:", err);
    }
  }, [loans]);

  const addLoan = useCallback((loanData: Omit<Loan, "id" | "created_at">) => {
    const newLoan: Loan = {
      ...loanData,
      id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    setLoans((prev) => [newLoan, ...prev]);
  }, []);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const logRepayment = useCallback((id: string, amountPaid: number) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const newBalance = Math.max(0, l.remainingBalance - amountPaid);
          return { ...l, remainingBalance: newBalance };
        }
        return l;
      })
    );
  }, []);

  return {
    loans,
    addLoan,
    updateLoan,
    deleteLoan,
    logRepayment,
  };
};
