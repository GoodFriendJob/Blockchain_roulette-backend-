const ChatMessage = require("../models/ChatMessage");

// @desc Get all chat messages
exports.getChatHistory = async (req, res) => {
  try {
    const messages = await ChatMessage.find().populate("user_id", "username");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
};

// @desc Post a new chat message
exports.postMessage = async (req, res) => {
  const { message_content, message_thread_id } = req.body;

  try {
    const newMessage = new ChatMessage({
      user_id: req.user.id,
      message_content,
      message_thread_id,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to post message" });
  }
};

// @desc Delete a chat message (Admin/Moderator only)
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    await message.remove();
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
};
