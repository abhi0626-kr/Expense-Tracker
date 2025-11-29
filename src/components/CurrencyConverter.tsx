import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  RefreshCw,
  Globe,
} from "lucide-react";
import { useCurrency, CURRENCIES } from "@/hooks/useCurrency";

export const CurrencyConverter = () => {
  const { rates, loading, convert, formatCurrency, getRate, refreshRates, lastUpdated } = useCurrency();
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = convert(
    parseFloat(amount) || 0,
    fromCurrency,
    toCurrency
  );

  const rate = getRate(fromCurrency, toCurrency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Convert between currencies with live rates
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        {/* Currency Selection */}
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground text-xs">
                        {currency.symbol}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="mt-6"
            onClick={handleSwap}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.code}</span>
                      <span className="text-muted-foreground text-xs">
                        {currency.symbol}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {parseFloat(amount).toLocaleString("en-IN")} {fromCurrency} =
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(convertedAmount, toCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </p>
          </div>
        </div>

        {/* Quick Conversions */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Quick Reference</Label>
          <div className="grid grid-cols-2 gap-2">
            {["USD", "EUR", "GBP", "AED"].map((currency) => {
              if (currency === fromCurrency) return null;
              const quickRate = getRate(fromCurrency, currency);
              return (
                <div
                  key={currency}
                  className="p-2 bg-muted/50 rounded text-sm flex justify-between"
                >
                  <span>
                    {CURRENCIES.find((c) => c.code === currency)?.flag} {currency}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      convert(parseFloat(amount) || 0, fromCurrency, currency),
                      currency
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">
            Rates updated: {lastUpdated.toLocaleString("en-IN")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
