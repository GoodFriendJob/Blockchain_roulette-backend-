const UserBalances = require("../models/UserBalances");

// Get User Balances
exports.getUserBalances = async (req, res) => {
  try {
    const balances = await UserBalances.findOne({ user_id: req.user.id });
    if (!balances)
      return res.status(404).json({ error: "Balances not found." });
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deposit to Cash Balance
exports.depositCash = async (req, res) => {
  const { amount } = req.body;
  try {
    const balances = await UserBalances.findOneAndUpdate(
      { user_id: req.user.id },
      { $inc: { cash_balance: amount } },
      { new: true, upsert: true }
    );
    res.json({ message: "Cash balance updated.", balances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Withdraw from Crypto Balance
exports.withdrawCrypto = async (req, res) => {
  const { amount } = req.body;
  try {
    const balances = await UserBalances.findOne({ user_id: req.user.id });

    if (!balances || balances.crypto_balance < amount) {
      return res.status(400).json({ error: "Insufficient crypto balance." });
    }

    balances.crypto_balance -= amount;
    await balances.save();

    res.json({ message: "Withdrawal successful.", balances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transfer Bonus to Stake Pool
exports.transferBonusToStakePool = async (req, res) => {
  const { amount } = req.body;
  try {
    const balances = await UserBalances.findOne({ user_id: req.user.id });

    if (balances.bonus_balance < amount) {
      return res.status(400).json({ error: "Insufficient bonus balance." });
    }

    balances.bonus_balance -= amount;
    balances.stake_pool_balance += amount;
    await balances.save();

    res.json({ message: "Bonus transferred to stake pool.", balances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
