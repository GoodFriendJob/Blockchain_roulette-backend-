const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// @route GET /chat
// @desc Get chat history
// @access Private
router.get("/", authMiddleware.authenticateJWT, chatController.getChatHistory);

// @route POST /chat
// @desc Post a new chat message
// @access Private
router.post("/", authMiddleware.authenticateJWT, chatController.postMessage);

// @route DELETE /chat/:messageId
// @desc Delete a chat message (Admin/Moderator only)
// @access Admin/Moderator
router.delete(
  "/:messageId",
  authMiddleware.authenticateJWT,
  roleMiddleware.checkRole(["admin", "moderator"]),
  chatController.deleteMessage
);

module.exports = router;
