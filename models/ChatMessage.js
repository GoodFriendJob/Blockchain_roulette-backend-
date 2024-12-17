const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  user_id: {
    type: Schema.Types.UUID,
    ref: "User",
    required: true,
  },
  message_content: {
    type: String,
    required: true,
  },
  message_thread_id: {
    type: Schema.Types.UUID,
    ref: "ChatMessage", // Self-referencing for threading
    required: false,
  },
  message_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
