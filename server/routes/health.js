const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

router.get('/metrics', async (req, res) => {
  const Room = require('../models/Room');
  const activeRooms = await Room.countDocuments();
  res.json({
    success: true,
    activeRooms,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

module.exports = router;
