import { resources } from '../../content/resources';
import type { Price } from '../../game/purchases';
import { t } from '../../i18n';
import { formatValue } from '../format';

interface PriceListProps {
  prices: readonly Price[];
  affordable: boolean;
  withNames?: boolean;
}

export function PriceList({ prices, affordable, withNames = false }: PriceListProps) {
  return (
    <span class={`price ${affordable ? 'ok' : 'dim'}`}>
      {prices.map((price) => {
        const resource = resources.find((candidate) => candidate.id === price.resource);
        return (
          <span key={price.resource}>
            {formatValue(price.amount)}
            {withNames && resource ? ` ${t(resource.nameKey)}` : ''}
          </span>
        );
      })}
    </span>
  );
}
