const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  user_level: { type: Number, default: 1 },
  online_status: { type: Boolean, default: false },
  registered_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
