const mongoose = require("mongoose");
const { Schema } = mongoose;

const wagerSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  game_name: {
    type: String,
    enum: ["RR (Solo)", "RR (Group)", "Other"],
    required: true,
  },
  game_id: {
    type: String,
    required: true,
  },
  balance_before: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  wager_amount: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  target: {
    type: Schema.Types.Decimal128, 
    required: true,
  },
  won_amount: {
    type: Schema.Types.Decimal128,
    default: 0,
  },
  currency: {
    type: String,
    enum: ["USD", "BTC", "ETH"],
    required: true,
  },
  wager_time: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending',
    required: true
  }
});

// Virtual getters for calculated fields
wagerSchema.virtual('rtp').get(function() {
  const wagerAmount = parseFloat(this.wager_amount.toString());
  const wonAmount = parseFloat(this.won_amount.toString());
  return wagerAmount > 0 ? (wonAmount / wagerAmount) * 100 : 0;
});

wagerSchema.virtual('site_profit').get(function() {
  const wagerAmount = parseFloat(this.wager_amount.toString());
  const wonAmount = parseFloat(this.won_amount.toString());
  return wagerAmount - wonAmount;
});

// Configure virtuals to be included in JSON output
wagerSchema.set('toJSON', { virtuals: true });
wagerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Wager", wagerSchema);
