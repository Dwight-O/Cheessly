import { useEffect } from 'react';
import GameScreen from './screens/GameScreen';
import { useGameStore } from '../state/gameStore';
import type { LevelConfig } from '../levels/types';

/** Phase 2: one hard-coded level so the board and the loop can be played. */
const LEVEL_ONE: LevelConfig = {
  index: 1,
  name: 'First Step',
  rows: ['.k..', '....', '....', 'K.Q.'],
  aiDepth: 0,
  mistakeChance: 0.3,
  isBoss: false,
  note: 'Tap a piece, then tap a highlighted square. Capture the enemy king.',
};

export default function App() {
  const startLevel = useGameStore((s) => s.startLevel);

  useEffect(() => {
    startLevel(LEVEL_ONE, 1);
  }, [startLevel]);

  return <GameScreen onContinue={() => startLevel(LEVEL_ONE, Date.now() >>> 0)} />;
}
