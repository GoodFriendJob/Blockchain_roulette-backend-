const { generateHash, generateSeed } = require("./crypto");
const fs = require("fs");

function generateInitialSeed() {
  return generateSeed(64);
}

function generateHashChain(hashChainLength, saveInterval) {
  const hashChain = [];
  let currentHash = generateSeed(32);

  for (let i = 0; i < hashChainLength; i++) {
    hashChain.unshift(currentHash);
    if ((i + 1) % saveInterval === 0 || i === hashChainLength - 1) {
      saveHashChain(hashChain, i === hashChainLength - 1);
    }
    currentHash = generateHash(currentHash);
  }

  return hashChain; 
}

function saveHashChain(hashChain, isFinalSave) {
  try {
    fs.writeFileSync("hashChain.json", JSON.stringify(hashChain, null, 2));
    if (isFinalSave) {
      fs.writeFileSync("finalHash.json", JSON.stringify({ finalHash: hashChain[0] }, null, 2));
    }
  } catch (error) {
    console.error("Error saving hash chain:", error);
  }
}

module.exports = { generateHashChain, saveHashChain, generateInitialSeed };
