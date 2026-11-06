/** Fixed simulation step. Never derived from wall-clock time. */
export const TICK_SECONDS = 1 / 120;

/** Downward acceleration in world units per second squared. */
export const BASE_GRAVITY = 600;

/** Hard speed cap, world units per second; keeps motion readable and limits substeps. */
export const MAX_BALL_SPEED = 1400;

/** A ball may move at most this share of its radius per substep (anti-tunnelling). */
export const MAX_TRAVEL_PER_SUBSTEP = 0.5;

export const MAX_SUBSTEPS = 4;
