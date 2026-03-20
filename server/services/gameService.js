const Room = require('../models/Room');
const { generateWord, generatePostRoundAnalysis } = require('./aiService');
const logger = require('../utils/logger');

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createRoom = async (hostPlayer) => {
  let code;
  let exists = true;
  while (exists) {
    code = generateRoomCode();
    exists = await Room.findOne({ code });
  }

  const room = new Room({
    code,
    players: [{ ...hostPlayer, isHost: true }],
    status: 'lobby',
  });

  await room.save();
  logger.info(`Room ${code} created by ${hostPlayer.username}`);
  return room;
};

const joinRoom = async (code, player) => {
  const room = await Room.findOne({ code: code.toUpperCase() });
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'lobby') return { error: 'Game already in progress' };
  if (room.players.length >= 16) return { error: 'Room is full (max 16 players)' };
  if (room.players.some((p) => p.username === player.username)) {
    return { error: 'Username already taken in this room' };
  }

  room.players.push(player);
  await room.save();
  logger.info(`${player.username} joined room ${code}`);
  return { room };
};

const removePlayer = async (code, socketId) => {
  const room = await Room.findOne({ code });
  if (!room) return null;

  const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
  if (playerIndex === -1) return null;

  const player = room.players[playerIndex];
  room.players.splice(playerIndex, 1);

  if (room.players.length === 0) {
    await Room.deleteOne({ code });
    logger.info(`Room ${code} deleted (empty)`);
    return { room: null, removedPlayer: player, disbanded: true };
  }

  if (player.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    logger.info(`Host transferred to ${room.players[0].username} in room ${code}`);
  }

  await room.save();
  return { room, removedPlayer: player, disbanded: false };
};

const startGame = async (code) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };
  if (room.players.length < 3) return { error: 'Need at least 3 players to start' };
  if (room.status !== 'lobby' && room.status !== 'game-over') {
    return { error: 'Game already in progress' };
  }

  room.status = 'playing';
  room.currentRound = 0;
  room.rounds = [];

  await room.save();
  return { room };
};

const startRound = async (code, customWord = null) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };

  const roundNumber = room.currentRound + 1;
  if (roundNumber > room.settings.totalRounds) {
    room.status = 'game-over';
    await room.save();
    return { room, gameOver: true };
  }

  const fakeArtistIndex = Math.floor(Math.random() * room.players.length);
  const fakeArtist = room.players[fakeArtistIndex];

  let wordData;
  if (customWord) {
    wordData = { word: customWord.toLowerCase(), category: 'custom', source: 'custom' };
  } else {
    wordData = await generateWord();
  }

  const round = {
    roundNumber,
    word: wordData.word,
    wordSource: wordData.source === 'custom' ? 'custom' : 'ai',
    category: wordData.category,
    fakeArtistId: fakeArtist._id,
    strokes: [],
    votes: new Map(),
    status: 'drawing',
  };

  room.rounds.push(round);
  room.currentRound = roundNumber;
  room.currentTurnIndex = 0;
  room.currentDrawingRound = 1;
  await room.save();

  logger.info(`Round ${roundNumber} started in room ${code} — word: "${wordData.word}", fake artist: ${fakeArtist.username}`);
  return { room, round: room.rounds[room.rounds.length - 1], fakeArtistId: fakeArtist._id, word: wordData.word };
};

const addStroke = async (code, playerId, strokeData) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };

  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound || currentRound.status !== 'drawing') {
    return { error: 'Not in drawing phase' };
  }

  currentRound.strokes.push({
    playerId,
    points: strokeData.points,
    color: strokeData.color,
    brushSize: strokeData.brushSize,
    round: room.currentDrawingRound,
  });

  room.currentTurnIndex++;

  if (room.currentTurnIndex >= room.players.length) {
    room.currentTurnIndex = 0;
    room.currentDrawingRound++;

    if (room.currentDrawingRound > room.settings.drawingRoundsPerTurn) {
      currentRound.status = 'discussion';

      if (room.settings.aiAnalysis) {
        const analysis = await generatePostRoundAnalysis(
          currentRound.strokes,
          room.players,
          currentRound.word,
          currentRound.fakeArtistId
        );
        if (analysis) {
          currentRound.aiAnalysis = analysis;
        }
      }
    }
  }

  await room.save();
  return { room, nextTurnIndex: room.currentTurnIndex, drawingRound: room.currentDrawingRound };
};

