const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Route to play the game
router.post('/play', authenticateJWT, async (req, res) => {
  try {
    const { betAmount, gameType = "RR (Solo)" } = req.body;
    const userId = req.user.id; 

    const gameResult = await GameController.playGame(userId, betAmount, gameType);
    res.json(gameResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get player statistics
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const stats = await GameController.getGameStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get active group game status
router.get('/group-status', authenticateJWT, async (req, res) => {
  try {
    const status = await GameController.getGroupGameStatus();
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get group game results
router.get('/group-results/:gameId', authenticateJWT, async (req, res) => {
  try {
    const results = await GameController.getGroupGameResults(req.params.gameId, req.user.id);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
