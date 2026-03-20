import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Paintbrush, Users } from 'lucide-react';
import useGameStore from '../stores/gameStore';
import HostCanvasDisplay from '../components/HostCanvasDisplay';

export default function HostCanvas() {
  const { code } = useParams();
  const room = useGameStore((s) => s.room);
  const turnOrder = useGameStore((s) => s.turnOrder);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const drawingRound = useGameStore((s) => s.drawingRound);
  const aiAnalysis = useGameStore((s) => s.aiAnalysis);
  const voteResults = useGameStore((s) => s.voteResults);
  const redemptionResult = useGameStore((s) => s.redemptionResult);
  const gameOver = useGameStore((s) => s.gameOver);

  const currentPlayer = (turnOrder || [])[currentTurnIndex];
  const currentRound = room?.rounds?.[(room?.currentRound || 1) - 1];
  const phase = currentRound?.status || 'waiting';

  return (
    <>
      <Helmet><title>Host Canvas — {code}</title></Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas-bg p-6">
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-canvas-accent" />
            <span className="font-bold text-xl">Fake Artist</span>
          </div>
          <span className="font-mono text-lg tracking-widest">{code}</span>
          <div className="flex items-center gap-2 text-canvas-text/60">
            <Users className="w-5 h-5" />
            <span>{(room?.players || []).length} players</span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4 text-center">
          {phase === 'drawing' && currentPlayer && (
            <div className="text-lg">
              <span className="text-canvas-text/50">Drawing:</span>{' '}
              <strong className="text-canvas-accent">{currentPlayer.username}</strong>
              <span className="text-canvas-text/40 ml-3">
                Turn {drawingRound}/{room?.settings?.drawingRoundsPerTurn}
              </span>
            </div>
          )}
          {phase === 'discussion' && (
            <p className="text-lg font-semibold text-canvas-accent">Discussion Phase</p>
          )}
          {phase === 'voting' && (
            <p className="text-lg font-semibold text-canvas-accent">Voting in Progress...</p>
          )}
          {phase === 'redemption' && (
            <p className="text-lg font-semibold text-red-500">Fake Artist Redemption!</p>
          )}
          {aiAnalysis && phase === 'discussion' && (
            <div className="mt-3 max-w-2xl mx-auto p-4 bg-canvas-card border border-canvas-border rounded-xl italic text-lg">
              "{aiAnalysis}"
            </div>
          )}
        </div>

        {/* Canvas */}
        <HostCanvasDisplay width={800} height={600} />

        {/* Vote results overlay */}
        {voteResults && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold">
              {voteResults.isFakeArtist
                ? `${voteResults.caughtPlayer?.username} was the Fake Artist!`
                : `${voteResults.caughtPlayer?.username} was innocent!`
              }
            </p>
            {redemptionResult && (
              <p className="text-lg mt-2">
                {redemptionResult.isCorrect
                  ? `Fake Artist guessed "${redemptionResult.guess}" — CORRECT!`
                  : `Fake Artist guessed "${redemptionResult.guess}" — WRONG! Word was "${redemptionResult.word}"`
                }
              </p>
            )}
          </div>
        )}

        {/* Game over */}
        {gameOver && (
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-extrabold mb-4">Game Over!</h2>
            <div className="space-y-2 max-w-sm mx-auto">
              {(room?.players || [])
                .sort((a, b) => b.score - a.score)
                .map((player, i) => (
                  <div key={player.id} className="flex items-center justify-between px-4 py-2 bg-canvas-card border border-canvas-border rounded-lg">
                    <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {player.username}</span>
                    <span className="font-bold text-canvas-accent">{player.score}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Player turn order strip */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {(turnOrder || []).map((player, i) => (
            <div
              key={player.id}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                i === currentTurnIndex
                  ? 'border-canvas-accent bg-canvas-accent text-white'
                  : i < currentTurnIndex
                    ? 'border-canvas-border/50 text-canvas-text/30'
                    : 'border-canvas-border text-canvas-text/60'
              }`}
            >
              {player.username}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
