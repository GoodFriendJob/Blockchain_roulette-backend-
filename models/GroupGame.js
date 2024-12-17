const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupGameSchema = new Schema({
  game_id: {
    type: String,
    required: true,
    unique: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  result: {
    type: Schema.Types.Mixed,
    default: null
  }
});

module.exports = mongoose.model("GroupGame", groupGameSchema); 