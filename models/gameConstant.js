const mongoose = require("mongoose");

const gameConstantSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const GameConstant = mongoose.model("GameConstant", gameConstantSchema);

module.exports = GameConstant; 