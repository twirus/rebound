const GROUP_SEPARATOR = ' ';

/** Integer part grouped by thousands: 12345 → "12 345". */
export function formatNumber(value: number): string {
  const digits = Math.floor(Math.abs(value)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
  return value < 0 ? `-${grouped}` : grouped;
}
