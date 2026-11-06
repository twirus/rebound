import { formatNumber } from '../core/formatNumber';
import { t } from '../i18n';

/** Number in the current language's style. */
export function formatValue(value: number, decimals = 0): string {
  return formatNumber(value, decimals, t('number.decimalSeparator'));
}
