const express = require("express");
const router = express.Router();
const { WagerController, addSecurityHeaders } = require("../controllers/wagerController");
const { authenticateJWT } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");

// Apply security headers to all routes
router.use(addSecurityHeaders);

// Get user's wagers
router.get("/user", authenticateJWT, async (req, res) => {
  try {
    const result = await WagerController.getUserWagers(req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new wager
router.post("/create", authenticateJWT, async (req, res) => {
  try {
    const result = await WagerController.createWager(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all wagers (admin only)
router.get("/all", authenticateJWT, checkRole(["ADMIN"]), async (req, res) => {
  try {
    const wagers = await WagerController.getAllWagers();
    res.json(wagers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get RTP statistics (admin only)
router.get("/stats/rtp", authenticateJWT, checkRole(["ADMIN"]), async (req, res) => {
  try {
    const stats = await WagerController.getRTPStats(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;