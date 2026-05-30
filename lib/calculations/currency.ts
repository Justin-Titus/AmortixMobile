export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  useIndianGrouping: boolean;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", useIndianGrouping: true },
  USD: { code: "USD", symbol: "$", locale: "en-US", useIndianGrouping: false },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE", useIndianGrouping: false },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", useIndianGrouping: false },
  AED: { code: "AED", symbol: "د.إ", locale: "ar-AE", useIndianGrouping: false },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG", useIndianGrouping: false },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA", useIndianGrouping: false },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU", useIndianGrouping: false },
};

export const DEFAULT_CURRENCY = "INR";

export function getCurrencyConfig(code?: string | null): CurrencyConfig {
  if (!code) return CURRENCIES[DEFAULT_CURRENCY];
  const upper = code.toUpperCase();
  return CURRENCIES[upper] ?? CURRENCIES[DEFAULT_CURRENCY];
}

type CurrencyFormatOptions = {
  compact?: boolean;
};

/** Format a number as currency for the given currency code */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options: CurrencyFormatOptions = {}
): string {
  const config = getCurrencyConfig(currencyCode);
  const compact = options.compact ?? false;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (compact) {
    if (config.useIndianGrouping) {
      if (abs >= 10000000) return `${sign}${config.symbol}${(abs / 10000000).toFixed(1)}Cr`;
      if (abs >= 100000) return `${sign}${config.symbol}${Math.round(abs / 100000)}L`;
      if (abs >= 1000) return `${sign}${config.symbol}${Math.round(abs / 1000)}K`;
    } else {
      if (abs >= 1000000000) return `${sign}${config.symbol}${(abs / 1000000000).toFixed(1)}B`;
      if (abs >= 1000000) return `${sign}${config.symbol}${(abs / 1000000).toFixed(1)}M`;
      if (abs >= 1000) return `${sign}${config.symbol}${Math.round(abs / 1000)}K`;
    }
    return `${sign}${config.symbol}${abs.toLocaleString(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Handle standard formatting
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl fails
    return `${sign}${config.symbol}${abs.toLocaleString(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}

/** Backward-compatible alias for compact formatting */
export function formatINR(amount: number, compact = false): string {
  return formatCurrency(amount, "INR", { compact });
}

/** Format a number with commas (locale-aware) */
export function formatNumber(num: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat(config.locale).format(Math.round(num));
}
