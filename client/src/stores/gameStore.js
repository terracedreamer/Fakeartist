import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Connection
  connected: false,
  setConnected: (connected) => set({ connected }),

  // Player identity
  playerId: null,
  username: '',
  avatar: 'default',
  photoUrl: null,
  setPlayer: ({ playerId, username, avatar, photoUrl }) =>
    set({ playerId, username, avatar, photoUrl }),

  // Room
  room: null,
  setRoom: (room) => set({ room }),

  // Round state
  currentWord: null,
  isFakeArtist: false,
  category: null,
  turnOrder: [],
  currentTurnIndex: 0,
  drawingRound: 1,

  setRoundInfo: ({ word, isFakeArtist, category, turnOrder, currentTurnIndex }) =>
    set({
      currentWord: word,
      isFakeArtist,
      category,
      turnOrder,
      currentTurnIndex,
      drawingRound: 1,
    }),

  setTurn: ({ currentTurnIndex, drawingRound }) =>
    set({ currentTurnIndex, drawingRound }),

  // Discussion / Voting
  aiAnalysis: null,
  discussionTimer: 60,
  votes: {},
  voteResults: null,

  setDiscussion: ({ aiAnalysis, timer }) =>
    set({ aiAnalysis, discussionTimer: timer }),

  setVoteResults: (results) => set({ voteResults: results }),

  // Redemption
  redemptionResult: null,
  setRedemptionResult: (result) => set({ redemptionResult: result }),

  // Strokes (for canvas)
  strokes: [],
  addStroke: (stroke) => set((s) => ({ strokes: [...s.strokes, stroke] })),
  clearStrokes: () => set({ strokes: [] }),

  // Game over
  gameOver: false,
  setGameOver: (gameOver) => set({ gameOver }),

  // Reset for new round
  resetRound: () =>
    set({
      currentWord: null,
      isFakeArtist: false,
      category: null,
      currentTurnIndex: 0,
      drawingRound: 1,
      aiAnalysis: null,
      votes: {},
      voteResults: null,
      redemptionResult: null,
      strokes: [],
    }),

  // Full reset
  resetGame: () =>
    set({
      room: null,
      playerId: null,
      username: '',
      avatar: 'default',
      photoUrl: null,
      currentWord: null,
      isFakeArtist: false,
      category: null,
      turnOrder: [],
      currentTurnIndex: 0,
      drawingRound: 1,
      aiAnalysis: null,
      discussionTimer: 60,
      votes: {},
      voteResults: null,
      redemptionResult: null,
      strokes: [],
      gameOver: false,
    }),
}));

export default useGameStore;
