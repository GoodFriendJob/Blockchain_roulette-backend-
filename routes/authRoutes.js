const express = require("express");
const {
  register,
  login,
  googleOAuth,
} = require("../controllers/authController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/oauth/google", googleOAuth);

// Protected route example
router.get("/profile", authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
