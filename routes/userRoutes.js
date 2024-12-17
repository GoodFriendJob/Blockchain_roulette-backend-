const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getUserLevels,
} = require("../controllers/userController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateJWT, getUserProfile);
router.put("/profile", authenticateJWT, updateUserProfile);
router.get("/levels", authenticateJWT, getUserLevels);

module.exports = router;
