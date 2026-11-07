import { balls } from '../../content/balls';
import { shapes } from '../../content/shapes';
import { nodeLevels } from '../../game/store';
import { unlockedBalls, unlockedShapes } from '../../game/unlocks';
import { WORKSHOP_LIMITS, type WorkshopSettings } from '../../game/workshop';
import { t } from '../../i18n';
import { formatValue } from '../format';

interface ControlsProps {
  settings: WorkshopSettings;
  onChange: (next: WorkshopSettings) => void;
}

type SliderKey = keyof typeof WORKSHOP_LIMITS;

const SLIDER_DECIMALS: Readonly<Record<SliderKey, number>> = {
  ballCount: 0,
  gravity: 2,
  size: 2,
  bounce: 0,
};

function Slider({ name, settings, onChange }: ControlsProps & { name: SliderKey }) {
  const [min, max, step] = WORKSHOP_LIMITS[name];
  return (
    <label class="workshop-slider">
      <span class="workshop-slider-head">
        <span class="dim">{t(`workshop.${name}`)}</span>
        <span>{formatValue(settings[name], SLIDER_DECIMALS[name])}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={settings[name]}
        onInput={(event) => onChange({ ...settings, [name]: Number(event.currentTarget.value) })}
      />
    </label>
  );
}

function Chips<Id extends string>({
  options,
  selected,
  onPick,
}: {
  options: readonly { id: Id; nameKey: string }[];
  selected: Id;
  onPick: (id: Id) => void;
}) {
  return (
    <div class="workshop-chips">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          class={`workshop-chip ${option.id === selected ? 'selected' : ''}`}
          aria-pressed={option.id === selected}
          onClick={() => onPick(option.id)}
        >
          {t(option.nameKey)}
        </button>
      ))}
    </div>
  );
}

export function WorkshopControls({ settings, onChange }: ControlsProps) {
  const openShapes = unlockedShapes(nodeLevels.value);
  const openBalls = unlockedBalls(nodeLevels.value);
  return (
    <aside class="arena-panel">
      <span class="caption dim">{t('arena.shape')}</span>
      <Chips
        options={shapes.filter((shape) => openShapes.includes(shape.id))}
        selected={settings.shape}
        onPick={(shape) => onChange({ ...settings, shape })}
      />
      <span class="caption dim">{t('arena.ball')}</span>
      <Chips
        options={balls.filter((ball) => openBalls.includes(ball.id))}
        selected={settings.ball}
        onPick={(ball) => onChange({ ...settings, ball })}
      />
      <Slider name="ballCount" settings={settings} onChange={onChange} />
      <Slider name="gravity" settings={settings} onChange={onChange} />
      <Slider name="size" settings={settings} onChange={onChange} />
      <Slider name="bounce" settings={settings} onChange={onChange} />
    </aside>
  );
}
