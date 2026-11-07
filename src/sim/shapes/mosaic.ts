import { detAtan2 } from '../../core/detMath';
import type { MosaicTileType } from '../../content/types';
import { TICK_SECONDS } from '../constants';
import type { Ball } from '../world';
import type { ShapeBehavior } from './behavior';
import { bounceInsideCircle, respawnNearCentre } from './walls';

export interface Tile {
  type: MosaicTileType;
  hitsLeft: number;
  /** Ticks until a broken tile may grow back; 0 while whole. */
  regrowLeft: number;
}

export interface MosaicState {
  kind: 'mosaic';
  tiles: Tile[];
  durability: number;
  regrowTicks: number;
  springSpeed: number;
}

/** Shards for a broken tile are multiplied by this for each type. */
const TILE_REWARD: Readonly<Record<MosaicTileType, number>> = { plain: 1, spring: 1, rich: 2 };
/** Balls that fell out through a hole come back near the centre. */
const RESPAWN_SHARE = 0.3;
const RESPAWN_SPEED = 160;
const FULL_TURN = Math.PI * 2;

/** Which tile covers the direction of the point (x, y). */
export function tileAt(state: MosaicState, x: number, y: number): number {
  const turn = (detAtan2(y, x) + Math.PI) / FULL_TURN;
  return Math.min(state.tiles.length - 1, Math.floor(turn * state.tiles.length));
}

/** A tile may grow back only when no ball sits in its hole. */
function holeIsClear(
  state: MosaicState,
  index: number,
  balls: readonly Ball[],
  radius: number,
): boolean {
  return balls.every((ball) => {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    return distance < radius - ball.radius * 3 || tileAt(state, ball.x, ball.y) !== index;
  });
}

/** Fires the ball back towards the centre at the spring speed. */
function spring(ball: Ball, speed: number): void {
  const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
  if (distance === 0) return;
  ball.vx = (-ball.x / distance) * speed;
  ball.vy = (-ball.y / distance) * speed;
}

/**
 * A round wall of tiles. Each hit wears a tile down; a broken tile pays Shards
 * (double for rich tiles, a hard kick back for spring tiles) and leaves a hole
 * the ball can fall out of. Tiles grow back after a while.
 */
export const mosaicBehavior: ShapeBehavior<MosaicState> = {
  create(def) {
    const params = def.mosaic;
    if (!params) throw new Error(`${def.id} has no mosaic parameters`);
    return {
      kind: 'mosaic',
      tiles: Array.from({ length: params.tiles }, (_, index) => ({
        type: params.pattern[index % params.pattern.length] ?? 'plain',
        hitsLeft: params.durability,
        regrowLeft: 0,
      })),
      durability: params.durability,
      regrowTicks: Math.round(params.regrowSeconds / TICK_SECONDS),
      springSpeed: params.springSpeed,
    };
  },

  step(state, { arena }) {
    state.tiles.forEach((tile, index) => {
      if (tile.hitsLeft > 0) return;
      tile.regrowLeft -= 1;
      if (tile.regrowLeft <= 0 && holeIsClear(state, index, arena.balls, arena.radius)) {
        tile.hitsLeft = state.durability;
      }
    });
  },

  collide(state, ball, { arena, arenaIndex, events, rng }) {
    const distance = Math.sqrt(ball.x * ball.x + ball.y * ball.y);
    if (distance > arena.radius + ball.radius * 2) {
      respawnNearCentre(ball, arena.radius * RESPAWN_SHARE, RESPAWN_SPEED, rng);
      return;
    }
    if (distance <= arena.radius - ball.radius) return;
    const index = tileAt(state, ball.x, ball.y);
    const tile = state.tiles[index];
    if (!tile || tile.hitsLeft <= 0) return;
    const speed = bounceInsideCircle(ball, arena.radius, arena.minBounceSpeed);
    if (speed === 0) return;
    const hitX = (ball.x / distance) * arena.radius;
    const hitY = (ball.y / distance) * arena.radius;
    events.push('wall-hit', arenaIndex, hitX, hitY, speed);
    tile.hitsLeft -= 1;
    if (tile.hitsLeft > 0) return;
    tile.regrowLeft = state.regrowTicks;
    events.push('tile-break', arenaIndex, hitX, hitY, TILE_REWARD[tile.type]);
    if (tile.type === 'spring') spring(ball, state.springSpeed);
  },

  spawnRadius: (_state, arenaRadius) => arenaRadius,

  hash(state, hasher) {
    for (const tile of state.tiles) {
      hasher.addNumber(tile.hitsLeft);
      hasher.addNumber(tile.regrowLeft);
    }
  },
};
