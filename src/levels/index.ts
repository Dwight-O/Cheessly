import type { LevelConfig } from './types';

export * from './types';

/**
 * Phase 4 placeholder: a small ladder of boards so progression can be played
 * and tested end to end. Phase 5 replaces this with 30 hand-tuned levels plus
 * a seeded procedural generator.
 */
const TEMPLATES: readonly (readonly string[])[] = [
  ['.k..', '....', '....', 'K.Q.'],
  ['.k.p', '....', '....', 'K.Q.'],
  ['pk.p', '....', '....', 'K.QN'],
  ['.rk.p.', '.p....', '......', '......', '....P.', 'K.Q..N'],
];

export function getLevel(index: number, _seed: number): LevelConfig {
  const rows = TEMPLATES[Math.min(TEMPLATES.length - 1, Math.floor((index - 1) / 3))] as string[];
  const isBoss = index % 10 === 0;
  return {
    index,
    name: isBoss ? 'Boss' : 'Climb',
    rows,
    aiDepth: index <= 3 ? 0 : Math.min(4, 1 + Math.floor(index / 8)),
    mistakeChance: Math.max(0, 0.3 - index * 0.02),
    isBoss,
  };
}
