import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Paintbrush, Users, Sparkles } from 'lucide-react';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';

const AVATARS = ['artist', 'detective', 'wizard', 'ninja', 'robot', 'alien', 'pirate', 'astronaut'];

export default function Home() {
  const navigate = useNavigate();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setRoom = useGameStore((s) => s.setRoom);

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('artist');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'
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
    <>
      <Helmet>
        <title>Fake Artist — Join the Game</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Paintbrush className="w-10 h-10 text-canvas-accent" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Fake Artist
            </h1>
          </div>
          <p className="text-canvas-text/60 text-lg">
            One player doesn't know the word. Can you spot them?
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-2xl p-6 shadow-lg">
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg border border-canvas-border bg-canvas-bg text-canvas-text placeholder:text-canvas-text/40 focus:outline-none focus:ring-2 focus:ring-canvas-accent/50"
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                    avatar === a
                      ? 'bg-canvas-accent text-white'
                      : 'bg-canvas-bg border border-canvas-border hover:border-canvas-accent/50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          {!mode && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-canvas-accent text-white font-semibold hover:opacity-90 transition"
              >
                <Sparkles className="w-5 h-5" />
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-canvas-accent text-canvas-accent font-semibold hover:bg-canvas-accent/10 transition"
              >
                <Users className="w-5 h-5" />
                Join Room
              </button>
            </div>
          )}

          {/* Create Mode */}
          {mode === 'create' && (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-canvas-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full py-2 text-sm text-canvas-text/50 hover:text-canvas-text transition"
              >
                Back
              </button>
            </div>
          )}

          {/* Join Mode */}
          {mode === 'join' && (
            <div className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code (e.g. ABC123)"
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-canvas-border bg-canvas-bg text-canvas-text text-center text-2xl tracking-widest font-mono uppercase placeholder:text-base placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-canvas-accent/50"
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-canvas-accent text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full py-2 text-sm text-canvas-text/50 hover:text-canvas-text transition"
              >
                Back
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-canvas-text/30 text-sm">3–16 players</p>
      </div>
    </>
  );
}
