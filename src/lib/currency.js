/**
 * Currency and Indian Number Formatting Utilities
 */

export const CURRENCY_OPTIONS = [
  { code: '₹', label: 'INR (₹) — Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: '$', label: 'USD ($) — US Dollar', symbol: '$', locale: 'en-US' },
  { code: '€', label: 'EUR (€) — Euro', symbol: '€', locale: 'de-DE' },
  { code: '£', label: 'GBP (£) — British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'C$', label: 'CAD (C$) — Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  { code: 'A$', label: 'AUD (A$) — Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  { code: 'AED', label: 'AED (د.إ) — UAE Dirham', symbol: 'AED ', locale: 'en-AE' },
];

/**
 * Format amount with proper currency symbol and locale numbering (e.g. Indian Lakhs/Crores)
 */
export function formatCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  if (currency === '₹' || currency === 'INR') {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  if (currency === 'AED') {
    return `AED ${num.toLocaleString('en-AE')}`;
  }
  return `${currency}${num.toLocaleString('en-US')}`;
}

/**
 * Human-friendly compact badge (e.g. ₹5 Lakh, ₹18.5 Lakh, ₹1.2 Cr, $50k)
 */
export function formatCompactCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  if (currency === '₹' || currency === 'INR') {
    if (num >= 10000000) {
      const cr = (num / 10000000).toFixed(2).replace(/\.?0+$/, '');
      return `₹${cr} Cr`;
    }
    if (num >= 100000) {
      const lk = (num / 100000).toFixed(1).replace(/\.?0+$/, '');
      return `₹${lk} Lakh`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num}`;
  }

  // Western compact formatting for USD/EUR/GBP
  if (num >= 1000000) {
    return `${currency}${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${currency}${(num / 1000).toFixed(0)}k`;
  }
  return `${currency}${num}`;
}

/**
 * Constants for the 1L to 80L price range
 */
export const MIN_LAKHS = 1;
export const MAX_LAKHS = 80;
export const MIN_INR_BUDGET = 100000; // 1 Lakh (₹1,00,000)
export const MAX_INR_BUDGET = 8000000; // 80 Lakhs (₹80,00,000)

/**
 * Convert Lakhs to raw numeric amount (e.g., 15.5 Lakhs -> 1550000)
 */
export function lakhsToAmount(lakhs) {
  const num = Number(lakhs) || 0;
  return Math.round(num * 100000);
}

/**
 * Convert raw numeric amount to Lakhs (e.g., 1550000 -> 15.5)
 */
export function amountToLakhs(amount) {
  const num = Number(amount) || 0;
  return Number((num / 100000).toFixed(2));
}

/**
 * Format Indian Lakhs representation (e.g. "15.5 Lakhs (₹15,50,000)")
 */
export function formatLakhsDescription(amount) {
  const num = Number(amount) || 0;
  const lk = (num / 100000).toFixed(2).replace(/\.?0+$/, '');
  return `${lk} Lakh${Number(lk) === 1 ? '' : 's'} (${formatCurrency(num, '₹')})`;
}
