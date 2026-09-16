import { useEffect } from 'react';
import DailyScreen from './screens/DailyScreen';
import DevScreen from './screens/DevScreen';
import GameScreen from './screens/GameScreen';
import HomeScreen from './screens/HomeScreen';
import RunEndScreen from './screens/RunEndScreen';
import { useAppStore } from '../state/appStore';
import { useDailyStore } from '../state/dailyStore';
import { useRunStore } from '../state/runStore';

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const hydrate = useRunStore((s) => s.hydrate);
  const hydrateDaily = useDailyStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateDaily();
  }, [hydrate, hydrateDaily]);

  switch (screen) {
    case 'game':
      return <GameScreen />;
    case 'runEnd':
      return <RunEndScreen />;
    case 'daily':
      return <DailyScreen />;
    case 'dev':
      return <DevScreen />;
    default:
      return <HomeScreen />;
  }
}
