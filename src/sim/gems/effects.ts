import type { GemId } from '../../content/types';
import { attract, blast, charge, freeze, gravityTurn, repeat, repel } from './areaEffects';
import {
  grow,
  heat,
  merge,
  petrify,
  recolor,
  reverse,
  shrink,
  split,
  swap,
  teleport,
} from './ballEffects';
import type { EffectHandler } from './target';

export type { EffectTarget } from './target';

/** Every effect gem's behaviour, by gem id (see content/gems/effects.ts). */
export const EFFECTS: Readonly<Partial<Record<GemId, EffectHandler>>> = {
  'gem:split': split,
  'gem:blast': blast,
  'gem:merge': merge,
  'gem:teleport': teleport,
  'gem:swap': swap,
  'gem:freeze': freeze,
  'gem:attract': attract,
  'gem:repel': repel,
  'gem:heat': heat,
  'gem:recolor': recolor,
  'gem:reverse': reverse,
  'gem:grow': grow,
  'gem:shrink': shrink,
  'gem:petrify': petrify,
  'gem:charge': charge,
  'gem:gravity-turn': gravityTurn,
  'gem:repeat': repeat,
};
