import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Eye, EyeOff, MessageCircle, Vote, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';
import DrawingCanvas from '../components/DrawingCanvas';
import PageTransition from '../components/PageTransition';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCounter from '../components/AnimatedCounter';
import CountdownRing from '../components/CountdownRing';
import ConfirmModal from '../components/ConfirmModal';

const phaseTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

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

  // Vote confirmation state
  const [pendingVote, setPendingVote] = useState(null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);

  // Redemption countdown state
  const [redemptionTimer, setRedemptionTimer] = useState(10);
  const hasSubmitted = useRef(false);

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

  // Redemption countdown (10 seconds)
  useEffect(() => {
    if (phase !== 'redemption' || !isFakeArtist) {
      hasSubmitted.current = false;
      setRedemptionTimer(10);
      return;
    }
    setRedemptionTimer(10);
    hasSubmitted.current = false;
    const interval = setInterval(() => {
      setRedemptionTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          if (!hasSubmitted.current) {
            hasSubmitted.current = true;
            // Auto-submit current guess when timer hits 0
            const guess = useGameStore.getState ? redemptionGuess.trim() : '';
            socket.emit('redemption-guess', { code, guess: guess || '(no guess)' }, (res) => {
              if (!res.success) toast.error(res.message);
            });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isFakeArtist, code]);

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

  const handleVoteClick = (suspectId) => {
    setPendingVote(suspectId);
    setShowVoteConfirm(true);
  };

  const handleVoteConfirm = () => {
    if (!pendingVote) return;
    setSelectedVote(pendingVote);
    socket.emit('submit-vote', { code, voterId: playerId, suspectId: pendingVote }, (res) => {
      if (!res.success) toast.error(res.message);
    });
    setShowVoteConfirm(false);
    setPendingVote(null);
  };

  const handleVoteCancel = () => {
    setShowVoteConfirm(false);
    setPendingVote(null);
  };

  const handleRedemption = () => {
    if (hasSubmitted.current) return;
    if (!redemptionGuess.trim()) return toast.error('Enter a guess');
    hasSubmitted.current = true;
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

  const pendingPlayer = (room?.players || []).find((p) => p.id === pendingVote);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedButton onClick={() => navigate('/play')}>Back to Home</AnimatedButton>
      </div>
    );
  }

  const playerScore = (room.players || []).find((p) => p.id?.toString() === playerId?.toString())?.score || 0;

  return (
    <PageTransition>
      <Helmet><title>Game — {code}</title></Helmet>
      <div className="min-h-screen flex flex-col items-center px-4 py-4">
        {/* Status Bar */}
        <div className="w-full max-w-md flex items-center justify-between mb-4 text-sm">
          <span className="font-mono font-bold">{code}</span>
          <span className="text-canvas-text/50">Round {room.currentRound}/{room.settings?.totalRounds}</span>
          <span className="font-medium text-canvas-accent">
            <AnimatedCounter value={playerScore} suffix=" pts" />
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* Waiting Phase — Host starts round */}
          {phase === 'waiting' && (
            <motion.div
              key="waiting"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
            >
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
                  <AnimatedButton
                    onClick={handleStartRound}
                    className="w-full text-lg"
                  >
                    Start Round
                  </AnimatedButton>
                </div>
              ) : (
                <p className="text-canvas-text/50 text-lg">Waiting for host to start the round...</p>
              )}
            </motion.div>
          )}

          {/* Drawing Phase */}
          {phase === 'drawing' && (
            <motion.div
              key="drawing"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md"
            >
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
            </motion.div>
          )}

          {/* Discussion Phase */}
          {phase === 'discussion' && (
            <motion.div
              key="discussion"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center"
            >
              <MessageCircle className="w-10 h-10 text-canvas-accent" />
              <h2 className="text-2xl font-bold">Discussion Time!</h2>
              <CountdownRing seconds={discussionTimer} remaining={timer} />
              {aiAnalysis && (
                <div className="p-4 bg-canvas-card border border-canvas-border rounded-xl italic text-canvas-text/80">
                  "{aiAnalysis}"
                </div>
              )}
              <p className="text-canvas-text/50">Discuss who the Fake Artist might be. Voting starts when the timer ends.</p>
              <AnimatedButton
                onClick={() => setPhase('voting')}
                variant="secondary"
                className="mt-2"
              >
                Skip to Vote
              </AnimatedButton>
            </motion.div>
          )}

          {/* Voting Phase */}
          {phase === 'voting' && !voteResults && (
            <motion.div
              key="voting"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md"
            >
              <Vote className="w-10 h-10 text-canvas-accent" />
              <h2 className="text-2xl font-bold">Vote for the Fake Artist</h2>
              <div className="w-full space-y-2">
                {(room.players || []).map((player) => (
                  <AnimatedButton
                    key={player.id}
                    onClick={() => handleVoteClick(player.id)}
                    disabled={selectedVote !== null || player.id?.toString() === playerId?.toString()}
                    variant="secondary"
                    className={`w-full flex items-center gap-3 !px-4 !py-3 !rounded-xl !border-2 ${
                      selectedVote === player.id
                        ? '!border-canvas-accent !bg-canvas-accent/10'
                        : player.id?.toString() === playerId?.toString()
                          ? '!border-canvas-border/30 !opacity-40'
                          : '!border-canvas-border hover:!border-canvas-accent/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-canvas-accent/20 flex items-center justify-center text-sm font-bold capitalize">
                      {player.avatar?.[0] || player.username?.[0]}
                    </div>
                    <span className="font-medium">{player.username}</span>
                    {selectedVote === player.id && <span className="ml-auto text-canvas-accent font-bold">Voted</span>}
                  </AnimatedButton>
                ))}
              </div>
              {selectedVote && <p className="text-sm text-canvas-text/50">Waiting for all players to vote...</p>}
            </motion.div>
          )}

          {/* Redemption Phase */}
          {phase === 'redemption' && !redemptionResult && (
            <motion.div
              key="redemption"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center"
            >
              <h2 className="text-2xl font-bold">The Fake Artist was caught!</h2>
              <p className="text-canvas-text/60">
                <strong>{voteResults?.caughtPlayer?.username}</strong> got the most votes.
              </p>
              {isFakeArtist ? (
                <div className="w-full space-y-3">
                  <CountdownRing seconds={10} remaining={redemptionTimer} />
                  <p className="font-semibold text-lg text-red-500">Guess the word before time runs out!</p>
                  <input
                    type="text"
                    value={redemptionGuess}
                    onChange={(e) => setRedemptionGuess(e.target.value)}
                    placeholder="What was the word?"
                    className="w-full px-4 py-3 rounded-lg border border-canvas-border bg-canvas-bg text-center text-xl focus:outline-none focus:ring-2 focus:ring-canvas-accent/50"
                    autoFocus
                  />
                  <AnimatedButton
                    onClick={handleRedemption}
                    variant="danger"
                    className="w-full text-lg"
                  >
                    Submit Guess
                  </AnimatedButton>
                </div>
              ) : (
                <p className="text-canvas-text/50">Waiting for the Fake Artist to guess the word...</p>
              )}
            </motion.div>
          )}

          {/* Results Phase */}
          {phase === 'results' && (
            <motion.div
              key="results"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center"
            >
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
                        <span className="font-bold text-canvas-accent">
                          <AnimatedCounter value={player.score} suffix=" pts" />
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {isHost && (
                <AnimatedButton
                  onClick={handleNextRound}
                  className="w-full mt-4 text-lg"
                >
                  {room.currentRound >= room.settings?.totalRounds ? 'See Final Results' : 'Next Round'}
                </AnimatedButton>
              )}
            </motion.div>
          )}

          {/* Game Over */}
          {phase === 'gameover' && (
            <motion.div
              key="gameover"
              {...phaseTransition}
              className="flex-1 flex flex-col items-center gap-4 w-full max-w-md text-center"
            >
              <Trophy className="w-14 h-14 text-yellow-500" />
              <h2 className="text-3xl font-extrabold">Game Over!</h2>

              <div className="w-full mt-2">
                <h3 className="font-semibold mb-3 text-lg">Final Leaderboard</h3>
                <div className="space-y-2">
                  {(room.players || [])
                    .sort((a, b) => b.score - a.score)
                    .map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={i === 0 ? { scale: 0, rotate: -10 } : { opacity: 0, y: 20 }}
                        animate={i === 0 ? { scale: 1, rotate: 0 } : { opacity: 1, y: 0 }}
                        transition={i === 0 ? { type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 } : { delay: i * 0.1 }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                          i === 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-canvas-card border-canvas-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `#${i + 1}`}</span>
                          <span className="font-semibold">{player.username}</span>
                        </div>
                        <span className="font-bold text-xl text-canvas-accent">
                          <AnimatedCounter value={player.score} />
                        </span>
                      </motion.div>
                    ))}
                </div>
              </div>

              <AnimatedButton
                onClick={() => navigate('/play')}
                className="w-full mt-4 text-lg"
              >
                Back to Home
              </AnimatedButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vote Confirmation Modal */}
        <ConfirmModal
          isOpen={showVoteConfirm}
          onConfirm={handleVoteConfirm}
          onCancel={handleVoteCancel}
          title="Confirm Vote"
          message={`Are you sure you want to vote for ${pendingPlayer?.username || 'this player'}?`}
          confirmText="Vote"
          cancelText="Cancel"
        />
      </div>
    </PageTransition>
  );
}
