const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingsSchema = new Schema({
  type: {
    type: String,
    enum: ["Games", "Transactions", "Rewards", "System"],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  variable: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Settings", settingsSchema);
