const GameConstant = require("../models/gameConstant");

// Function to get all game constants
const getGameConstants = async () => {
  const constants = await GameConstant.find({});
  return constants.reduce((acc, constant) => {
    acc[constant.key] = constant.value;
    return acc;
  }, {});
};

// Function to update a game constant
const updateGameConstant = async (key, value) => {
  await GameConstant.updateOne({ key }, { value }, { upsert: true });
};

module.exports = { getGameConstants, updateGameConstant }; 