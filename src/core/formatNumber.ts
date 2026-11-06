const GROUP_SEPARATOR = ' ';

/**
 * Groups thousands with a non-breaking space: 12345 → "12 345". Up to
 * `decimals` fraction digits are kept, trailing zeros dropped: 18.40 → "18,4".
 */
export function formatNumber(value: number, decimals = 0, decimalSeparator = ','): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(Math.abs(value) * factor) / factor;
  const whole = Math.floor(rounded);
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
  const fraction = Math.round((rounded - whole) * factor)
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  const text = fraction ? `${grouped}${decimalSeparator}${fraction}` : grouped;
  return value < 0 && rounded > 0 ? `-${text}` : text;
}
