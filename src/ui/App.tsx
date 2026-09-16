import { useEffect } from 'react';
import GameScreen from './screens/GameScreen';
import HomeScreen from './screens/HomeScreen';
import RunEndScreen from './screens/RunEndScreen';
import { useAppStore } from '../state/appStore';
import { useRunStore } from '../state/runStore';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const hydrate = useRunStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  switch (screen) {
    case 'game':
      return <GameScreen />;
    case 'runEnd':
      return <RunEndScreen />;
    default:
      return <HomeScreen />;
  }
}
