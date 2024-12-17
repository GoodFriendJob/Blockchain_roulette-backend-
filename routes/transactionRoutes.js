const express = require("express");
const {
  getUserTransactions,
  createTransaction,
  getAllTransactions,
} = require("../controllers/TransactionController");
const { authenticateJWT } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware"); // For admin access

const router = express.Router();

// Get User Transactions
router.get("/", authenticateJWT, getUserTransactions);

// Create a New Transaction
router.post("/", authenticateJWT, createTransaction);

// Get All Transactions (Admin Access Only)
router.get("/all", authenticateJWT, checkRole(["ADMIN"]), getAllTransactions);

module.exports = router;
