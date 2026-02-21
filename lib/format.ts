export const formatCryptoValue = (num: number, showUSDSymbol = false) => {
  if (isNaN(num) || num === 0) return showUSDSymbol ? "$0.00" : "0.00";

  const formatted = new Intl.NumberFormat(
    undefined,
    num >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { maximumSignificantDigits: 4 },
  ).format(num);

  return showUSDSymbol ? `$${formatted}` : formatted;
};
