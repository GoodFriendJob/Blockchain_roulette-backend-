const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  username: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  totalBaseWins: { type: Number, default: 0 },
  totalBonusWins: { type: Number, default: 0 },
  totalBaseWinAmount: { type: Number, default: 0 },
  totalBonusWinAmount: { type: Number, default: 0 },
  totalBetAmount: { type: Number, default: 0 },
  bonusesTriggered: { type: Number, default: 0 },
  bonusRetriggersCount: { type: Number, default: 0 },
  gameHistory: [{
    serverSeed: String,
    clientSeed: String,
    nonce: Number,
    betAmount: Number,
    winAmount: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model("Player", playerSchema);
