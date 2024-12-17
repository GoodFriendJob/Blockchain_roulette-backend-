const Configuration = require("../models/configuration");

const getConfigValue = async (key) => {
  try {
    const config = await Configuration.findOne({ key: key });
    return config ? config.value : null;
  } catch (error) {
    console.error(`Error fetching configuration for key ${key}: ${error}`);
    return null;
  }
};

module.exports = { getConfigValue }; 