import { applyMove, generateMoves, PIECE_VALUE } from '../engine';
import type { Color, GameState, Move } from '../engine';
import { evaluate, MATE_SCORE } from './evaluate';
import { randomMove } from './random';
import { createRng } from '../util/prng';
import type { Rng } from '../util/prng';

export interface SearchOptions {
  /** 0 selects the random capture-preferring AI; 1-4 is a minimax depth. */
  readonly depth: number;
  /** Probability of throwing the move away and playing at random. */
  readonly mistakeChance: number;
  /** Hard wall-clock cap. The search returns the best move from the last
   *  fully completed depth once this is hit. */
  readonly timeBudgetMs: number;
  /** Seed so a given position always produces the same move. */
  readonly seed: number | string;
}

export interface SearchResult {
  readonly move: Move | null;
  readonly score: number;
  readonly depthReached: number;
  readonly nodes: number;
  readonly elapsedMs: number;
  readonly mistake: boolean;
}

const DEFAULTS = { depth: 2, mistakeChance: 0, timeBudgetMs: 500 };

interface Context {
  me: Color;
  deadline: number;
  nodes: number;
  aborted: boolean;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Captures first, most valuable victim first, then by the cheapest attacker.
 *  Good ordering is what makes alpha-beta worth having. */
function orderMoves(moves: readonly Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const av = a.captured ? PIECE_VALUE[a.captured] * 10 - PIECE_VALUE[a.piece] : -1;
    const bv = b.captured ? PIECE_VALUE[b.captured] * 10 - PIECE_VALUE[b.piece] : -1;
    return bv - av;
  });
}

function terminalScore(state: GameState, me: Color, ply: number): number | null {
  switch (state.status) {
    case 'player-win':
      return me === 'w' ? MATE_SCORE - ply : -MATE_SCORE + ply;
    case 'player-loss':
      return me === 'w' ? -MATE_SCORE + ply : MATE_SCORE - ply;
    case 'draw':
      return 0;
    default:
      return null;
  }
}

/**
 * Alpha-beta over the real engine. Written as explicit max/min rather than
 * negamax because a level modifier can give the enemy two moves in a row, so
 * the side to move does not simply alternate.
 */
function search(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  ctx: Context,
): number {
  const terminal = terminalScore(state, ctx.me, ply);
  if (terminal !== null) return terminal;
  if (depth === 0) return evaluate(state.board, ctx.me);

  ctx.nodes += 1;
  if ((ctx.nodes & 0x3ff) === 0 && now() > ctx.deadline) {
    ctx.aborted = true;
    return evaluate(state.board, ctx.me);
  }

  const maximizing = state.turn === ctx.me;
  const moves = orderMoves(generateMoves(state.board, state.turn));
  if (moves.length === 0) return evaluate(state.board, ctx.me);

  let best = maximizing ? -Infinity : Infinity;
  let a = alpha;
  let b = beta;

  for (const move of moves) {
    const score = search(applyMove(state, move), depth - 1, a, b, ply + 1, ctx);
    if (ctx.aborted) return best === -Infinity || best === Infinity ? score : best;
    if (maximizing) {
      if (score > best) best = score;
      if (best > a) a = best;
    } else {
      if (score < best) best = score;
      if (best < b) b = best;
    }
    if (b <= a) break;
  }
  return best;
}

/**
 * Picks a move for the side to move.
 *
 * Iterative deepening keeps the time cap honest: whatever depth finished last
 * is the answer, so a slow device degrades to a weaker move instead of
 * freezing.
 */
export function chooseMove(state: GameState, options: Partial<SearchOptions> = {}): SearchResult {
  const { depth, mistakeChance, timeBudgetMs } = { ...DEFAULTS, ...options };
  const seed = options.seed ?? 0;
  const rng: Rng = createRng(seed);
  const startedAt = now();

  const legal = generateMoves(state.board, state.turn);
  if (state.status !== 'playing' || legal.length === 0) {
    return { move: null, score: 0, depthReached: 0, nodes: 0, elapsedMs: 0, mistake: false };
  }

  if (mistakeChance > 0 && rng.chance(mistakeChance)) {
    return {
      move: rng.pick(legal),
      score: 0,
      depthReached: 0,
      nodes: 0,
      elapsedMs: now() - startedAt,
      mistake: true,
    };
  }

  if (depth <= 0) {
    return {
      move: randomMove(state.board, state.turn, rng),
      score: 0,
      depthReached: 0,
      nodes: 0,
      elapsedMs: now() - startedAt,
      mistake: false,
    };
  }

  const ctx: Context = {
    me: state.turn,
    deadline: startedAt + timeBudgetMs,
    nodes: 0,
    aborted: false,
  };

  const rootMoves = orderMoves(legal);
  let bestMove: Move = rootMoves[0] as Move;
  let bestScore = -Infinity;
  let depthReached = 0;

  for (let d = 1; d <= depth; d++) {
    let iterationBest: Move | null = null;
    let iterationScore = -Infinity;
    let alpha = -Infinity;

    for (const move of rootMoves) {
      const score = search(applyMove(state, move), d - 1, alpha, Infinity, 1, ctx);
      if (ctx.aborted) break;
      if (iterationBest === null || score > iterationScore) {
        iterationBest = move;
        iterationScore = score;
      }
      if (score > alpha) alpha = score;
    }

    if (ctx.aborted) break;
    if (iterationBest) {
      bestMove = iterationBest;
      bestScore = iterationScore;
      depthReached = d;
    }
    // A forced win is found; deeper search cannot improve on it.
    if (bestScore >= MATE_SCORE - 100) break;
    if (now() > ctx.deadline) break;
  }

  return {
    move: bestMove,
    score: bestScore,
    depthReached,
    nodes: ctx.nodes,
    elapsedMs: now() - startedAt,
    mistake: false,
  };
}
