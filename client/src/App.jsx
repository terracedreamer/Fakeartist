import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useSocket from './hooks/useSocket';
import useGameStore from './stores/gameStore';
import useAuthStore from './stores/authStore';

const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));
const HostCanvas = lazy(() => import('./pages/HostCanvas'));

const PLATFORM_LOGIN = 'https://magicbusstudios.com/auth/login?redirect=https://fakeartist.magicbusstudios.com&brand=mbs';

/** Redirect legacy /login and /signup to MBS Platform */
const PlatformRedirect = () => {
  useEffect(() => {
    window.location.href = PLATFORM_LOGIN;
  }, []);
  return null;
};

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-canvas-bg">
    <div className="animate-pulse text-canvas-text text-xl font-semibold">Loading...</div>
  </div>
);

function App() {
  const room = useGameStore((s) => s.room);
  const theme = room?.settings?.theme || 'clean-minimal';
  const location = useLocation();
  const handleTokenRedirect = useAuthStore((s) => s.handleTokenRedirect);

  // Handle ?token= from MBS Platform redirect on mount
  useEffect(() => {
    handleTokenRedirect();
  }, []);

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
            {/* Legacy auth routes → redirect to MBS Platform */}
            <Route path="/login" element={<PlatformRedirect />} />
            <Route path="/signup" element={<PlatformRedirect />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default App;
