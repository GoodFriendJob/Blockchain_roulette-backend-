const crypto = require("crypto");

let serverSeed = "server_seed";
const clientSeed = 'fixed_client_seed';
let nonce = 0;
let cursor = 0;

const generateHash = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const verifyHash = (data, hash) => {
  const newHash = generateHash(data);
  return newHash === hash;
};

// Game simulation logic
function* byteGenerator({ serverSeed, clientSeed, nonce, cursor }) {
  let currentRound = Math.floor(cursor / 32);
  let currentRoundCursor = cursor % 32;

  while (true) {
    const hmac = crypto.createHmac("sha256", serverSeed);
    hmac.update(`${clientSeed}:${nonce}:${currentRound}`);
    const buffer = hmac.digest();

    while (currentRoundCursor < 32) {
      yield Number(buffer[currentRoundCursor]);
      currentRoundCursor += 1;
    }
    currentRoundCursor = 0;
    currentRound += 1;
  }
}

function generateFloats({ serverSeed, clientSeed, nonce, cursor }) {
  const rng = byteGenerator({ serverSeed, clientSeed, nonce, cursor });
  const bytes = [];

  for (let i = 0; i < 4; i++) {
    bytes.push(rng.next().value);
  }

  return bytes.reduce((result, value, i) => {
    const divider = 256 ** (i + 1);
    const partialResult = value / divider;
    return result + partialResult;
  }, 0);
}

// Define multipliers and ammo counts
const bonusMultipliers = new Uint8Array(64);
bonusMultipliers.fill(1);
bonusMultipliers.fill(100, 0, 2);
bonusMultipliers.fill(75, 2, 4);
bonusMultipliers.fill(50, 4, 8);
bonusMultipliers.fill(20, 8, 16);
bonusMultipliers.fill(10, 16, 32);
bonusMultipliers.fill(5, 32, 63);

const baseAmmoCounts = new Uint8Array(64);
baseAmmoCounts.fill(0);
baseAmmoCounts.fill(6, 0, 2);
baseAmmoCounts.fill(5, 2, 4);
baseAmmoCounts.fill(4, 4, 8);
baseAmmoCounts.fill(3, 8, 16);
baseAmmoCounts.fill(2, 16, 32);
baseAmmoCounts.fill(1, 32, 63);

const bonusAmmoCounts = new Uint8Array(187);
bonusAmmoCounts.fill(0);
bonusAmmoCounts.fill(5, 0, 2);
bonusAmmoCounts.fill(4, 2, 4);
bonusAmmoCounts.fill(3, 4, 8);
bonusAmmoCounts.fill(2, 8, 16);
bonusAmmoCounts.fill(1, 16, 32);

// Game constants
const GAME_CONSTANTS = {
  BASE_WIN_MULTIPLIER_TARGET: 1,
  BONUS_MULTIPLIER_TARGET: 1,
  INITIAL_BONUS_ROUNDS: 10,
  BONUS_RETRIGGER_ROUNDS: 10,
  BET_AMOUNT: 1,
  EXPECTED_BASE_WIN_PERCENTAGE: 36.936,
  EXPECTED_BONUS_WIN_PERCENTAGE: 31.746,
  EXPECTED_BONUS_TRIGGER_PERCENTAGE: 0.5,
  EXPECTED_BONUS_RETRIGGER_PERCENTAGE: 0.5,
};

// Update the random number generation functions
const generateRandomFloat = () => {
  const float = generateFloats({ serverSeed, clientSeed, nonce, cursor });
  cursor += 4;
  return float;
};

const generateRandomInteger = (max) => {
  return Math.floor(generateRandomFloat() * max);
};

// Game loop
const gameLoop = (totalRounds) => {
  const betAmount = GAME_CONSTANTS.BET_AMOUNT;
  let playerBalance = betAmount * totalRounds;
  const winMultipliers = [];
  const bonusRoundWinMultipliers = [];
  let totalBaseWinAmount = 0;
  let totalBonusWinAmount = 0;
  let totalBaseWins = 0;
  let totalBonusWins = 0;
  let totalBetAmount = 0;
  let totalBaseRounds = 0;
  let totalBonusRounds = 0;
  let bonusesTriggered = 0;
  let bonusRetriggersCount = 0;

  const initialBonusRounds = GAME_CONSTANTS.INITIAL_BONUS_ROUNDS;
  const bonusRetriggerRounds = GAME_CONSTANTS.BONUS_RETRIGGER_ROUNDS;

  for (let i = 0; i < totalRounds; i++) {
    nonce++;
    cursor = 0;

    playerBalance -= betAmount;
    totalBetAmount += betAmount;
    totalBaseRounds++;

    const baseMultiplier =
      Math.floor(
        Math.max(1, 0xffffffff / (generateRandomFloat() * 0xffffffff + 1)) * 100
      ) / 100;
    const firstRoll = Math.floor(generateRandomFloat() * 63);
    const winResultRoll = Math.floor(generateRandomFloat() * 6);
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

    if (Math.floor(generateRandomFloat() * 200) === 0) {
      bonusesTriggered++;
      let bonusRoundsRemaining = initialBonusRounds;

      while (bonusRoundsRemaining > 0) {
        let bonusRoundMultiplier =
          Math.floor(
            Math.max(1, 0xffffffff / (generateRandomFloat() * 0xffffffff + 1)) *
              100
          ) / 100;
        let winResultRoll = Math.floor(generateRandomFloat() * 6);
        const bonusAmmoCount =
          bonusAmmoCounts[Math.floor(generateRandomFloat() * 186)];

        if (
          bonusRoundMultiplier >= GAME_CONSTANTS.BONUS_MULTIPLIER_TARGET &&
          winResultRoll < baseAmmoCount + bonusAmmoCount
        ) {
          const winAmount = betAmount * GAME_CONSTANTS.BONUS_MULTIPLIER_TARGET;
          playerBalance += winAmount;
          totalBonusWins++;
          totalBonusWinAmount += winAmount;
        }

        if (Math.floor(generateRandomFloat() * 200) === 0) {
          bonusRetriggersCount++;
          bonusRoundsRemaining += bonusRetriggerRounds;
        }
        bonusRoundsRemaining--;
        totalBonusRounds++;
      }
    }
  }

  return {
    playerBalance,
    totalBaseWinAmount,
    totalBonusWinAmount,
    totalBaseWins,
    totalBonusWins,
    totalBetAmount,
    gameLoop,
    generateFloats
  };
};

module.exports = {
  generateHash,
  verifyHash,
  generateFloats,
  GAME_CONSTANTS,
  bonusMultipliers,
  baseAmmoCounts,
  bonusAmmoCounts,
  gameLoop,
  byteGenerator
};
