import { useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Session } from './screens/Session';
import { Baseline } from './screens/Baseline';
import { ParentPanel } from './screens/ParentPanel';
import { loadState, saveState } from './lib/storage';
import type { AppState } from './lib/types';

type Screen = 'home' | 'session' | 'baseline' | 'parent';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          state={state}
          onStart={() => setScreen('session')}
          onBaseline={() => setScreen('baseline')}
          onParent={() => setScreen('parent')}
        />
      )}
      {screen === 'session' && (
        <Session state={state} setState={setState} onExit={() => setScreen('home')} />
      )}
      {screen === 'baseline' && (
        <Baseline
          speechRate={state.settings.speechRate}
          setState={setState}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'parent' && (
        <ParentPanel state={state} setState={setState} onBack={() => setScreen('home')} />
      )}
    </div>
  );
}
