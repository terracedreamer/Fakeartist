import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Paintbrush, Users, Sparkles, ArrowLeft, LogIn } from 'lucide-react';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';
import useAuthStore from '../stores/authStore';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';

const AVATARS = ['artist', 'detective', 'wizard', 'ninja', 'robot', 'alien', 'pirate', 'astronaut'];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setRoom = useGameStore((s) => s.setRoom);
  const { isAuthenticated, user, login } = useAuthStore();

  // Pre-fill username from MBS Platform profile if logged in
  const [username, setUsername] = useState(user?.name || '');
  const [avatar, setAvatar] = useState('artist');
  const [joinCode, setJoinCode] = useState(searchParams.get('join') || '');
  const [mode, setMode] = useState(searchParams.get('join') ? 'join' : null);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!username.trim()) return toast.error('Enter a username');
    if (username.trim().length > 20) return toast.error('Username max 20 characters');
    setLoading(true);

    if (!socket.connected) socket.connect();

    socket.emit('create-room', { username: username.trim(), avatar }, (res) => {
      setLoading(false);
      if (!res.success) return toast.error(res.message);
      setPlayer({ playerId: res.playerId, username: username.trim(), avatar });
      setRoom(res.room);
      navigate(`/lobby/${res.room.code}`);
    });
  };

  const handleJoin = () => {
    if (!username.trim()) return toast.error('Enter a username');
    if (!joinCode.trim()) return toast.error('Enter a room code');
    setLoading(true);

    if (!socket.connected) socket.connect();

    socket.emit('join-room', { code: joinCode.trim().toUpperCase(), username: username.trim(), avatar }, (res) => {
      setLoading(false);
      if (!res.success) return toast.error(res.message);
      setPlayer({ playerId: res.playerId, username: username.trim(), avatar });
      setRoom(res.room);
      navigate(`/lobby/${res.room.code}`);
    });
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Fake Artist — Join the Game</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Paintbrush className="w-10 h-10 text-canvas-accent" />
            <h1 className="gradient-text text-4xl md:text-5xl font-extrabold tracking-tight">
              Fake Artist
            </h1>
          </div>
          <p className="text-canvas-text/60 text-lg">
            One player doesn't know the word. Can you spot them?
          </p>
        </motion.div>

        {/* Card */}
        <GlassCard className="w-full max-w-md shadow-lg">
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg border border-canvas-border bg-canvas-bg text-canvas-text placeholder:text-canvas-text/40 focus:outline-none focus:ring-2 focus:ring-canvas-accent/50 transition"
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <motion.button
                  key={a}
                  onClick={() => setAvatar(a)}
                  whileTap={{ scale: 0.9 }}
                  animate={avatar === a ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                    avatar === a
                      ? 'bg-canvas-accent text-white'
                      : 'bg-canvas-bg border border-canvas-border hover:border-canvas-accent/50'
                  }`}
                >
                  {a}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <AnimatePresence mode="wait">
            {!mode && (
              <motion.div
                key="mode-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <AnimatedButton
                  onClick={() => setMode('create')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Room
                </AnimatedButton>
                <AnimatedButton
                  variant="secondary"
                  onClick={() => setMode('join')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Join Room
                </AnimatedButton>
              </motion.div>
            )}

            {mode === 'create' && (
              <motion.div
                key="mode-create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <AnimatedButton
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </AnimatedButton>
                <button
                  onClick={() => setMode(null)}
                  className="w-full py-2 text-sm text-canvas-text/50 hover:text-canvas-text transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </motion.div>
            )}

            {mode === 'join' && (
              <motion.div
                key="mode-join"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Room code (e.g. ABC123)"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-canvas-border bg-canvas-bg text-canvas-text text-center text-2xl tracking-widest font-mono uppercase placeholder:text-base placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-canvas-accent/50 transition"
                />
                <AnimatedButton
                  onClick={handleJoin}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </AnimatedButton>
                <button
                  onClick={() => setMode(null)}
                  className="w-full py-2 text-sm text-canvas-text/50 hover:text-canvas-text transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-canvas-text/30 text-sm"
        >
          3–16 players
        </motion.p>
      </div>
    </PageTransition>
  );
}
