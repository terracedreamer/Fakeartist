const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  username: { type: String, required: true, maxlength: 20 },
  avatar: { type: String, default: 'default' },
  photoUrl: { type: String, default: null },
  score: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
}, { _id: true });

const strokeSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  points: [{ x: Number, y: Number }],
  color: { type: String, default: '#000000' },
  brushSize: { type: Number, default: 4 },
  round: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  word: { type: String, default: null },
  wordSource: { type: String, enum: ['ai', 'custom'], default: 'ai' },
  category: { type: String, default: null },
  fakeArtistId: { type: mongoose.Schema.Types.ObjectId, default: null },
  strokes: [strokeSchema],
  votes: { type: Map, of: String, default: new Map() },
  caughtPlayerId: { type: mongoose.Schema.Types.ObjectId, default: null },
  redemptionGuess: { type: String, default: null },
  redemptionCorrect: { type: Boolean, default: null },
  aiAnalysis: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'drawing', 'discussion', 'voting', 'redemption', 'results', 'complete'],
    default: 'pending',
  },
}, { _id: true });

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, length: 6 },
  players: [playerSchema],
  rounds: [roundSchema],
  settings: {
    totalRounds: { type: Number, default: 3, min: 1, max: 10 },
    drawingRoundsPerTurn: { type: Number, default: 2, min: 1, max: 5 },
    discussionTimer: { type: Number, default: 60, min: 15, max: 300 },
    theme: {
      type: String,
      enum: ['dark-artsy', 'bright-playful', 'clean-minimal', 'retro-sketchbook'],
      default: 'clean-minimal',
    },
    aiAnalysis: { type: Boolean, default: true },
  },
  currentRound: { type: Number, default: 0 },
  currentTurnIndex: { type: Number, default: 0 },
  currentDrawingRound: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['lobby', 'playing', 'round-end', 'game-over'],
    default: 'lobby',
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
}, { timestamps: true });

roomSchema.index({ code: 1 });
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', roomSchema);
