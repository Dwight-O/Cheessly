import { create } from 'zustand';
import { applyMove, movesForPiece, pieceAt } from '../engine';
import type { GameState, Move, Square } from '../engine';
import { levelToGame } from '../levels/types';
import type { LevelConfig } from '../levels/types';
import { requestEnemyMove } from '../ai/client';

interface GameStore {
  level: LevelConfig | null;
  game: GameState | null;
  /** The square the player has tapped, if any. */
  selected: Square | null;
  /** Legal moves from `selected`, used to highlight targets. */
  targets: readonly Move[];
  enemyThinking: boolean;
  seed: number;

  startLevel(level: LevelConfig, seed: number): void;
  tapSquare(square: Square): void;
  clearSelection(): void;
  /** Plays one enemy move. The UI calls this whenever it is the enemy's turn. */
  playEnemyTurn(): Promise<void>;
  /** Plays a move for the player; used by the move timer and by tapSquare. */
  playPlayerMove(move: Move): void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  level: null,
  game: null,
  selected: null,
  targets: [],
  enemyThinking: false,
  seed: 0,

  startLevel(level, seed) {
    set({
      level,
      game: levelToGame(level),
      selected: null,
      targets: [],
      enemyThinking: false,
      seed,
    });
  },

  clearSelection() {
    set({ selected: null, targets: [] });
  },

  playPlayerMove(move) {
    const { game } = get();
    if (!game || game.status !== 'playing' || game.turn !== 'w') return;
    set({ game: applyMove(game, move), selected: null, targets: [] });
  },

  tapSquare(square) {
    const { game, selected, targets } = get();
    if (!game || game.status !== 'playing' || game.turn !== 'w') return;

    if (selected !== null) {
      const move = targets.find((candidate) => candidate.to === square);
      if (move) {
        get().playPlayerMove(move);
        return;
      }
      if (square === selected) {
        get().clearSelection();
        return;
      }
    }

    const piece = pieceAt(game.board, square);
    if (!piece || piece.color !== 'w') {
      get().clearSelection();
      return;
    }
    set({ selected: square, targets: movesForPiece(game.board, square) });
  },

  async playEnemyTurn() {
    const { game, level, seed, enemyThinking } = get();
    if (!game || !level || enemyThinking) return;
    if (game.status !== 'playing' || game.turn !== 'b') return;

    set({ enemyThinking: true });
    try {
      const move = await requestEnemyMove(game, level, seed);
      const current = get().game;
      // Guard against a level restart while the AI was thinking.
      if (!current || current !== game) return;
      if (move) set({ game: applyMove(current, move) });
    } finally {
      set({ enemyThinking: false });
    }
  },
}));
