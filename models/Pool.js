const mongoose = require("mongoose");
const { Schema } = mongoose;

const poolSchema = new Schema({
  pool_type: {
    type: String,
    enum: ["Stake", "Wager", "Affiliate"],
    required: true,
  },
  staked: {
    type: Schema.Types.Decimal128,
    default: 0.0,
  },
  multiplier: {
    type: Number,
    default: 1.0,
  },
  max_reward: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  reward: {
    type: Schema.Types.Decimal128,
    default: 0.0,
  },
  reward_percentage: {
    type: Number,
    default: 0,
  },
  distribution_percentage: {
    type: Number,
    default: 0,
  },
  distribution_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Pool", poolSchema);
