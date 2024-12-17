const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["Cash", "Crypto", "Bonus", "Other"],
    required: true,
  },
  currency: {
    type: String,
    enum: ["USD", "BTC", "ETH", "Other"],
    required: true,
  },
  balance_before: { type: mongoose.Types.Decimal128, required: true },
  transaction_value: { type: mongoose.Types.Decimal128, required: true },
  balance_after: { type: mongoose.Types.Decimal128, required: true },
  method: {
    type: String,
    enum: ["Deposited", "Withdrawn", "Swapped", "Tipped", "Other"],
    required: true,
  },
  transaction_time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
