const Transaction = require("../models/Transaction");
const UserBalances = require("../models/UserBalances");

// Get Transactions for a User
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user.id }).sort({
      transaction_time: -1,
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a New Transaction
exports.createTransaction = async (req, res) => {
  const { type, currency, transaction_value, method } = req.body;

  try {
    const userBalances = await UserBalances.findOne({ user_id: req.user.id });

    if (!userBalances)
      return res.status(404).json({ error: "User balances not found." });

    const balanceBefore = userBalances.cash_balance;
    let balanceAfter;

    // Update User Balance Based on Transaction Type
    switch (type) {
      case "Cash":
        balanceAfter = balanceBefore + parseFloat(transaction_value);
        userBalances.cash_balance = balanceAfter;
        break;
      case "Crypto":
        if (userBalances.crypto_balance < transaction_value) {
          return res
            .status(400)
            .json({ error: "Insufficient crypto balance." });
        }
        balanceAfter = userBalances.crypto_balance - transaction_value;
        userBalances.crypto_balance = balanceAfter;
        break;
      default:
        return res.status(400).json({ error: "Invalid transaction type." });
    }

    await userBalances.save();

    // Create and Save Transaction Record
    const transaction = new Transaction({
      user_id: req.user.id,
      type,
      currency,
      balance_before: balanceBefore,
      transaction_value,
      balance_after,
      method,
    });

    await transaction.save();
    res.status(201).json({ message: "Transaction successful.", transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Transactions (Admin Access)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({
      transaction_time: -1,
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
