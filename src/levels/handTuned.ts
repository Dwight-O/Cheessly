import {
  aiDepthFor,
  doubleMoveEveryFor,
  isBoss,
  mistakeChanceFor,
  moveLimitFor,
  moveTimerFor,
} from './difficulty';
import type { LevelConfig } from './types';

/**
 * Levels 1-30, hand-tuned. Everything here is data: a board diagram plus the
 * odd override where the hand-tuned pacing differs from the generated curve.
 *
 * Board diagrams: uppercase = player, lowercase = enemy, `.` empty,
 * `#` blocked. The enemy back rank is the first row.
 */
interface HandTunedLevel {
  name: string;
  rows: string[];
  note?: string;
  aiDepth?: number;
  mistakeChance?: number;
  moveLimit?: number;
  moveTimerSeconds?: number;
  enemyDoubleMoveEvery?: number;
}

const LEVELS: HandTunedLevel[] = [
  // ---- 4x4: learn the moves. Player has a queen; the enemy barely resists.
  {
    name: 'First Step',
    rows: ['.k..', '....', '....', 'K.Q.'],
    note: 'Tap a piece, then tap a highlighted square. Capture the enemy king.',
  },
  { name: 'Pawn Guard', rows: ['.k..', '..p.', '....', 'K.Q.'] },
  { name: 'Two Guards', rows: ['.k..', 'p.p.', '....', 'K.Q.'] },
  { name: 'The Knight', rows: ['.kn.', '....', '....', 'K.Q.'], note: 'Knights jump in an L.' },
  { name: 'Rook Line', rows: ['.k.r', '....', '....', 'K.Q.'] },
  { name: 'Safe Ground', rows: ['.k.r', '..p.', '....', 'K.Q.'], note: 'Checkpoint reached.' },
  { name: 'Bishop Pair', rows: ['bkb.', '....', '....', 'K.Q.'] },
  { name: 'Crowded Corner', rows: ['pkn.', '..p.', '....', 'K.Q.'] },

  // ---- 5x5: more room, more enemies, the AI starts searching.
  { name: 'Wider World', rows: ['...k.', '.p.p.', '.....', '.....', 'K.Q.N'] },
  {
    name: 'Rook Wall',
    rows: ['.k.rr', '.....', '.....', '.....', 'K.Q.N'],
    note: 'Boss: two rooks and a sharper opponent.',
  },
  { name: 'Trade Off', rows: ['..k..', '.p.p.', '..n..', '.....', 'K.R.N'] },
  {
    name: 'Gateway',
    rows: ['..k.r', '.....', '.##..', '.....', 'K.R.N'],
    note: 'Hatched squares are blocked. Nothing may enter or slide through.',
  },
  { name: 'Knight Duel', rows: ['.n.kn', '.....', '.....', '.....', 'K.Q.N'] },
  { name: 'Pawn Storm', rows: ['..k..', 'p.p.p', '.....', '.....', 'K.Q.N'] },
  { name: 'Queen Awakes', rows: ['.q.k.', '.....', '.....', '.....', 'K.R.N'] },
  { name: 'Narrow Path', rows: ['.rk..', '#.p.#', '#...#', '.....', 'K.R.N'] },

  // ---- 6x6: the player's army thins out and the clock appears.
  { name: 'Six by Six', rows: ['..k.r.', '..p..p', '......', '......', '......', 'K.R.N.'] },
  {
    name: 'Clock Starts',
    rows: ['..k...', '..p.p.', '...n..', '......', '......', 'K.R.N.'],
    note: 'Move limit: run out and the level is a draw, replayed free.',
  },
  { name: 'Bishop Cross', rows: ['.b.kb.', '......', '......', '......', '......', 'K.R.N.'] },
  {
    name: 'Double Trouble',
    rows: ['...kq.', '......', '......', '......', '......', 'K.R.N.'],
    note: 'Boss: the enemy moves twice on every third turn.',
  },
  { name: 'Thin Ranks', rows: ['..k.r.', '..p...', '......', '......', '.P..P.', 'K...N.'] },
  { name: 'Blocked Middle', rows: ['..k.r.', '......', '..##..', '..##..', '.P..P.', 'K...N.'] },
  { name: 'Two Rooks', rows: ['.r.kr.', '......', '......', '......', '.P..P.', 'K...N.'] },
  { name: 'Queen and Pawn', rows: ['..kq..', '..p...', '......', '......', '.P..P.', 'K...N.'] },
  {
    name: 'Under the Clock',
    rows: ['..k.r.', '..p..p', '......', '..##..', '.P..P.', 'K...N.'],
    note: 'Per-move timer: let it run out and a random legal move is played.',
  },
  { name: 'Bishop Vise', rows: ['.bkb..', '......', '......', '......', '.P..P.', 'K...N.'] },
  { name: 'Pawn March', rows: ['..k.r.', '..p..p', '......', '......', '.P.PP.', 'K...N.'] },
  { name: 'Crowd Control', rows: ['.nkqn.', '......', '..##..', '......', '.P.PP.', 'K...N.'] },

  // ---- 7x7: the last hand-tuned pair, then the generator takes over.
  {
    name: 'Seven Deep',
    rows: ['...k.r.', '..p..p.', '.......', '...#...', '.......', '.P.P.P.', 'K....N.'],
  },
  {
    name: 'The Gauntlet',
    rows: ['..qkr..', '..p.p..', '.......', '..###..', '.......', '.P.P.P.', 'K....N.'],
    note: 'Boss: queen, rook and a double move every third turn.',
  },
];

export const HAND_TUNED_COUNT = LEVELS.length;

/** Hand-tuned levels, with anything unspecified filled in from the curve. */
export const HAND_TUNED_LEVELS: readonly LevelConfig[] = LEVELS.map((entry, position) => {
  const index = position + 1;
  const moveLimit = entry.moveLimit ?? moveLimitFor(index);
  const moveTimerSeconds = entry.moveTimerSeconds ?? moveTimerFor(index);
  const enemyDoubleMoveEvery = entry.enemyDoubleMoveEvery ?? doubleMoveEveryFor(index);
  return {
    index,
    name: entry.name,
    rows: entry.rows,
    aiDepth: entry.aiDepth ?? aiDepthFor(index),
    mistakeChance: entry.mistakeChance ?? mistakeChanceFor(index),
    isBoss: isBoss(index),
    ...(entry.note !== undefined ? { note: entry.note } : {}),
    ...(moveLimit !== undefined ? { moveLimit } : {}),
    ...(moveTimerSeconds !== undefined ? { moveTimerSeconds } : {}),
    ...(enemyDoubleMoveEvery !== undefined ? { enemyDoubleMoveEvery } : {}),
  };
});
