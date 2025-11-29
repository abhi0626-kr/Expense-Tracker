import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

// Popular currencies with their info
export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
];

const CACHE_KEY = "currency_rates";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const useCurrency = (baseCurrency: string = "INR") => {
  const { toast } = useToast();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get cached rates
  const getCachedRates = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates, timestamp, base } = JSON.parse(cached);
        if (
          base === baseCurrency &&
          Date.now() - timestamp < CACHE_DURATION
        ) {
          return rates;
        }
      }
    } catch (error) {
      console.error("Error reading cached rates:", error);
    }
    return null;
  }, [baseCurrency]);

  // Fetch exchange rates from API
  const fetchRates = useCallback(async () => {
    // Check cache first
    const cachedRates = getCachedRates();
    if (cachedRates) {
      setRates(cachedRates);
      setLoading(false);
      return;
    }

    try {
      // Using frankfurter.app (free, no key needed)
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }

      const data = await response.json();
      const newRates: Record<string, number> = { [baseCurrency]: 1, ...data.rates };

      // Cache the rates
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          rates: newRates,
          timestamp: Date.now(),
          base: baseCurrency,
        })
      );

      setRates(newRates);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching exchange rates:", error);
      
      // Fallback to approximate rates if API fails
      const fallbackRates: Record<string, number> = {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
        JPY: 1.78,
        AUD: 0.018,
        CAD: 0.016,
        CHF: 0.011,
        CNY: 0.086,
        SGD: 0.016,
        AED: 0.044,
        SAR: 0.045,
      };

      setRates(fallbackRates);
      toast({
        title: "Using cached exchange rates",
        description: "Could not fetch live rates. Using approximate values.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [baseCurrency, getCachedRates, toast]);

  // Convert amount between currencies
  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      if (from === to) return amount;
      if (!rates[from] || !rates[to]) return amount;

      // Convert to base currency first, then to target
      const inBase = amount / rates[from];
      return inBase * rates[to];
    },
    [rates]
  );

  // Format amount with currency symbol
  const formatCurrency = useCallback(
    (amount: number, currencyCode: string = baseCurrency): string => {
      const currency = CURRENCIES.find((c) => c.code === currencyCode);
      const symbol = currency?.symbol || currencyCode;

      return `${symbol}${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [baseCurrency]
  );

  // Get rate between two currencies
  const getRate = useCallback(
    (from: string, to: string): number => {
      if (from === to) return 1;
      if (!rates[from] || !rates[to]) return 1;
      return rates[to] / rates[from];
    },
    [rates]
  );

  // Refresh rates manually
  const refreshRates = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    await fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    rates,
    loading,
    lastUpdated,
    convert,
    formatCurrency,
    getRate,
    refreshRates,
    currencies: CURRENCIES,
  };
};
