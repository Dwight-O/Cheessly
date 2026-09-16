/**
 * Sound and haptics.
 *
 * Sounds are synthesised with WebAudio rather than shipped as files: the whole
 * game stays a handful of kilobytes and there is nothing extra to cache
 * offline. Both channels are opt-out and both fail silently — a browser with
 * no AudioContext or no vibration support must not break the game.
 */

export type Cue = 'select' | 'move' | 'capture' | 'win' | 'loss' | 'invalid';

let context: AudioContext | null = null;
let soundEnabled = true;
let hapticsEnabled = true;

export function configureFeedback(settings: { sound: boolean; haptics: boolean }): void {
  soundEnabled = settings.sound;
  hapticsEnabled = settings.haptics;
}

/** Audio contexts may only start from a user gesture, so this is called from
 *  the first tap rather than at load. */
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (context) return context;
  try {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

interface Note {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  type?: OscillatorType;
  gain?: number;
}

const CUES: Record<Cue, { notes: Note[]; vibration: number | number[] }> = {
  select: {
    notes: [{ frequency: 660, durationMs: 40, type: 'triangle', gain: 0.03 }],
    vibration: 8,
  },
  move: { notes: [{ frequency: 440, durationMs: 60, type: 'triangle' }], vibration: 12 },
  capture: {
    notes: [
      { frequency: 200, durationMs: 90, type: 'sawtooth', gain: 0.05 },
      { frequency: 120, durationMs: 120, delayMs: 60, type: 'sawtooth', gain: 0.04 },
    ],
    vibration: [18, 24, 18],
  },
  win: {
    notes: [
      { frequency: 523, durationMs: 90 },
      { frequency: 659, durationMs: 90, delayMs: 90 },
      { frequency: 784, durationMs: 160, delayMs: 180 },
    ],
    vibration: [24, 40, 24],
  },
  loss: {
    notes: [
      { frequency: 392, durationMs: 120 },
      { frequency: 294, durationMs: 200, delayMs: 120 },
    ],
    vibration: 70,
  },
  invalid: {
    notes: [{ frequency: 160, durationMs: 60, type: 'square', gain: 0.02 }],
    vibration: 5,
  },
};

function playNote(ctx: AudioContext, note: Note): void {
  const start = ctx.currentTime + (note.delayMs ?? 0) / 1000;
  const end = start + note.durationMs / 1000;
  const oscillator = ctx.createOscillator();
  const amp = ctx.createGain();
  oscillator.type = note.type ?? 'sine';
  oscillator.frequency.setValueAtTime(note.frequency, start);
  amp.gain.setValueAtTime(note.gain ?? 0.05, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(amp).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

/** Plays a cue on both channels, honouring the mute toggles. */
export function cue(name: Cue): void {
  const spec = CUES[name];
  if (soundEnabled) {
    const ctx = audio();
    if (ctx) {
      try {
        if (ctx.state === 'suspended') void ctx.resume();
        for (const note of spec.notes) playNote(ctx, note);
      } catch {
        // An audio failure is never worth interrupting play for.
      }
    }
  }
  if (
    hapticsEnabled &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(spec.vibration);
    } catch {
      // Same: silence is the correct failure mode.
    }
  }
}
