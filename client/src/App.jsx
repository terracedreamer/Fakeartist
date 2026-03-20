import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import useSocket from './hooks/useSocket';
import useGameStore from './stores/gameStore';

const Home = lazy(() => import('./pages/Home'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));
const HostCanvas = lazy(() => import('./pages/HostCanvas'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-canvas-bg">
    <div className="animate-pulse text-canvas-text text-xl font-semibold">Loading...</div>
  </div>
);

function App() {
  const room = useGameStore((s) => s.room);
  const theme = room?.settings?.theme || 'clean-minimal';

  useSocket();

  return (
    <div data-theme={theme} className="min-h-screen bg-canvas-bg text-canvas-text">
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/game/:code" element={<Game />} />
          <Route path="/host/:code" element={<HostCanvas />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
