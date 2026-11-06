import type { Arena, World } from '../sim/world';
import { findBall } from '../sim/world';
import { PushRings } from './pushRings';

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
    this.pushRings.collect(world, MAIN_ARENA, performance.now());
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
    context.beginPath();
    context.arc(0, 0, arena.radius, 0, FULL_TURN);
    context.stroke();
    context.globalAlpha = 1;

    for (const ball of arena.balls) {
      const x = ball.prevX + (ball.x - ball.prevX) * alpha;
      const y = ball.prevY + (ball.y - ball.prevY) * alpha;
      context.fillStyle = findBall(ball.typeId).color;
      context.beginPath();
      context.arc(x, y, ball.radius, 0, FULL_TURN);
      context.fill();
    }
    this.pushRings.draw(context, this.colors.wall, scale, performance.now());
    context.restore();
  }
}
