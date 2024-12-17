const mongoose = require("mongoose");
const { Schema } = mongoose;

const userPermissionsSchema = new Schema({
  user_id: {
    type: Schema.Types.UUID,
    ref: "User",
    required: true,
  },
  permission_type: {
    type: String,
    enum: ["DEPOSIT", "WITHDRAWAL", "TIP", "SWAP"],
    required: true,
  },
  permission_status: {
    type: String,
    enum: ["ACTIVE", "BANNED"],
    default: "ACTIVE",
  },
});

module.exports = mongoose.model("UserPermissions", userPermissionsSchema);
