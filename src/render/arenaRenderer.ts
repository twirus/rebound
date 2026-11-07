import type { Arena, Ball, World } from '../sim/world';
import { lookOf, type BallLook } from './ballLook';
import { BallTrails } from './ballTrails';
import { PushRings } from './pushRings';
import { drawShapeWalls } from './shapeWalls';
import { ShardBursts } from './shardBursts';

const WALL_WIDTH_PX = 1.5;

const WALL_ALPHA = 0.85;
/** Share of the shorter canvas side the arena occupies. */
const ARENA_FILL = 0.9;
const FULL_TURN = Math.PI * 2;
const MAIN_ARENA = 0;

interface ThemeColors {
  background: string;
  wall: string;
}

function readThemeColors(element: HTMLElement): ThemeColors {
  const style = getComputedStyle(element);
  return {
    background: style.getPropertyValue('--bg').trim(),
    wall: style.getPropertyValue('--text').trim(),
  };
}

/** Draws the simulation; never writes to it. */
export class ArenaRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly colors: ThemeColors;
  private readonly pushRings = new PushRings();
  private readonly shardBursts = new ShardBursts();
  private readonly trails = new BallTrails();
  private readonly look: BallLook = { color: '', alpha: 1 };
  /** Interpolated ball positions of the current frame, (x, y) pairs; grows as needed. */
  private positions = new Float64Array(64);
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private cssWidth = 0;
  private cssHeight = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not supported');
    this.context = context;
    this.colors = readThemeColors(canvas);
  }

  resize(cssWidth: number, cssHeight: number): void {
    const pixelRatio = window.devicePixelRatio || 1;
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.canvas.width = Math.round(cssWidth * pixelRatio);
    this.canvas.height = Math.round(cssHeight * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  /** Call after every simulation step: events live for one tick only. */
  collectEvents(world: World): void {
    const now = performance.now();
    this.pushRings.collect(world, MAIN_ARENA, now);
    this.shardBursts.collect(world, MAIN_ARENA, now);
  }

  /** Converts a point in CSS pixels (relative to the canvas) to arena coordinates. */
  screenToArena(world: World, cssX: number, cssY: number): { x: number; y: number } {
    const scale = this.scaleFor(world.arenas[MAIN_ARENA]);
    return { x: (cssX - this.cssWidth / 2) / scale, y: (cssY - this.cssHeight / 2) / scale };
  }

  draw(world: World, alpha: number): void {
    const context = this.context;
    context.fillStyle = this.colors.background;
    context.fillRect(0, 0, this.cssWidth, this.cssHeight);
    const arena = world.arenas[MAIN_ARENA];
    if (arena) this.drawArena(arena, alpha);
  }

  /** Positions between the last two ticks, so motion is smooth at any frame rate. */
  private interpolate(balls: readonly Ball[], alpha: number): void {
    if (this.positions.length < balls.length * 2)
      this.positions = new Float64Array(balls.length * 4);
    balls.forEach((ball, index) => {
      this.positions[index * 2] = ball.prevX + (ball.x - ball.prevX) * alpha;
      this.positions[index * 2 + 1] = ball.prevY + (ball.y - ball.prevY) * alpha;
    });
  }

  private scaleFor(arena: Arena | undefined): number {
    if (!arena) return 1;
    return (Math.min(this.cssWidth, this.cssHeight) * ARENA_FILL) / (arena.radius * 2);
  }

  private drawArena(arena: Arena, alpha: number): void {
    const context = this.context;
    const scale = this.scaleFor(arena);
    context.save();
    context.translate(this.cssWidth / 2, this.cssHeight / 2);
    context.scale(scale, scale);

    context.globalAlpha = WALL_ALPHA;
    context.strokeStyle = this.colors.wall;
    context.lineWidth = WALL_WIDTH_PX / scale;
    drawShapeWalls(context, arena);
    context.globalAlpha = 1;

    const now = performance.now();
    this.interpolate(arena.balls, alpha);
    if (!this.reducedMotion.matches) {
      this.trails.record(arena.balls, this.positions, now);
      this.trails.draw(context, arena.balls, now);
    }
    arena.balls.forEach((ball, index) => {
      lookOf(ball, this.look);
      context.fillStyle = this.look.color;
      context.globalAlpha = this.look.alpha;
      context.beginPath();
      context.arc(
        this.positions[index * 2] ?? 0,
        this.positions[index * 2 + 1] ?? 0,
        ball.radius,
        0,
        FULL_TURN,
      );
      context.fill();
    });
    context.globalAlpha = 1;
    this.shardBursts.draw(context, this.colors.wall, scale, now);
    this.pushRings.draw(context, this.colors.wall, scale, now);
    context.restore();
  }
}
