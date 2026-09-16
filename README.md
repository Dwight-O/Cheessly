# King's Ladder

A mobile-first, endless chess-variant game. Capture the enemy king, climb one
level, and keep your hearts. No accounts, no backend, no ads — it installs as a
PWA and works offline.

> Working title. "King's Ladder" has **not** been checked for trademark or app
> store name availability.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command              | What it does                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`        | Vite dev server (the Level Preview screen is linked from Home in dev builds) |
| `npm run build`      | Typecheck, then production build into `dist/`                                |
| `npm run preview`    | Serve the production build locally                                           |
| `npm test`           | Vitest, single run                                                           |
| `npm run test:watch` | Vitest in watch mode                                                         |
| `npm run lint`       | ESLint                                                                       |
| `npm run format`     | Prettier                                                                     |

## How the game works

| Rule      | Detail                                                                                  |
| --------- | --------------------------------------------------------------------------------------- |
| Board     | Set per level, 4x4 up to 8x8                                                            |
| Pieces    | King, queen, rook, bishop and knight move as in standard chess                          |
| Pawns     | One square forward only; capture diagonally forward; no double step, no en passant      |
| Promotion | A pawn reaching the far rank becomes a queen automatically                              |
| Check     | There is none. A king may move onto an attacked square                                  |
| Win       | Capture the enemy king                                                                  |
| Loss      | Your king is captured, or you have no legal move on your turn                           |
| Draw      | Reach a level's move limit with both kings alive; the level is replayed with no penalty |
| Hazards   | Blocked squares may not be entered or slid through; knights may jump over them          |
| Order     | The player always moves first                                                           |

**The run.** Start at level 1 with 3 hearts. A win climbs one level; a loss
costs a heart and a level, but never drops you below your last checkpoint
(every 5 levels, or 4 with the upgrade). Every 10th level is a boss. At zero
hearts the run ends and you bank Crowns, which buy meta upgrades between runs.

**Daily challenge.** Today's UTC date is the seed: five generated levels,
identical for every player, one attempt per day, with a streak and a share card.

## Architecture

| Path         | Contains                                                                |
| ------------ | ----------------------------------------------------------------------- |
| `src/engine` | Pure rules engine — no React, no DOM, no randomness of its own          |
| `src/ai`     | Evaluation, alpha-beta search, and the Web Worker that runs it          |
| `src/levels` | Difficulty curve, 30 hand-tuned levels, the generator and the validator |
| `src/state`  | Zustand stores, run/daily/upgrade rules, persistence                    |
| `src/ui`     | React components; they read state and dispatch actions                  |
| `src/util`   | Seeded PRNG and a try/catch-wrapped localStorage helper                 |

Dependencies run one way: `ui → state → {ai, levels} → engine → util`.

Randomness always comes from `src/util/prng.ts` (mulberry32) seeded from the
run or the date, so a given seed always replays the same game. `Math.random` is
not used anywhere else.

AI search runs in a Web Worker with a 500 ms hard cap and iterative deepening,
so a slow device returns a shallower move instead of freezing the board. If a
Worker cannot be created, the same code runs on the main thread.

See `CLAUDE.md` for the decision log and the per-phase build notes.

## Tests

```bash
npm test
```

Covers move generation for every piece, blocked squares, promotion, every
terminal state, the AI (king captures, free material, seeing a recapture,
determinism, mistake rate, the time budget), run progression and Crowns, all 30
hand-tuned levels, 360 generated levels across four seeds, the daily challenge
and streak, share-card text, the upgrade economy and undo.

## Deploying

The build is a static bundle in `dist/`. `VITE_BASE` controls the public path.

### Vercel

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Vite            |
| Build command    | `npm run build` |
| Output directory | `dist`          |

No environment variables needed — the app is served from the domain root.

### Netlify

`netlify.toml` in the repository root already sets the build command and
publish directory, so connecting the repository is enough.

### GitHub Pages

Pages serves the site from `https://<user>.github.io/<repo>/`, so the base path
must match:

```bash
VITE_BASE=/cheessly/ npm run build
```

`.github/workflows/deploy-pages.yml` does this and publishes `dist/`. It is
set to **manual dispatch only** — run it from the Actions tab. To deploy on
every push instead, add a `push` trigger to that workflow. Enable Pages first
under Settings → Pages → Source: GitHub Actions.

## Not in this build

Accounts, online leaderboards, multiplayer, monetization and analytics are all
out of scope. The leaderboard seam is the profile in `src/state/profile.ts`:
scores are written in one place, so a remote submission can be added behind an
interface without touching the game.
