import { gems } from '../../content/gems';
import type { GemId, GemParams } from '../../content/types';
import { TICK_SECONDS } from '../constants';
import type { Scheme } from './scheme';

type SupportRule = (scheme: Scheme, params: GemParams) => void;

function ticks(seconds: number | undefined): number {
  return Math.round((seconds ?? 0) / TICK_SECONDS);
}

/** Conditions narrow when the scheme fires and pay for it with power. */
const narrow: SupportRule = (scheme, params) => {
  scheme.power *= params.multiplier ?? 1;
};

/** What each support or condition gem does to a scheme, by gem id. */
const RULES: Readonly<Partial<Record<GemId, SupportRule>>> = {
  'gem:echo': (scheme, params) => {
    scheme.echoTicks = ticks(params.seconds);
    scheme.echoPower = params.multiplier ?? 0;
  },
  'gem:chain': (scheme, params) => {
    scheme.chainJumps = params.count ?? 0;
    scheme.chainTicks = ticks(params.seconds);
    scheme.chainRadius = params.radius ?? 0;
  },
  'gem:delay': (scheme, params) => {
    scheme.power *= params.multiplier ?? 1;
    scheme.delayTicks = ticks(params.seconds);
  },
  'gem:area': (scheme, params) => {
    scheme.areaRadius = params.radius ?? 0;
    scheme.areaPower = params.multiplier ?? 1;
  },
  'gem:fragile': (scheme, params) => {
    scheme.power *= params.multiplier ?? 1;
    scheme.fragileLimit = params.count ?? 0;
  },
  'gem:greed': (scheme, params) => {
    scheme.rewardScale *= params.multiplier ?? 1;
  },
  'gem:focus': (scheme, params) => {
    scheme.power *= params.multiplier ?? 1;
    scheme.focus = true;
  },
  'gem:chance': (scheme) => {
    scheme.chance = true;
  },
  'gem:overheat': (scheme, params) => {
    scheme.overheatStep = params.multiplier ?? 0;
    scheme.overheatPauseTicks = ticks(params.seconds);
  },
  'gem:quick': (scheme, params) => {
    scheme.cooldownTicks *= params.multiplier ?? 1;
    scheme.power *= params.penalty ?? 1;
  },
  'gem:sturdy': (scheme, params) => {
    scheme.maxDepth = params.count ?? scheme.maxDepth;
    scheme.cooldownTicks *= params.multiplier ?? 1;
  },
  'gem:only-color': narrow,
  'gem:only-half': narrow,
  'gem:only-big': narrow,
  'gem:only-small': narrow,
  'gem:only-hot': narrow,
  'gem:rare': (scheme, params) => {
    narrow(scheme, params);
    scheme.cooldownTicks = Math.max(scheme.cooldownTicks, ticks(params.seconds));
  },
  'gem:every-nth': (scheme, params) => {
    narrow(scheme, params);
    scheme.every = params.count ?? 1;
  },
};

function paramsOf(id: GemId): GemParams {
  return gems.find((gem) => gem.id === id)?.params ?? {};
}

/** Softens every multiplier and penalty towards 1 by `share`, for the mirror's weaker copy. */
function weakened(params: GemParams, share: number): GemParams {
  const result: GemParams = { ...params };
  if (params.multiplier !== undefined) result.multiplier = 1 + (params.multiplier - 1) * share;
  if (params.penalty !== undefined) result.penalty = 1 + (params.penalty - 1) * share;
  return result;
}

/**
 * Applies one support of the scheme. A mirror copies the support next to it
 * (the one before, else the one after) at reduced strength.
 */
export function applySupport(
  scheme: Scheme,
  id: GemId,
  all: readonly GemId[],
  index: number,
): void {
  if (id === 'gem:mirror') {
    const neighbour = [all[index - 1], all[index + 1]].find(
      (candidate) => candidate !== undefined && candidate !== 'gem:mirror',
    );
    if (!neighbour) return;
    const share = paramsOf(id).multiplier ?? 1;
    RULES[neighbour]?.(scheme, weakened(paramsOf(neighbour), share));
    return;
  }
  if (gems.find((gem) => gem.id === id)?.kind === 'condition') scheme.conditions.push(id);
  RULES[id]?.(scheme, paramsOf(id));
}
