// Money arrives from the API as a string (ADR-0003); never do arithmetic on it as a float.
// en-IN gives the lakh/crore grouping Nepal uses (1,00,000).
const number = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNPR = (amount) =>
  amount === null || amount === undefined || amount === '' ? '-' : `NPR ${number.format(amount)}`;

// Balances can be negative: "−NPR 350.00" reads better than "NPR -350.00".
export const formatNPRSigned = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '-';
  const text = String(amount);
  return text.startsWith('-') ? `−${formatNPR(text.slice(1))}` : formatNPR(text);
};
