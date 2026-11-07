import { balls } from '../content/balls';
import { resources } from '../content/resources';
import { shapes } from '../content/shapes';
import { chooseBall, chooseShape } from '../game/session';
import { arenaSetup, nodeLevels } from '../game/store';
import { unlockedBalls, unlockedShapes } from '../game/unlocks';
import { t } from '../i18n';

interface OptionProps {
  name: string;
  note: string;
  selected: boolean;
  onPick: () => void;
}

function Option({ name, note, selected, onPick }: OptionProps) {
  return (
    <button
      type="button"
      class={`arena-option ${selected ? 'selected' : ''}`}
      aria-pressed={selected}
      onClick={onPick}
    >
      <span class="arena-option-name">{name}</span>
      <span class="arena-option-note">{note}</span>
    </button>
  );
}

function ShapeOptions() {
  const unlocked = unlockedShapes(nodeLevels.value);
  return (
    <>
      {shapes
        .filter((shape) => unlocked.includes(shape.id))
        .map((shape) => {
          const resource = resources.find((candidate) => candidate.id === shape.resource);
          return (
            <Option
              key={shape.id}
              name={t(shape.nameKey)}
              note={`${t(shape.descriptionKey)} ${t('arena.produces', { resource: resource ? t(resource.nameKey) : '' })}`}
              selected={arenaSetup.value.shape === shape.id}
              onPick={() => chooseShape(shape.id)}
            />
          );
        })}
    </>
  );
}

function BallOptions() {
  const unlocked = unlockedBalls(nodeLevels.value);
  return (
    <>
      {balls
        .filter((ball) => unlocked.includes(ball.id))
        .map((ball) => (
          <Option
            key={ball.id}
            name={t(ball.nameKey)}
            note={t(ball.descriptionKey)}
            selected={arenaSetup.value.ball === ball.id}
            onPick={() => chooseBall(ball.id)}
          />
        ))}
    </>
  );
}

/** Builds the selected arena: shape and ball now; laws and schemes come with gems. */
export function ArenaPanel() {
  const shape = shapes.find((candidate) => candidate.id === arenaSetup.value.shape);
  const ball = balls.find((candidate) => candidate.id === arenaSetup.value.ball);
  return (
    <aside class="arena-panel">
      <div class="arena-panel-head">
        <span class="caption accent">{t('arena.title')} 1</span>
        <span class="dim">
          {shape ? t(shape.nameKey) : ''} · {ball ? t(ball.nameKey) : ''}
        </span>
      </div>
      <span class="caption dim">{t('arena.shape')}</span>
      <ShapeOptions />
      <span class="caption dim">{t('arena.ball')}</span>
      <BallOptions />
      <p class="mute arena-panel-hint">{t('arena.lockedHint')}</p>
    </aside>
  );
}
