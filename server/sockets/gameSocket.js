const gameService = require('../services/gameService');
const logger = require('../utils/logger');

const playerRooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('create-room', async ({ username, avatar, photoUrl }, callback) => {
      try {
        const player = { socketId: socket.id, username, avatar, photoUrl };
        const room = await gameService.createRoom(player);
        socket.join(room.code);
        playerRooms.set(socket.id, room.code);
        callback({ success: true, room: sanitizeRoom(room), playerId: room.players[0]._id });
      } catch (error) {
        logger.error('create-room error:', error);
        callback({ success: false, message: 'Failed to create room' });
      }
    });

    socket.on('join-room', async ({ code, username, avatar, photoUrl }, callback) => {
      try {
        const player = { socketId: socket.id, username, avatar, photoUrl };
        const result = await gameService.joinRoom(code, player);
        if (result.error) return callback({ success: false, message: result.error });

        socket.join(code.toUpperCase());
        playerRooms.set(socket.id, code.toUpperCase());

        const newPlayer = result.room.players.find((p) => p.socketId === socket.id);
        io.to(code.toUpperCase()).emit('player-joined', {
          room: sanitizeRoom(result.room),
          newPlayer: sanitizePlayer(newPlayer),
        });
        callback({ success: true, room: sanitizeRoom(result.room), playerId: newPlayer._id });
      } catch (error) {
        logger.error('join-room error:', error);
        callback({ success: false, message: 'Failed to join room' });
      }
    });

    socket.on('start-game', async ({ code }, callback) => {
      try {
        const result = await gameService.startGame(code);
        if (result.error) return callback({ success: false, message: result.error });

        io.to(code).emit('game-started', { room: sanitizeRoom(result.room) });
        callback({ success: true });
      } catch (error) {
        logger.error('start-game error:', error);
        callback({ success: false, message: 'Failed to start game' });
      }
    });

    socket.on('start-round', async ({ code, customWord }, callback) => {
      try {
        const result = await gameService.startRound(code, customWord);
        if (result.error) return callback({ success: false, message: result.error });

        if (result.gameOver) {
          io.to(code).emit('game-over', { room: sanitizeRoom(result.room) });
          return callback({ success: true, gameOver: true });
        }

        result.room.players.forEach((player) => {
          const isFakeArtist = player._id.toString() === result.fakeArtistId.toString();
          io.to(player.socketId).emit('round-started', {
            roundNumber: result.round.roundNumber,
            category: result.round.category,
            word: isFakeArtist ? null : result.word,
            isFakeArtist,
            turnOrder: result.room.players.map((p) => ({ id: p._id, username: p.username })),
            currentTurnIndex: 0,
          });
        });

        callback({ success: true });
      } catch (error) {
        logger.error('start-round error:', error);
        callback({ success: false, message: 'Failed to start round' });
      }
    });

    socket.on('draw-stroke', async ({ code, playerId, stroke }, callback) => {
      try {
        io.to(code).emit('stroke-drawn', { playerId, stroke });

        const result = await gameService.addStroke(code, playerId, stroke);
        if (result.error) return callback?.({ success: false, message: result.error });

        const currentRound = result.room.rounds[result.room.rounds.length - 1];

        if (currentRound.status === 'discussion') {
          io.to(code).emit('discussion-phase', {
            room: sanitizeRoom(result.room),
            aiAnalysis: currentRound.aiAnalysis,
            timer: result.room.settings.discussionTimer,
          });
        } else {
          io.to(code).emit('next-turn', {
            currentTurnIndex: result.nextTurnIndex,
            drawingRound: result.drawingRound,
          });
        }

        callback?.({ success: true });
      } catch (error) {
        logger.error('draw-stroke error:', error);
        callback?.({ success: false, message: 'Failed to save stroke' });
      }
    });

    socket.on('submit-vote', async ({ code, voterId, suspectId }, callback) => {
      try {
        const result = await gameService.submitVote(code, voterId, suspectId);
        if (result.error) return callback({ success: false, message: result.error });

        io.to(code).emit('vote-submitted', { voterId, totalVotes: result.currentRound.votes.size });

        if (result.allVoted) {
          const round = result.currentRound;
          const caughtPlayer = result.room.players.find(
            (p) => p._id.toString() === round.caughtPlayerId.toString()
          );
          const isFakeArtist = round.caughtPlayerId.toString() === round.fakeArtistId.toString();

          io.to(code).emit('vote-results', {
            votes: Object.fromEntries(round.votes),
            caughtPlayer: sanitizePlayer(caughtPlayer),
            isFakeArtist,
            needsRedemption: isFakeArtist,
          });
        }

        callback({ success: true });
      } catch (error) {
        logger.error('submit-vote error:', error);
        callback({ success: false, message: 'Failed to submit vote' });
      }
    });

    socket.on('redemption-guess', async ({ code, guess }, callback) => {
      try {
        const result = await gameService.submitRedemptionGuess(code, guess);
        if (result.error) return callback({ success: false, message: result.error });

        io.to(code).emit('redemption-result', {
          guess,
          isCorrect: result.isCorrect,
          word: result.currentRound.word,
          room: sanitizeRoom(result.room),
        });

        callback({ success: true });
      } catch (error) {
        logger.error('redemption-guess error:', error);
        callback({ success: false, message: 'Failed to submit guess' });
      }
    });

    socket.on('kick-player', async ({ code, playerId }, callback) => {
      try {
        const room = await require('../models/Room').findOne({ code });
        if (!room) return callback({ success: false, message: 'Room not found' });

        const player = room.players.find((p) => p._id.toString() === playerId);
        if (!player) return callback({ success: false, message: 'Player not found' });

        io.to(player.socketId).emit('kicked');
        const result = await gameService.removePlayer(code, player.socketId);

        if (!result.disbanded) {
          io.to(code).emit('player-left', { room: sanitizeRoom(result.room), kickedPlayer: sanitizePlayer(result.removedPlayer) });
        }
        callback({ success: true });
      } catch (error) {
        logger.error('kick-player error:', error);
        callback({ success: false, message: 'Failed to kick player' });
      }
    });

    socket.on('transfer-host', async ({ code, newHostId }, callback) => {
      try {
        const result = await gameService.transferHost(code, newHostId);
        if (result.error) return callback({ success: false, message: result.error });
        io.to(code).emit('host-transferred', { room: sanitizeRoom(result.room) });
        callback({ success: true });
      } catch (error) {
        logger.error('transfer-host error:', error);
        callback({ success: false, message: 'Failed to transfer host' });
      }
    });

    socket.on('update-settings', async ({ code, settings }, callback) => {
      try {
        const result = await gameService.updateSettings(code, settings);
        if (result.error) return callback({ success: false, message: result.error });
        io.to(code).emit('settings-updated', { settings: result.room.settings });
        callback({ success: true });
      } catch (error) {
        logger.error('update-settings error:', error);
        callback({ success: false, message: 'Failed to update settings' });
      }
    });

    socket.on('pause-game', ({ code }) => {
      io.to(code).emit('game-paused');
    });

    socket.on('resume-game', ({ code }) => {
      io.to(code).emit('game-resumed');
    });

    socket.on('disconnect', async () => {
      const code = playerRooms.get(socket.id);
      if (!code) return;

      playerRooms.delete(socket.id);
      const result = await gameService.removePlayer(code, socket.id);
      if (result && !result.disbanded) {
        io.to(code).emit('player-left', { room: sanitizeRoom(result.room), leftPlayer: sanitizePlayer(result.removedPlayer) });
      }
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
};

const sanitizeRoom = (room) => ({
  code: room.code,
  players: room.players.map(sanitizePlayer),
  settings: room.settings,
  status: room.status,
  currentRound: room.currentRound,
  currentTurnIndex: room.currentTurnIndex,
  currentDrawingRound: room.currentDrawingRound,
  rounds: room.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    category: r.category,
    status: r.status,
    strokes: r.strokes,
    aiAnalysis: r.aiAnalysis,
    caughtPlayerId: r.caughtPlayerId,
    redemptionCorrect: r.redemptionCorrect,
  })),
});

const sanitizePlayer = (player) => ({
  id: player._id,
  username: player.username,
  avatar: player.avatar,
  photoUrl: player.photoUrl,
  score: player.score,
  isHost: player.isHost,
  isConnected: player.isConnected,
});
