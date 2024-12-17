const Player = require("../models/Player");
const UserBalances = require("../models/UserBalances");
const Wager = require("../models/Wager");
const logger = require("../utils/logger");
const { getConfigValue } = require("../utils/configuration");
const { generateSeed } = require("../utils/crypto");
const {
  generateFloats,
  GAME_CONSTANTS,
  baseAmmoCounts,
  bonusAmmoCounts,
} = require("../utils/gamestimulation");
const GroupGame = require("../models/GroupGame");
const mongoose = require("mongoose");

const crypto=require("crypto")

class GameController {
  static async playGame(userId, betAmount, gameType = "RR (Solo)") {
    try {
      if (gameType === "RR (Solo)") {
        return await this.playSoloGame(userId, betAmount);
      } else if (gameType === "RR (Group)") {
        return await this.playGroupGame(userId, betAmount);
      }
      throw new Error("Invalid game type");
    } catch (error) {
      logger.error(`Error in playGame for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  static async playSoloGame(userId, betAmount) {
    try {
      logger.info(
        `Starting game for user ${userId} with bet amount ${betAmount}`
      );

      const userBalance = await UserBalances.findOne({ user_id: userId });
      const player = await Player.findOne({ username: userId });

      if (!userBalance || !player) {
        throw new Error("User or player not found");
      }

      if (parseFloat(userBalance.cash_balance.toString()) < betAmount) {
        throw new Error("Insufficient balance");
      }

      const { serverSeed, clientSeed, nonce } = this.generateGameSeeds();

      const wager = new Wager({
        user_id: userId,
        game_name: "RR (Solo)",
        game_id: crypto.randomBytes(16).toString("hex"),
        balance_before: userBalance.cash_balance,
        wager_amount: betAmount,
        target: (await getConfigValue("default_target")) || 1,
        currency: "USD",
      });

      // Run game simulation
      const gameResult = await this.runGameSimulation({
        serverSeed,
        clientSeed,
        nonce,
        betAmount,
        totalRounds: 1,
      });

      const totalWinAmount =
        gameResult.totalBaseWinAmount + gameResult.totalBonusWinAmount;

      wager.won_amount = totalWinAmount;
      wager.rtp = totalWinAmount > 0 ? (totalWinAmount / betAmount) * 100 : 0;
      wager.site_profit = betAmount - totalWinAmount;
      await wager.save();

      // Update player statistics and game history
      await this.updatePlayerStats(player, gameResult, {
        serverSeed,
        clientSeed,
        nonce,
        betAmount,
        winAmount: totalWinAmount,
      });

      // Update user balance
      await this.updateUserBalance(userBalance, gameResult);

      logger.info(
        `Game result for user ${userId}: ${JSON.stringify(gameResult)}`
      );

      return {
        success: true,
        gameResult,
        serverSeed,
        clientSeed,
        nonce,
        wager: {
          id: wager._id,
          betAmount,
          winAmount: totalWinAmount,
          rtp: wager.rtp,
        },
      };
    } catch (error) {
      logger.error(`Error in playSoloGame for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  static async playGroupGame(userId, betAmount) {
    try {
      const userBalance = await UserBalances.findOne({ user_id: userId });
      const player = await Player.findOne({ username: userId });

      if (!userBalance || !player) {
        throw new Error("User or player not found");
      }

      if (parseFloat(userBalance.cash_balance.toString()) < betAmount) {
        throw new Error("Insufficient balance");
      }

      // Find or create active group game
      let groupGame = await GroupGame.findOne({ 
        status: 'pending',
        end_time: { $gt: new Date() }
      });

      if (!groupGame) {
        groupGame = new GroupGame({
          game_id: crypto.randomBytes(16).toString("hex"),
          start_time: new Date(),
          end_time: new Date(Date.now() + 30000), // 30 second countdown
          status: 'pending'
        });
        await groupGame.save();
      }

      // Create wager for this player
      const wager = new Wager({
        user_id: userId,
        game_name: "RR (Group)",
        game_id: groupGame.game_id,
        balance_before: userBalance.cash_balance,
        wager_amount: betAmount,
        target: (await getConfigValue("default_target")) || 1,
        currency: "USD",
        status: 'pending'
      });
      await wager.save();

      // Deduct balance immediately
      userBalance.cash_balance = new mongoose.Types.Decimal128(
        (parseFloat(userBalance.cash_balance.toString()) - betAmount).toString()
      );
      await userBalance.save();

      // If game is about to end, trigger outcome calculation
      if (new Date(groupGame.end_time).getTime() - Date.now() < 1000) {
        await this.calculateGroupGameOutcome(groupGame.game_id);
      }

      return {
        success: true,
        gameId: groupGame.game_id,
        endTime: groupGame.end_time,
        wager: {
          id: wager._id,
          betAmount,
        }
      };

    } catch (error) {
      logger.error(`Error in playGroupGame for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  static async calculateGroupGameOutcome(gameId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const groupGame = await GroupGame.findOne({ game_id: gameId }).session(session);
      if (!groupGame || groupGame.status !== 'pending') {
        throw new Error("Invalid game or already processed");
      }

      const wagers = await Wager.find({ game_id: gameId }).session(session);
      const { serverSeed, clientSeed, nonce } = this.generateGameSeeds();

      // Run single game simulation for all players
      const gameResult = await this.runGameSimulation({
        serverSeed,
        clientSeed,
        nonce,
        betAmount: 1, // Use 1 as base for multiplier calculation
        totalRounds: 1,
      });

      // Update all wagers and balances
      for (const wager of wagers) {
        const userBalance = await UserBalances.findOne({ 
          user_id: wager.user_id 
        }).session(session);

        const winAmount = wager.wager_amount * (gameResult.totalBaseWinAmount + gameResult.totalBonusWinAmount);
        
        // Update wager
        wager.won_amount = winAmount;
        wager.rtp = winAmount > 0 ? (winAmount / wager.wager_amount) * 100 : 0;
        wager.site_profit = wager.wager_amount - winAmount;
        wager.status = winAmount > 0 ? 'won' : 'lost';
        await wager.save({ session });

        // Update balance
        if (winAmount > 0) {
          userBalance.cash_balance = new mongoose.Types.Decimal128(
            (parseFloat(userBalance.cash_balance.toString()) + winAmount).toString()
          );
          await userBalance.save({ session });
        }
      }

      // Update group game status
      groupGame.status = 'completed';
      groupGame.result = gameResult;
      await groupGame.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static generateGameSeeds() {
    const serverSeed = generateSeed(32);
    const clientSeed = generateSeed(32);
    const nonce = Math.floor(Math.random() * 1000000);
    return { serverSeed, clientSeed, nonce };
  }

  static async runGameSimulation({
    serverSeed,
    clientSeed,
    nonce,
    betAmount,
    totalRounds,
  }) {
    let cursor = 0;

    let playerBalance = betAmount;
    let totalBaseWinAmount = 0;
    let totalBonusWinAmount = 0;
    let totalBaseWins = 0;
    let totalBonusWins = 0;
    let bonusesTriggered = 0;
    let bonusRetriggersCount = 0;

    const baseMultiplier =
      Math.floor(
        Math.max(
          1,
          0xffffffff /
            (generateFloats({ serverSeed, clientSeed, nonce, cursor }) *
              0xffffffff +
              1)
        ) * 100
      ) / 100;
    cursor += 4;

    const firstRoll = Math.floor(
      generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 63
    );
    cursor += 4;

    const winResultRoll = Math.floor(
      generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 6
    );
    cursor += 4;

    const baseAmmoCount = baseAmmoCounts[firstRoll];

    if (
      baseMultiplier >= GAME_CONSTANTS.BASE_WIN_MULTIPLIER_TARGET &&
      winResultRoll < baseAmmoCount
    ) {
      const winAmount = betAmount * GAME_CONSTANTS.BASE_WIN_MULTIPLIER_TARGET;
      playerBalance += winAmount;
      totalBaseWins++;
      totalBaseWinAmount += winAmount;
    }

    if (
      Math.floor(
        generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 200
      ) === 0
    ) {
      bonusesTriggered++;
      let bonusRoundsRemaining = GAME_CONSTANTS.INITIAL_BONUS_ROUNDS;
      cursor += 4;

      while (bonusRoundsRemaining > 0) {
        const bonusRoundMultiplier =
          Math.floor(
            Math.max(
              1,
              0xffffffff /
                (generateFloats({ serverSeed, clientSeed, nonce, cursor }) *
                  0xffffffff +
                  1)
            ) * 100
          ) / 100;
        cursor += 4;

        const bonusWinResultRoll = Math.floor(
          generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 6
        );
        cursor += 4;

        const bonusAmmoCount =
          bonusAmmoCounts[
            Math.floor(
              generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 186
            )
          ];
        cursor += 4;

        if (
          bonusRoundMultiplier >= GAME_CONSTANTS.BONUS_MULTIPLIER_TARGET &&
          bonusWinResultRoll < baseAmmoCount + bonusAmmoCount
        ) {
          const winAmount = betAmount * GAME_CONSTANTS.BONUS_MULTIPLIER_TARGET;
          playerBalance += winAmount;
          totalBonusWins++;
          totalBonusWinAmount += winAmount;
        }

        // Check for bonus retrigger
        if (
          Math.floor(
            generateFloats({ serverSeed, clientSeed, nonce, cursor }) * 200
          ) === 0
        ) {
          bonusRetriggersCount++;
          bonusRoundsRemaining += GAME_CONSTANTS.BONUS_RETRIGGER_ROUNDS;
        }
        cursor += 4;

        bonusRoundsRemaining--;
      }
    }

    const finalBalance = playerBalance;

    // Calculate accurate RTP for the game session
    const totalWagered = betAmount * totalRounds;
    const totalWon = totalBaseWinAmount + totalBonusWinAmount;
    const sessionRTP = (totalWon / totalWagered) * 100;

    return {
      playerBalance: finalBalance,
      totalBaseWinAmount,
      totalBonusWinAmount,
      totalBaseWins,
      totalBonusWins,
      totalBetAmount: totalWagered,
      bonusesTriggered,
      bonusRetriggersCount,
      rtp: sessionRTP
    };
  }

  static async updatePlayerStats(player, gameResult, gameDetails) {
    player.totalBaseWins += gameResult.totalBaseWins;
    player.totalBonusWins += gameResult.totalBonusWins;
    player.totalBaseWinAmount += gameResult.totalBaseWinAmount;
    player.totalBonusWinAmount += gameResult.totalBonusWinAmount;
    player.totalBetAmount += gameResult.totalBetAmount;
    player.bonusesTriggered += gameResult.bonusesTriggered;
    player.bonusRetriggersCount += gameResult.bonusRetriggersCount;

    // Add to game history
    player.gameHistory.push({
      serverSeed: gameDetails.serverSeed,
      clientSeed: gameDetails.clientSeed,
      nonce: gameDetails.nonce,
      betAmount: gameDetails.betAmount,
      winAmount: gameDetails.winAmount,
      timestamp: new Date(),
    });

    await player.save();
  }

  static async updateUserBalance(userBalance, gameResult) {
    const netWin =
      gameResult.totalBaseWinAmount +
      gameResult.totalBonusWinAmount -
      gameResult.totalBetAmount;

    const currentBalance = parseFloat(userBalance.cash_balance.toString());
    userBalance.cash_balance = currentBalance + netWin;

    await userBalance.save();
  }

  static async getGameStats(userId) {
    try {
      const player = await Player.findOne({ username: userId })
        .select('-_id totalBaseWins totalBonusWins totalBaseWinAmount totalBonusWinAmount totalBetAmount bonusesTriggered bonusRetriggersCount');
      
      if (!player) {
        throw new Error("Player not found");
      }

      return player;
    } catch (error) {
      logger.error(`Error getting game stats for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  static async getGroupGameStatus() {
    try {
      const activeGame = await GroupGame.findOne({
        status: 'pending',
        end_time: { $gt: new Date() }
      });

      if (!activeGame) {
        return {
          active: false,
          message: "No active group game found"
        };
      }

      return {
        active: true,
        gameId: activeGame.game_id,
        endTime: activeGame.end_time,
        timeRemaining: new Date(activeGame.end_time).getTime() - Date.now()
      };
    } catch (error) {
      logger.error(`Error getting group game status: ${error.message}`);
      throw error;
    }
  }

  static async getGroupGameResults(gameId, userId) {
    try {
      const game = await GroupGame.findOne({ game_id: gameId });
      if (!game) {
        throw new Error("Game not found");
      }

      const wagers = await Wager.find({ 
        game_id: gameId,
        user_id: userId 
      });

      return {
        game: {
          status: game.status,
          result: game.result,
          endTime: game.end_time
        },
        wagers
      };
    } catch (error) {
      logger.error(`Error getting group game results for game ${gameId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GameController;
