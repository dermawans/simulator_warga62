export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(absVal);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatShortRupiah(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  let res = '';
  if (abs >= 1000000000) {
    res = `Rp ${(abs / 1000000000).toFixed(1)} M`;
  } else if (abs >= 1000000) {
    res = `Rp ${(abs / 1000000).toFixed(1)} Jt`;
  } else if (abs >= 1000) {
    res = `Rp ${(abs / 1000).toFixed(0)} Rb`;
  } else {
    res = `Rp ${abs}`;
  }
  return isNegative ? `-${res}` : res;
}
