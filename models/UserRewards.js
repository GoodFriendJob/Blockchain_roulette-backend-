const mongoose = require("mongoose");

const userRewardsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deposited_amount: { type: mongoose.Types.Decimal128, default: 0.0 },
  free_spins: { type: Number, default: 0 },
  claimed: { type: Number, default: 0 },
  cashed: { type: Number, default: 0 },
  received_value: { type: mongoose.Types.Decimal128, default: 0.0 },
  claimed_value: { type: mongoose.Types.Decimal128, default: 0.0 },
  cashed_value: { type: mongoose.Types.Decimal128, default: 0.0 },
  forfeited: { type: Number, default: 0 },
  forfeited_value: { type: mongoose.Types.Decimal128, default: 0.0 },
  wager_requirement_left: { type: mongoose.Types.Decimal128, default: 0.0 },
});

module.exports = mongoose.model("UserRewards", userRewardsSchema);
