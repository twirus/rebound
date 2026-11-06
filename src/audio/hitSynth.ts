import type { SimEvent } from '../sim/events';
import type { World } from '../sim/world';

/** A minor pentatonic over two octaves, in semitones from the root. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
const ROOT_HZ = 220;
const COLLISION_OCTAVE_SHIFT = 12;
const MAX_VOICES = 24;
/** New notes allowed per animation frame; the rest merge into what is already sounding. */
const MAX_NEW_VOICES_PER_FRAME = 4;
const ATTACK_SECONDS = 0.004;
const DECAY_SECONDS = 0.45;
const SILENCE = 0.0001;
const LOWPASS_HZ = 1800;
const MASTER_GAIN = 0.7;
const HIT_GAIN = 0.16;
const COLLISION_GAIN = 0.06;
/** Impact speed that gives full volume, world units per second. */
const LOUD_IMPACT = 900;
const MIN_LEVEL = 0.05;
const MAIN_ARENA = 0;

function semitonesToHz(semitones: number): number {
  return ROOT_HZ * 2 ** (semitones / 12);
}

/** Maps a value in [0, 1) onto a note of the scale. */
function noteAt(position: number): number {
  const index = Math.min(SCALE.length - 1, Math.max(0, Math.floor(position * SCALE.length)));
  return SCALE[index] ?? 0;
}

/** Short plucked notes for hits; reads sim events, never changes them. */
export class HitSynth {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeVoices = 0;
  private newVoicesThisFrame = 0;
  private enabled = true;

  /** Browsers allow audio only after a user gesture; call from one. */
  unlock(): void {
    if (!this.context) this.createGraph();
    if (this.context?.state === 'suspended' && this.enabled) void this.context.resume();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!this.context) return;
    void (enabled ? this.context.resume() : this.context.suspend());
  }

  suspend(): void {
    void this.context?.suspend();
  }

  resume(): void {
    if (this.enabled) void this.context?.resume();
  }

  startFrame(): void {
    this.newVoicesThisFrame = 0;
  }

  /** Call after every simulation step: events live for one tick only. */
  collect(world: World): void {
    if (!this.context || this.context.state !== 'running') return;
    const arena = world.arenas[MAIN_ARENA];
    if (!arena) return;
    for (let index = 0; index < world.events.count; index++) {
      const event = world.events.at(index);
      if (event.arenaIndex === MAIN_ARENA) this.playEvent(event, arena.radius);
    }
  }

  private playEvent(event: SimEvent, arenaRadius: number): void {
    const level = Math.min(1, Math.max(MIN_LEVEL, event.strength / LOUD_IMPACT));
    if (event.kind === 'wall-hit') {
      const angle = (Math.atan2(event.y, event.x) + Math.PI) / (Math.PI * 2);
      this.playNote(semitonesToHz(noteAt(angle)), HIT_GAIN * level);
    } else if (event.kind === 'ball-collision') {
      const across = (event.x / arenaRadius + 1) / 2;
      this.playNote(semitonesToHz(noteAt(across) + COLLISION_OCTAVE_SHIFT), COLLISION_GAIN * level);
    }
  }

  private createGraph(): void {
    this.context = new AudioContext();
    const compressor = this.context.createDynamicsCompressor();
    this.master = this.context.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(compressor);
    compressor.connect(this.context.destination);
  }

  private playNote(frequency: number, peak: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    if (this.activeVoices >= MAX_VOICES || this.newVoicesThisFrame >= MAX_NEW_VOICES_PER_FRAME)
      return;
    const now = context.currentTime;
    const oscillator = new OscillatorNode(context, { type: 'triangle', frequency });
    const filter = new BiquadFilterNode(context, { type: 'lowpass', frequency: LOWPASS_HZ });
    const envelope = new GainNode(context, { gain: SILENCE });
    envelope.gain.exponentialRampToValueAtTime(peak, now + ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, now + ATTACK_SECONDS + DECAY_SECONDS);
    oscillator.connect(filter).connect(envelope).connect(master);
    oscillator.start(now);
    oscillator.stop(now + ATTACK_SECONDS + DECAY_SECONDS);
    this.activeVoices += 1;
    this.newVoicesThisFrame += 1;
    oscillator.onended = () => {
      this.activeVoices -= 1;
      envelope.disconnect();
    };
  }
}
