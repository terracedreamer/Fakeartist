import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Crown, Settings, Play, UserMinus, ArrowRightLeft, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';
import PageTransition from '../components/PageTransition';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    totalRounds: room?.settings?.totalRounds || 3,
    drawingRoundsPerTurn: room?.settings?.drawingRoundsPerTurn || 2,
    discussionTimer: room?.settings?.discussionTimer || 60,
    theme: room?.settings?.theme || 'clean-minimal',
    aiAnalysis: room?.settings?.aiAnalysis ?? true,
  });

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-canvas-text/60 mb-4">Room not found or disconnected</p>
          <AnimatedButton onClick={() => navigate('/play')} variant="primary">
            Back to Home
          </AnimatedButton>
        </div>
      </div>
    );
  }

  const isHost = (room.players || []).find((p) => p.id?.toString() === playerId?.toString())?.isHost;
  const joinUrl = `${window.location.origin}/play?join=${code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Room code copied!');
  };

  const handleStart = () => {
    if ((room.players || []).length < 3) return toast.error('Need at least 3 players');
    socket.emit('start-game', { code }, (res) => {
      if (!res.success) return toast.error(res.message);
      navigate(`/game/${code}`);
    });
  };

  const handleOpenHostScreen = () => {
    window.open(`/host/${code}`, '_blank');
  };

  const handleKick = (targetId) => {
    socket.emit('kick-player', { code, playerId: targetId }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  };

  const handleTransferHost = (targetId) => {
    socket.emit('transfer-host', { code, newHostId: targetId }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  };

  const handleSaveSettings = () => {
    socket.emit('update-settings', { code, settings }, (res) => {
      if (!res.success) return toast.error(res.message);
      toast.success('Settings saved');
      setShowSettings(false);
    });
  };

  return (
    <PageTransition>
      <Helmet><title>Lobby — {code}</title></Helmet>
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        {/* Room Code + QR */}
        <GlassCard className="text-center mb-6 w-full max-w-md">
          <p className="text-sm text-canvas-text/50 mb-1">Room Code</p>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-4xl font-mono font-bold tracking-[0.3em]">{code}</span>
            <button onClick={copyCode} className="p-2 rounded-lg hover:bg-canvas-border/50 transition">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 bg-white p-3 rounded-xl inline-block glow">
            <QRCodeSVG value={joinUrl} size={140} />
          </div>
          <p className="mt-2 text-xs text-canvas-text/40">Scan to join</p>
        </GlassCard>

        {/* Players */}
        <GlassCard className="w-full max-w-md mb-6">
          <h2 className="text-sm font-semibold text-canvas-text/60 mb-2">
            Players (<AnimatedCounter value={(room.players || []).length} />/16)
          </h2>
          <div className="space-y-2">
            {(room.players || []).map((player, index) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center justify-between px-4 py-3 bg-canvas-card border border-canvas-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-canvas-accent/20 flex items-center justify-center text-sm font-bold capitalize">
                    {player.avatar?.[0] || player.username?.[0]}
                  </div>
                  <span className="font-medium">{player.username}</span>
                  {player.isHost && <Crown className="w-4 h-4 text-yellow-500" />}
                </div>
                {isHost && player.id?.toString() !== playerId?.toString() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTransferHost(player.id)}
                      className="p-1.5 rounded-lg hover:bg-canvas-border/50 transition"
                      title="Transfer host"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleKick(player.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                      title="Kick player"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Host Controls */}
        {isHost && (
          <div className="w-full max-w-md space-y-3">
            <AnimatedButton
              onClick={handleOpenHostScreen}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <Monitor className="w-5 h-5" />
              Open Host Canvas (shared screen)
            </AnimatedButton>

            <AnimatedButton
              onClick={() => setShowSettings(!showSettings)}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Game Settings
            </AnimatedButton>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <GlassCard className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Rounds ({settings.totalRounds})</label>
                      <input
                        type="range" min="1" max="10" value={settings.totalRounds}
                        onChange={(e) => setSettings((s) => ({ ...s, totalRounds: +e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Drawing turns per round ({settings.drawingRoundsPerTurn})</label>
                      <input
                        type="range" min="1" max="5" value={settings.drawingRoundsPerTurn}
                        onChange={(e) => setSettings((s) => ({ ...s, drawingRoundsPerTurn: +e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Discussion timer ({settings.discussionTimer}s)</label>
                      <input
                        type="range" min="15" max="300" step="15" value={settings.discussionTimer}
                        onChange={(e) => setSettings((s) => ({ ...s, discussionTimer: +e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Theme</label>
                      <select
                        value={settings.theme}
                        onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-canvas-border bg-canvas-bg"
                      >
                        <option value="clean-minimal">Clean & Minimal</option>
                        <option value="dark-artsy">Dark & Artsy</option>
                        <option value="bright-playful">Bright & Playful</option>
                        <option value="retro-sketchbook">Retro Sketchbook</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="aiAnalysis"
                        checked={settings.aiAnalysis}
                        onChange={(e) => setSettings((s) => ({ ...s, aiAnalysis: e.target.checked }))}
                      />
                      <label htmlFor="aiAnalysis" className="text-sm">AI post-round analysis</label>
                    </div>
                    <AnimatedButton
                      onClick={handleSaveSettings}
                      variant="primary"
                      className="w-full"
                    >
                      Save Settings
                    </AnimatedButton>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatedButton
              onClick={handleStart}
              disabled={(room.players || []).length < 3}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 text-lg !py-4 !font-bold"
            >
              <Play className="w-6 h-6" />
              Start Game
            </AnimatedButton>
          </div>
        )}

        {!isHost && (
          <motion.p
            className="text-canvas-text/40 text-sm"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Waiting for the host to start the game...
          </motion.p>
        )}
      </div>
    </PageTransition>
  );
}
