const crypto = require('crypto');

function verifyHashChain(hashChain) {
  for (let i = 0; i < hashChain.length - 1; i++) {
    const currentHash = hashChain[i];
    const nextHash = hashChain[i + 1];
    const calculatedHash = crypto.createHash('sha256').update(nextHash).digest('hex');
    if (calculatedHash !== currentHash) return false;
  }
  return true;
}

module.exports = verifyHashChain;
