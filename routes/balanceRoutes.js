const express = require("express");
const {
  getUserBalances,
  depositCash,
  withdrawCrypto,
  transferBonusToStakePool,
} = require("../controllers/balanceController");
const { authenticateJWT } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get User Balances
router.get("/", authenticateJWT, getUserBalances);

// Deposit Cash
router.post("/deposit", authenticateJWT, depositCash);

// Withdraw Crypto
router.post("/withdraw", authenticateJWT, withdrawCrypto);

// Transfer Bonus to Stake Pool
router.post("/transfer/bonus", authenticateJWT, transferBonusToStakePool);

module.exports = router;
