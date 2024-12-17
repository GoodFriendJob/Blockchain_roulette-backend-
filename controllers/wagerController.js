const mongoose = require('mongoose');
const Wager = require("../models/Wager");
const UserBalances = require("../models/UserBalances");
const logger = require("../utils/logger");
const { calculateRTP } = require('../utils/rtp');

// Security middleware to prevent caching and ensure fresh data
const addSecurityHeaders = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

class WagerController {
  /**
   * Get wagers for a specific user with optional status filter
   * @param {Object} req - Express request object
   * @returns {Object} Wagers and success status
   */
  static async getUserWagers(req) {
    try {
      const status = req.query.status;
      const query = { user_id: req.user.id };
      if (status) {
        query.status = status;
      }
      
      // Fetch wagers sorted by time (newest first)
      const wagers = await Wager.find(query)
        .sort({ wager_time: -1 });

      return {
        success: true,
        wagers,
        message: "Wagers fetched successfully"
      };
    } catch (error) {
      logger.error(`Error fetching wagers for user ${req.user.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new wager with transaction support
   * @param {string} userId - User's ID
   * @param {Object} wagerData - Wager details
   * @returns {Object} Created wager and updated balance
   */
  static async createWager(userId, wagerData) {
    // Start MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { game_name, game_id, wager_amount, target, currency } = wagerData;

      // Get user balance with lock for atomicity
      const userBalances = await UserBalances.findOne(
        { user_id: userId },
        null,
        { session, lock: true }
      );

      if (!userBalances) {
        throw new Error("User balances not found.");
      }

      // Convert balance to number for calculations
      const currentBalance = currency === "USD" 
        ? parseFloat(userBalances.cash_balance.toString())
        : parseFloat(userBalances.crypto_balance.toString());
      
      const wagerAmountNum = parseFloat(wager_amount);

      // Validate sufficient balance
      if (currentBalance < wagerAmountNum) {
        throw new Error("Insufficient balance");
      }

      // Calculate new balance
      const balanceAfter = currentBalance - wagerAmountNum;

      // Update appropriate balance type
      if (currency === "USD") {
        userBalances.cash_balance = new mongoose.Types.Decimal128(balanceAfter.toString());
      } else {
        userBalances.crypto_balance = new mongoose.Types.Decimal128(balanceAfter.toString());
      }

      // Simulate game outcome (temporary random logic)
      const wonAmount = Math.random() < 0.5 ? wagerAmountNum * 2 : 0;

      // Create new wager record
      const wager = new Wager({
        user_id: userId,
        game_name,
        game_id,
        balance_before: new mongoose.Types.Decimal128(currentBalance.toString()),
        wager_amount: new mongoose.Types.Decimal128(wagerAmountNum.toString()),
        target: new mongoose.Types.Decimal128(target.toString()),
        won_amount: new mongoose.Types.Decimal128(wonAmount.toString()),
        currency,
        status: wonAmount > 0 ? 'won' : 'lost',
        wager_time: new Date()
      });

      // Save both documents in transaction
      await userBalances.save({ session });
      await wager.save({ session });
      await session.commitTransaction();

      // Calculate game statistics
      const gameRTP = await calculateRTP({ game_id });

      return {
        message: "Wager placed successfully.",
        wager,
        newBalance: currency === "USD" 
          ? userBalances.cash_balance 
          : userBalances.crypto_balance,
        statistics: {
          wagerRTP: wager.rtp,
          gameRTP: gameRTP.rtp,
          totalWagered: gameRTP.totalWagered,
          totalWon: gameRTP.totalWon
        }
      };

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all wagers (admin only)
   * @returns {Array} All wagers sorted by time
   */
  static async getAllWagers() {
    try {
      const wagers = await Wager.find().sort({ wager_time: -1 });
      return wagers;
    } catch (error) {
      logger.error('Error fetching all wagers:', error);
      throw error;
    }
  }

  /**
   * Get RTP statistics with optional filters
   * @param {Object} queryParams - Filter parameters
   * @returns {Object} RTP statistics
   */
  static async getRTPStats(queryParams) {
    try {
      const { game_id, game_name, timeRange } = queryParams;
      const filters = {};

      // Apply filters if provided
      if (game_id) filters.game_id = game_id;
      if (game_name) filters.game_name = game_name;
      
      // Add time range filter if specified
      if (timeRange) {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - parseInt(timeRange));
        
        filters.wager_time = {
          $gte: startDate,
          $lte: now
        };
      }

      // Calculate RTP statistics
      const stats = await calculateRTP(filters);
      
      return {
        success: true,
        statistics: {
          rtp: parseFloat(stats.rtp.toFixed(2)),
          totalWagered: parseFloat(stats.totalWagered.toFixed(2)),
          totalWon: parseFloat(stats.totalWon.toFixed(2)),
          profitMargin: parseFloat((100 - stats.rtp).toFixed(2))
        },
        filters
      };
    } catch (error) {
      logger.error('Error calculating RTP stats:', error);
      throw error;
    }
  }
}

// Export controller and security middleware
module.exports = {
  WagerController,
  addSecurityHeaders
};