import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import useGameStore from '../stores/gameStore';

const useSocket = () => {
  const navigate = useNavigate();
  const {
    setConnected,
    setRoom,
    setRoundInfo,
    setTurn,
    setDiscussion,
    addStroke,
    setVoteResults,
    setRedemptionResult,
    setGameOver,
    resetRound,
    resetGame,
    clearStrokes,
  } = useGameStore();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('player-joined', ({ room }) => setRoom(room));
    socket.on('player-left', ({ room }) => setRoom(room));

    socket.on('game-started', ({ room }) => {
      setRoom(room);
      resetRound();
      clearStrokes();
      navigate(`/game/${room.code}`);
    });

    socket.on('round-started', (data) => {
      clearStrokes();
      setRoundInfo({
        word: data.word,
        isFakeArtist: data.isFakeArtist,
        category: data.category,
        turnOrder: data.turnOrder,
        currentTurnIndex: data.currentTurnIndex,
      });
    });

    socket.on('stroke-drawn', ({ playerId, stroke }) => {
      addStroke({ playerId, ...stroke });
    });

    socket.on('next-turn', ({ currentTurnIndex, drawingRound }) => {
      setTurn({ currentTurnIndex, drawingRound });
    });

    socket.on('discussion-phase', ({ room, aiAnalysis, timer }) => {
      setRoom(room);
      setDiscussion({ aiAnalysis, timer });
    });

    socket.on('vote-submitted', () => {});

    socket.on('vote-results', (results) => {
      setVoteResults(results);
    });

    socket.on('redemption-result', ({ guess, isCorrect, word, room }) => {
      setRedemptionResult({ guess, isCorrect, word });
      setRoom(room);
    });

    socket.on('game-over', ({ room }) => {
      setRoom(room);
      setGameOver(true);
    });

    socket.on('settings-updated', ({ settings }) => {
      useGameStore.setState((state) => ({
        room: state.room ? { ...state.room, settings } : null,
      }));
    });

    socket.on('host-transferred', ({ room }) => setRoom(room));

    socket.on('kicked', () => {
      resetGame();
      navigate('/');
    });

    socket.on('game-paused', () => {
      useGameStore.setState({ paused: true });
    });

    socket.on('game-resumed', () => {
      useGameStore.setState({ paused: false });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('round-started');
      socket.off('stroke-drawn');
      socket.off('next-turn');
      socket.off('discussion-phase');
      socket.off('vote-submitted');
      socket.off('vote-results');
      socket.off('redemption-result');
      socket.off('game-over');
      socket.off('settings-updated');
      socket.off('host-transferred');
      socket.off('kicked');
      socket.off('game-paused');
      socket.off('game-resumed');
    };
  }, []);
};

export default useSocket;
