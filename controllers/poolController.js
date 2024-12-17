const Pool = require("../models/Pool");
const UserBalances = require("../models/UserBalances");

/**
 * Get all pools or filter by type
 */
exports.getPools = async (req, res) => {
  try {
    const { pool_type } = req.query; // Optional filter by pool type
    const pools = pool_type
      ? await Pool.find({ pool_type })
      : await Pool.find();
    res.status(200).json(pools);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pools" });
  }
};

/**
 * Stake into a specific pool
 */
exports.stakeIntoPool = async (req, res) => {
  try {
    const { userId, poolId, amount } = req.body;

    // Verify that the pool exists
    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ error: "Pool not found" });

    // Verify the user has enough gems to stake
    const userBalance = await UserBalances.findOne({ user_id: userId });
    if (userBalance.stake_pool_balance < amount) {
      return res.status(400).json({ error: "Insufficient stake pool balance" });
    }

    // Deduct balance from user and increase pool staked amount
    userBalance.stake_pool_balance -= amount;
    pool.staked += amount;
    await userBalance.save();
    await pool.save();

    res.status(200).json({ message: "Successfully staked into pool", pool });
  } catch (error) {
    res.status(500).json({ error: "Failed to stake into pool" });
  }
};

/**
 * Distribute rewards to users based on the pool's reward percentage
 */
exports.distributeRewards = async (req, res) => {
  try {
    const { poolId } = req.params;

    const pool = await Pool.findById(poolId);
    if (!pool) return res.status(404).json({ error: "Pool not found" });

    const rewardAmount = (pool.reward_percentage / 100) * pool.staked;

    // Example logic: distribute the reward equally among all stakers
    const stakers = await UserBalances.find({ stake_pool_balance: { $gt: 0 } });
    const rewardPerUser = rewardAmount / stakers.length;

    const distributionPromises = stakers.map(async (staker) => {
      staker.stake_pool_balance += rewardPerUser;
      return staker.save();
    });

    await Promise.all(distributionPromises);

    res.status(200).json({ message: "Rewards distributed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to distribute rewards" });
  }
};

/**
 * Update pool settings like multiplier, max reward, or distribution time
 */
exports.updatePool = async (req, res) => {
  try {
    const { poolId } = req.params;
    const updatedPool = await Pool.findByIdAndUpdate(poolId, req.body, {
      new: true,
    });
    if (!updatedPool) return res.status(404).json({ error: "Pool not found" });

    res.status(200).json(updatedPool);
  } catch (error) {
    res.status(500).json({ error: "Failed to update pool settings" });
  }
};
