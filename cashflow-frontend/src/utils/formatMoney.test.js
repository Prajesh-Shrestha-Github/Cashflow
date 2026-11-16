import { describe, expect, it } from 'vitest';
import { formatNPR, formatNPRSigned } from './formatMoney';

// Money arrives from the API as a string (ADR-0003). Nepal groups digits as 1,00,000 (lakh).
describe('formatNPR', () => {
  it('formats a string amount with NPR and lakh grouping', () => {
    expect(formatNPR('1161695.38')).toBe('NPR 11,61,695.38');
  });

  it('always shows two decimals', () => {
    expect(formatNPR('600000')).toBe('NPR 6,00,000.00');
    expect(formatNPR('0.5')).toBe('NPR 0.50');
  });

  it('handles very large amounts without scientific notation', () => {
    expect(formatNPR('1000000000000.00')).toBe('NPR 10,00,00,00,00,000.00');
  });

  it('shows a dash for a missing value instead of NaN', () => {
    expect(formatNPR(null)).toBe('-');
    expect(formatNPR(undefined)).toBe('-');
  });
});

describe('formatNPRSigned (for balances, which can be negative)', () => {
  it('keeps positive amounts as they are', () => {
    expect(formatNPRSigned('50000.00')).toBe('NPR 50,000.00');
    expect(formatNPRSigned('0.00')).toBe('NPR 0.00');
  });

  it('puts the minus sign in front of the currency, with a real minus sign', () => {
    expect(formatNPRSigned('-350.00')).toBe('−NPR 350.00');
    expect(formatNPRSigned('-1234567.5')).toBe('−NPR 12,34,567.50');
  });

  it('shows a dash for a missing value', () => {
    expect(formatNPRSigned(null)).toBe('-');
  });
});

