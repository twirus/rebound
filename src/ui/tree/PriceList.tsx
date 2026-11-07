import { resources } from '../../content/resources';
import { hasEnough, type Price } from '../../game/purchases';
import { resourceAmounts } from '../../game/store';
import { t } from '../../i18n';
import { formatValue } from '../format';

interface PriceListProps {
  prices: readonly Price[];
  affordable: boolean;
  /** Details panel: each resource by name, in its own colour while there is enough of it. */
  withNames?: boolean;
}

export function PriceList({ prices, affordable, withNames = false }: PriceListProps) {
  return (
    <span class={`price ${affordable ? 'ok' : 'dim'}`}>
      {prices.map((price) => {
        const resource = resources.find((candidate) => candidate.id === price.resource);
        const enough = hasEnough(resourceAmounts.value, price);
        return (
          <span
            key={price.resource}
            style={withNames && enough && resource ? { color: resource.color } : undefined}
          >
            {formatValue(price.amount)}
            {withNames && resource ? ` ${t(resource.nameKey)}` : ''}
          </span>
        );
      })}
    </span>
  );
}
