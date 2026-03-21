import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useSocket from './hooks/useSocket';
import useGameStore from './stores/gameStore';

const Landing = lazy(() => import('./pages/Landing'));
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
  const location = useLocation();

  useSocket();

  return (
    <div data-theme={theme} className="min-h-screen bg-canvas-bg text-canvas-text">
      <Suspense fallback={<Loading />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/play" element={<Home />} />
            <Route path="/lobby/:code" element={<Lobby />} />
            <Route path="/game/:code" element={<Game />} />
            <Route path="/host/:code" element={<HostCanvas />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default App;
