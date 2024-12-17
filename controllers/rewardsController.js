const UserRewards = require("../models/UserRewards");

// Get User Rewards
exports.getUserRewards = async (req, res) => {
  try {
    const rewards = await UserRewards.findOne({ user_id: req.user.id });
    if (!rewards) return res.status(404).json({ error: "No rewards found." });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Claim Rewards
exports.claimRewards = async (req, res) => {
  try {
    const rewards = await UserRewards.findOne({ user_id: req.user.id });

    if (!rewards || rewards.claimed) {
      return res
        .status(400)
        .json({ error: "No rewards to claim or already claimed." });
    }

    rewards.claimed = rewards.claimed + 1;
    rewards.claimed_value += rewards.received_value;
    await rewards.save();

    res.json({ message: "Rewards claimed successfully.", rewards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWagerRequirement = async (req, res) => {
  const { wager_amount } = req.body;
  try {
    const rewards = await UserRewards.findOne({ user_id: req.user.id });

    if (!rewards)
      return res.status(404).json({ error: "User rewards not found." });

    rewards.wager_requirement_left -= wager_amount;
    await rewards.save();

    res.json({ message: "Wager requirement updated.", rewards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
