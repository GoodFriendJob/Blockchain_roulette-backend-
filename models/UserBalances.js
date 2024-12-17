const mongoose = require("mongoose");

const userBalancesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cash_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
  crypto_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
  bonus_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
  stake_pool_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
  wager_pool_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
  affiliate_pool_balance: { type: mongoose.Types.Decimal128, default: 0.0 },
});

module.exports = mongoose.model("UserBalances", userBalancesSchema);
