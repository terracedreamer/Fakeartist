import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Eye, EyeOff, Clock, MessageCircle, Vote, Trophy } from 'lucide-react';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';
import DrawingCanvas from '../components/DrawingCanvas';

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();

  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const currentWord = useGameStore((s) => s.currentWord);
  const isFakeArtist = useGameStore((s) => s.isFakeArtist);
  const category = useGameStore((s) => s.category);
  const turnOrder = useGameStore((s) => s.turnOrder);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const drawingRound = useGameStore((s) => s.drawingRound);
  const aiAnalysis = useGameStore((s) => s.aiAnalysis);
  const discussionTimer = useGameStore((s) => s.discussionTimer);
  const voteResults = useGameStore((s) => s.voteResults);
  const redemptionResult = useGameStore((s) => s.redemptionResult);
  const gameOver = useGameStore((s) => s.gameOver);

  const [phase, setPhase] = useState('waiting'); // waiting, drawing, discussion, voting, redemption, results, gameover
  const [timer, setTimer] = useState(0);
  const [selectedVote, setSelectedVote] = useState(null);
  const [redemptionGuess, setRedemptionGuess] = useState('');
  const [customWord, setCustomWord] = useState('');
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

  const isHost = (room?.players || []).find((p) => p.id?.toString() === playerId?.toString())?.isHost;
  const currentPlayer = (turnOrder || [])[currentTurnIndex];
  const isMyTurn = currentPlayer?.id?.toString() === playerId?.toString();

  // Determine phase from round status
  useEffect(() => {
    if (gameOver) { setPhase('gameover'); return; }
    if (!room) return;
    const currentRound = (room.rounds || [])[(room.currentRound || 1) - 1];
    if (!currentRound) {
      setPhase('waiting');
      return;
    }
    if (redemptionResult) { setPhase('results'); return; }
    if (voteResults?.needsRedemption) { setPhase('redemption'); return; }
    if (voteResults && !voteResults.needsRedemption) { setPhase('results'); return; }
    if (aiAnalysis !== null && aiAnalysis !== undefined) { setPhase('discussion'); return; }
    if (currentWord !== null || isFakeArtist) { setPhase('drawing'); return; }
    setPhase('waiting');
  }, [room, currentWord, isFakeArtist, aiAnalysis, voteResults, redemptionResult, gameOver]);

  // Discussion countdown
  useEffect(() => {
    if (phase !== 'discussion') return;
    setTimer(discussionTimer);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setPhase('voting');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, discussionTimer]);

  // Reset drawn state on turn change
  useEffect(() => {
    setHasDrawnThisTurn(false);
  }, [currentTurnIndex, drawingRound]);

  const handleStrokeComplete = useCallback((stroke) => {
    socket.emit('draw-stroke', { code, playerId, stroke }, (res) => {
      if (!res?.success) toast.error(res?.message || 'Failed to send stroke');
    });
    setHasDrawnThisTurn(true);
  }, [code, playerId]);

  const handleVote = (suspectId) => {
    setSelectedVote(suspectId);
    socket.emit('submit-vote', { code, voterId: playerId, suspectId }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  };

  const handleRedemption = () => {
    if (!redemptionGuess.trim()) return toast.error('Enter a guess');
    socket.emit('redemption-guess', { code, guess: redemptionGuess.trim() }, (res) => {
      if (!res.success) toast.error(res.message);
    });
  };

  const handleStartRound = () => {
    useGameStore.getState().resetRound();
    socket.emit('start-round', { code, customWord: customWord.trim() || null }, (res) => {
      if (!res.success) toast.error(res.message);
      setCustomWord('');
    });
  };

  const handleNextRound = () => {
    useGameStore.getState().resetRound();
    useGameStore.getState().clearStrokes();
    handleStartRound();
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate('/')} className="px-6 py-2 rounded-xl bg-canvas-accent text-white">Back to Home</button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Game — {code}</title></Helmet>
      <div className="min-h-screen flex flex-col items-center px-4 py-4">
        {/* Status Bar */}
        <div className="w-full max-w-md flex items-center justify-between mb-4 text-sm">
          <span className="font-mono font-bold">{code}</span>
          <span className="text-canvas-text/50">Round {room.currentRound}/{room.settings?.totalRounds}</span>
          <span className="font-medium text-canvas-accent">
            {(room.players || []).find((p) => p.id?.toString() === playerId?.toString())?.score || 0} pts
          </span>
        </div>

        {/* Waiting Phase — Host starts round */}
        {phase === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            {isHost ? (
              <div className="space-y-4 w-full max-w-sm">
                <h2 className="text-2xl font-bold">Start Round {(room.currentRound || 0) + 1}</h2>
                <input
                  type="text"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="Custom word (or leave blank for AI)"
                  className="w-full px-4 py-2.5 rounded-lg border border-canvas-border bg-canvas-bg text-center focus:outline-none focus:ring-2 focus:ring-canvas-accent/50"
                />
                <button
                  onClick={handleStartRound}
                  className="w-full py-3 rounded-xl bg-canvas-accent text-white font-bold text-lg hover:opacity-90 transition"
                >
                  Start Round
                </button>
              </div>
            ) : (
              <p className="text-canvas-text/50 text-lg">Waiting for host to start the round...</p>
            )}
          </div>
        )}

        {/* Drawing Phase */}
        {phase === 'drawing' && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md">
            {/* Word display */}
            <div className="w-full text-center p-3 rounded-xl bg-canvas-card border border-canvas-border">
              {isFakeArtist ? (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <EyeOff className="w-5 h-5" />
                  <span className="font-bold">You are the Fake Artist!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5 text-canvas-accent" />
                  <span>Category: <strong>{category}</strong></span>
                  <span className="mx-1">|</span>
                  <span>Word: <strong className="text-canvas-accent text-lg">{currentWord}</strong></span>
                </div>
              )}
            </div>

            {/* Turn indicator */}
            <div className="text-center">
              <p className="text-sm text-canvas-text/50">
                Drawing turn {drawingRound}/{room.settings?.drawingRoundsPerTurn}
              </p>
              <p className="font-semibold text-lg">
                {isMyTurn ? "Your turn — draw one continuous line!" : `${currentPlayer?.username}'s turn`}
              </p>
            </div>

            {/* Drawing canvas */}
            <DrawingCanvas
              onStrokeComplete={handleStrokeComplete}
              disabled={!isMyTurn || hasDrawnThisTurn}
              width={400}
              height={400}
            />

            {hasDrawnThisTurn && isMyTurn && (
              <p className="text-sm text-canvas-text/50">Stroke sent! Waiting for next turn...</p>
            )}
          </div>
        )}

        {/* Discussion Phase */}
        {phase === 'discussion' && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center">
            <MessageCircle className="w-10 h-10 text-canvas-accent" />
            <h2 className="text-2xl font-bold">Discussion Time!</h2>
            <div className="flex items-center gap-2 text-3xl font-mono font-bold text-canvas-accent">
              <Clock className="w-6 h-6" />
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </div>
            {aiAnalysis && (
              <div className="p-4 bg-canvas-card border border-canvas-border rounded-xl italic text-canvas-text/80">
                "{aiAnalysis}"
              </div>
            )}
            <p className="text-canvas-text/50">Discuss who the Fake Artist might be. Voting starts when the timer ends.</p>
            <button
              onClick={() => setPhase('voting')}
              className="mt-2 px-6 py-2 rounded-xl bg-canvas-accent text-white font-medium"
            >
              Skip to Vote
            </button>
          </div>
        )}

        {/* Voting Phase */}
        {phase === 'voting' && !voteResults && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md">
            <Vote className="w-10 h-10 text-canvas-accent" />
            <h2 className="text-2xl font-bold">Vote for the Fake Artist</h2>
            <div className="w-full space-y-2">
              {(room.players || []).map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={selectedVote !== null || player.id?.toString() === playerId?.toString()}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${
                    selectedVote === player.id
                      ? 'border-canvas-accent bg-canvas-accent/10'
                      : player.id?.toString() === playerId?.toString()
                        ? 'border-canvas-border/30 opacity-40 cursor-not-allowed'
                        : 'border-canvas-border hover:border-canvas-accent/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-canvas-accent/20 flex items-center justify-center text-sm font-bold capitalize">
                    {player.avatar?.[0] || player.username?.[0]}
                  </div>
                  <span className="font-medium">{player.username}</span>
                  {selectedVote === player.id && <span className="ml-auto text-canvas-accent font-bold">Voted</span>}
                </button>
              ))}
            </div>
            {selectedVote && <p className="text-sm text-canvas-text/50">Waiting for all players to vote...</p>}
          </div>
        )}

        {/* Redemption Phase */}
        {phase === 'redemption' && !redemptionResult && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold">The Fake Artist was caught!</h2>
            <p className="text-canvas-text/60">
              <strong>{voteResults?.caughtPlayer?.username}</strong> got the most votes.
            </p>
            {isFakeArtist ? (
              <div className="w-full space-y-3">
                <p className="font-semibold text-lg text-red-500">You have 10 seconds — guess the word!</p>
                <input
                  type="text"
                  value={redemptionGuess}
                  onChange={(e) => setRedemptionGuess(e.target.value)}
                  placeholder="What was the word?"
                  className="w-full px-4 py-3 rounded-lg border border-canvas-border bg-canvas-bg text-center text-xl focus:outline-none focus:ring-2 focus:ring-canvas-accent/50"
                  autoFocus
                />
                <button
                  onClick={handleRedemption}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-lg hover:opacity-90 transition"
                >
                  Submit Guess
                </button>
              </div>
            ) : (
              <p className="text-canvas-text/50">Waiting for the Fake Artist to guess the word...</p>
            )}
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h2 className="text-2xl font-bold">Round Results</h2>

            {voteResults && (
              <div className="space-y-2">
                {voteResults.isFakeArtist ? (
                  redemptionResult?.isCorrect ? (
                    <p className="text-lg text-red-500 font-bold">
                      Fake Artist guessed correctly! "{redemptionResult.guess}" — they win!
                    </p>
                  ) : (
                    <p className="text-lg text-green-500 font-bold">
                      Artists win! The Fake Artist guessed "{redemptionResult?.guess}" but the word was "{redemptionResult?.word}"
                    </p>
                  )
                ) : (
                  <p className="text-lg text-red-500 font-bold">
                    Wrong person voted out! The Fake Artist escaped!
                  </p>
                )}
              </div>
            )}

            {/* Scoreboard */}
            <div className="w-full mt-4">
              <h3 className="font-semibold mb-2">Scores</h3>
              <div className="space-y-2">
                {(room.players || [])
                  .sort((a, b) => b.score - a.score)
                  .map((player, i) => (
                    <div key={player.id} className="flex items-center justify-between px-4 py-2 bg-canvas-card border border-canvas-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-canvas-text/40">{i + 1}</span>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="font-bold text-canvas-accent">{player.score} pts</span>
                    </div>
                  ))}
              </div>
            </div>

            {isHost && (
              <button
                onClick={handleNextRound}
                className="w-full mt-4 py-3 rounded-xl bg-canvas-accent text-white font-bold text-lg hover:opacity-90 transition"
              >
                {room.currentRound >= room.settings?.totalRounds ? 'See Final Results' : 'Next Round'}
              </button>
            )}
          </div>
        )}

        {/* Game Over */}
        {phase === 'gameover' && (
          <div className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center">
            <Trophy className="w-14 h-14 text-yellow-500" />
            <h2 className="text-3xl font-extrabold">Game Over!</h2>

            <div className="w-full mt-2">
              <h3 className="font-semibold mb-3 text-lg">Final Leaderboard</h3>
              <div className="space-y-2">
                {(room.players || [])
                  .sort((a, b) => b.score - a.score)
                  .map((player, i) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                        i === 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-canvas-card border-canvas-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                        <span className="font-semibold">{player.username}</span>
                      </div>
                      <span className="font-bold text-xl text-canvas-accent">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 py-3 rounded-xl bg-canvas-accent text-white font-bold text-lg"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </>
  );
}
