const crypto = require("crypto");

const generateHash = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const generateSeed = (size = 32) => {
  return crypto.randomBytes(size).toString('hex');
};

module.exports = { generateHash, generateSeed };
