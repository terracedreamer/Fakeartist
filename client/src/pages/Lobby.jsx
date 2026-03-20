import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Crown, Settings, Play, UserMinus, ArrowRightLeft, Monitor } from 'lucide-react';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';

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
          <button onClick={() => navigate('/')} className="px-6 py-2 rounded-xl bg-canvas-accent text-white font-medium">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isHost = (room.players || []).find((p) => p.id?.toString() === playerId?.toString())?.isHost;
  const joinUrl = `${window.location.origin}/?join=${code}`;

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
    <>
      <Helmet><title>Lobby — {code}</title></Helmet>
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        {/* Room Code + QR */}
        <div className="text-center mb-6">
          <p className="text-sm text-canvas-text/50 mb-1">Room Code</p>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-4xl font-mono font-bold tracking-[0.3em]">{code}</span>
            <button onClick={copyCode} className="p-2 rounded-lg hover:bg-canvas-border/50 transition">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 bg-white p-3 rounded-xl inline-block">
            <QRCodeSVG value={joinUrl} size={140} />
          </div>
          <p className="mt-2 text-xs text-canvas-text/40">Scan to join</p>
        </div>

        {/* Players */}
        <div className="w-full max-w-md mb-6">
          <h2 className="text-sm font-semibold text-canvas-text/60 mb-2">
            Players ({(room.players || []).length}/16)
          </h2>
          <div className="space-y-2">
            {(room.players || []).map((player) => (
              <div
                key={player.id}
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
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="w-full max-w-md space-y-3">
            <button
              onClick={handleOpenHostScreen}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-canvas-border font-medium hover:bg-canvas-card transition"
            >
              <Monitor className="w-5 h-5" />
              Open Host Canvas (shared screen)
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-canvas-border font-medium hover:bg-canvas-card transition"
            >
              <Settings className="w-5 h-5" />
              Game Settings
            </button>

            {showSettings && (
              <div className="p-4 bg-canvas-card border border-canvas-border rounded-xl space-y-4">
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
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2 rounded-lg bg-canvas-accent text-white font-medium"
                >
                  Save Settings
                </button>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={(room.players || []).length < 3}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-canvas-accent text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-40"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
          </div>
        )}

        {!isHost && (
          <p className="text-canvas-text/40 text-sm">Waiting for the host to start the game...</p>
        )}
      </div>
    </>
  );
}