const submitVote = async (code, voterId, suspectId) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };

  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound || (currentRound.status !== 'discussion' && currentRound.status !== 'voting')) {
    return { error: 'Not in voting phase' };
  }

  currentRound.status = 'voting';
  currentRound.votes.set(voterId.toString(), suspectId.toString());

  const allVoted = room.players.every((p) =>
    currentRound.votes.has(p._id.toString())
  );

  if (allVoted) {
    const voteCounts = {};
    for (const [, suspect] of currentRound.votes) {
      voteCounts[suspect] = (voteCounts[suspect] || 0) + 1;
    }

    const maxVotes = Math.max(...Object.values(voteCounts));
    const caughtId = Object.keys(voteCounts).find((id) => voteCounts[id] === maxVotes);
    currentRound.caughtPlayerId = caughtId;

    const isFakeArtist = caughtId === currentRound.fakeArtistId.toString();
    if (isFakeArtist) {
      currentRound.status = 'redemption';
    } else {
      currentRound.status = 'results';
      applyScores(room, currentRound, false, false);
    }
  }

  await room.save();
  return { room, allVoted, currentRound };
};

const submitRedemptionGuess = async (code, guess) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };

  const currentRound = room.rounds[room.rounds.length - 1];
  if (!currentRound || currentRound.status !== 'redemption') {
    return { error: 'Not in redemption phase' };
  }

  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedWord = currentRound.word.toLowerCase().trim();
  const isCorrect = normalizedGuess === normalizedWord;

  currentRound.redemptionGuess = guess;
  currentRound.redemptionCorrect = isCorrect;
  currentRound.status = 'results';

  applyScores(room, currentRound, true, isCorrect);

  await room.save();
  logger.info(`Redemption in room ${code}: "${guess}" — ${isCorrect ? 'CORRECT' : 'WRONG'}`);
  return { room, isCorrect, currentRound };
};

const applyScores = (room, round, fakeArtistCaught, redemptionCorrect) => {
  const fakeArtistId = round.fakeArtistId.toString();

  if (!fakeArtistCaught) {
    const fakeArtist = room.players.find((p) => p._id.toString() === fakeArtistId);
    if (fakeArtist) fakeArtist.score += 3;
    return;
  }

  if (redemptionCorrect) {
    const fakeArtist = room.players.find((p) => p._id.toString() === fakeArtistId);
    if (fakeArtist) fakeArtist.score += 2;
    return;
  }

  for (const [voterId, suspectId] of round.votes) {
    if (suspectId === fakeArtistId) {
      const voter = room.players.find((p) => p._id.toString() === voterId);
      if (voter) voter.score += 1;
    } else {
      const voter = room.players.find((p) => p._id.toString() === voterId);
      if (voter && voter._id.toString() !== fakeArtistId) voter.score -= 1;
    }
  }
};

const transferHost = async (code, newHostId) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };

  room.players.forEach((p) => { p.isHost = false; });
  const newHost = room.players.find((p) => p._id.toString() === newHostId);
  if (!newHost) return { error: 'Player not found' };

  newHost.isHost = true;
  await room.save();
  return { room };
};

const updateSettings = async (code, settings) => {
  const room = await Room.findOne({ code });
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'lobby') return { error: 'Cannot change settings during game' };

  Object.assign(room.settings, settings);
  await room.save();
  return { room };
};

module.exports = {
  createRoom,
  joinRoom,
  removePlayer,
  startGame,
  startRound,
  addStroke,
  submitVote,
  submitRedemptionGuess,
  transferHost,
  updateSettings,
};
