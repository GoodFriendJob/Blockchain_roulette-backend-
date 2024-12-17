const Affiliate = require("../models/Affiliate");
const User = require("../models/User");

// @desc Get all affiliate commissions for the authenticated user
exports.getUserCommissions = async (req, res) => {
  try {
    const commissions = await Affiliate.find({ user_id: req.user.id });
    res.status(200).json(commissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commissions" });
  }
};

// @desc Create a new affiliate commission
exports.createCommission = async (req, res) => {
  const {
    referred_by_user_id,
    campaign_id,
    campaign_name,
    commission_rate,
    status,
  } = req.body;

  try {
    const commission = new Affiliate({
      user_id: req.user.id,
      referred_by_user_id,
      campaign_id,
      campaign_name,
      commission_rate,
      status,
      commission_value: 0, // Initially set to 0; can be updated later
    });

    await commission.save();
    res.status(201).json(commission);
  } catch (error) {
    res.status(500).json({ error: "Failed to create commission" });
  }
};

// @desc Get all affiliate commissions (Admin only)
exports.getAllCommissions = async (req, res) => {
  try {
    const commissions = await Affiliate.find();
    res.status(200).json(commissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all commissions" });
  }
};
