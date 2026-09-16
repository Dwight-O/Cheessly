# King's Ladder — project guide

A mobile-first PWA: a simplified, fast, endless chess-variant game. Capture the
enemy king, climb the ladder, keep your hearts.

## Commands

| Command              | What it does                               |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Vite dev server                            |
| `npm run build`      | Typecheck (`tsc -b`) then production build |
| `npm run preview`    | Serve the production build locally         |
| `npm test`           | Vitest, single run                         |
| `npm run test:watch` | Vitest, watch mode                         |
| `npm run lint`       | ESLint (flat config)                       |
| `npm run format`     | Prettier write                             |

Quality bar: `npm test`, `npm run lint` and `npm run build` must all pass, and
the game must run with no console errors, before a phase is considered done.

## Architecture

| Path         | Rule                                                               |
| ------------ | ------------------------------------------------------------------ |
| `src/engine` | Pure rules engine. No React, no DOM, no randomness of its own.     |
| `src/ai`     | Search and evaluation. Depends on the engine, never on the UI.     |
| `src/levels` | Level definitions as **data** plus a generator and validator.      |
| `src/state`  | Zustand stores + persistence. The bridge between UI and engine/AI. |
| `src/ui`     | React components. Read state, dispatch actions. No rules logic.    |
| `src/util`   | Seeded PRNG, localStorage wrapper. No app-specific logic.          |

Dependency direction is one-way: `ui → state → {ai, levels} → engine → util`.

## Decisions

| Decision                 | Choice and reason                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Styling: **CSS Modules** | No extra build dependency or config; the board needs computed geometry (grid sized from the level's board size) which reads better as plain CSS with custom properties than as utility strings. Global tokens live in `src/ui/styles/global.css`. |
| State: **Zustand**       | Small API, no provider tree, easy to read from a Web Worker callback.                                                                                                                                                                             |
| Randomness               | `src/util/prng.ts` (mulberry32) only. `Math.random` is banned outside that file so every run is reproducible from a seed.                                                                                                                         |
| Persistence              | `src/util/storage.ts` wraps every localStorage read/write in try/catch and returns a fallback. Storage failure must never crash the game.                                                                                                         |
| Board coordinates        | `y = 0` is the **enemy** back rank (top of the screen), `y = height - 1` is the **player** back rank. Player pawns move toward `y = 0`.                                                                                                           |
| Colours                  | `'w'` = player (always moves first), `'b'` = enemy/AI.                                                                                                                                                                                            |
| PWA                      | `vite-plugin-pwa` in `generateSW` mode, `autoUpdate`. Icons are generated PNGs in `public/icons`.                                                                                                                                                 |
| Deploy base path         | `VITE_BASE` env var so the same build works at a domain root (Vercel/Netlify) or under `/<repo>/` (GitHub Pages).                                                                                                                                 |

## Game rules (authoritative summary)

- Board is per-level, 4x4 up to 8x8.
- King, Queen, Rook, Bishop, Knight move as in standard chess.
- Pawns move one square forward (no double step, no en passant) and capture
  diagonally forward. Reaching the far rank auto-promotes to a Queen.
- **No check or checkmate.** A king may legally move onto an attacked square.
- WIN: capture the enemy king. LOSS: your king is captured, or you have no
  legal move on your turn.
- Optional per-level move limit: reaching it with both kings alive is a DRAW,
  and the player replays the level with no penalty.
- Optional blocked squares: no piece may enter one, and sliders may not pass
  through one. Knights may jump over them.
- The player always moves first.

## Progression

- A run starts at level 1 with 3 hearts (more with meta upgrades, max 5).
- Win → +1 level. Loss → −1 heart and −1 level, never below the last checkpoint.
- Checkpoints every 5 levels (4 with the upgrade). Boss every 10 levels.
- 0 hearts ends the run and awards Crowns based on the highest level reached.

## Phase log

- **Phase 3** — AI. `src/ai/evaluate.ts` (material + 0.05/move mobility),
  `src/ai/search.ts` (alpha-beta with iterative deepening, MVV-LVA ordering and
  a hard 500 ms wall-clock cap), `src/ai/worker.ts` + `client.ts` (Web Worker
  with a main-thread fallback and a 260 ms minimum "thinking" delay).
  Search is written as explicit max/min rather than negamax because the
  double-move modifier means the side to move does not always alternate.
  Measured in this container: depth 4 from a full 8x8 start position is ~80 ms
  and ~720 interior nodes, so depth 4 fits the 500 ms budget with headroom;
  slower devices degrade automatically because only completed iterations count.
- **Phase 2** — board UI. Squares are buttons with ARIA labels; pieces are SVG
  tokens in an absolutely positioned layer (so phase 8 can animate them).
  `src/state/gameStore.ts` holds selection and turn flow; `src/ai/client.ts` is
  the seam the Web Worker slots into in phase 3. One hard-coded level.
- **Phase 1** — rules engine (`src/engine`): board + ASCII parser, move
  generation for all six pieces, blocked squares, promotion, win/loss/draw
  resolution, the enemy double-move modifier. 53 unit tests.
  Status precedence is: king captured > missing king > side to move has no
  legal move (that side loses) > move limit reached (draw).
- **Phase 0** — scaffold, lint/format/test tooling, PWA config, icons, seeded
  PRNG, safe localStorage wrapper, this file.
