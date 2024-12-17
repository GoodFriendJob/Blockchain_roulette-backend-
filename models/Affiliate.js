const mongoose = require("mongoose");
const { Schema } = mongoose;

const affiliateSchema = new Schema({
  user_id: {
    type: Schema.Types.UUID,
    ref: "User",
    required: true,
  },
  referred_by_user_id: {
    type: Schema.Types.UUID,
    ref: "User",
    required: false, // Nullable for users who weren't referred
  },
  campaign_id: {
    type: String,
    required: true,
  },
  campaign_name: {
    type: String,
    required: true,
  },
  commission_rate: {
    type: Schema.Types.Decimal128,
    required: true,
  },
  status: {
    type: String,
    enum: ["FTD", "Referral"],
    required: true,
  },
  commission_value: {
    type: Schema.Types.Decimal128,
    default: 0, // Nullable for non-monetary rewards
  },
  commission_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Affiliate", affiliateSchema);
