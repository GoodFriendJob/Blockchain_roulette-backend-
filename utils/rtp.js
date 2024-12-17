const Wager = require('../models/Wager');

const calculateRTP = async (filters = {}) => {
  try {
    const result = await Wager.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalWon: { 
            $sum: { 
              $convert: { 
                input: '$won_amount', 
                to: 'double' 
              }
            }
          },
          totalWagered: { 
            $sum: { 
              $convert: { 
                input: '$wager_amount', 
                to: 'double' 
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          rtp: {
            $multiply: [
              { $divide: ['$totalWon', '$totalWagered'] },
              100
            ]
          },
          totalWon: 1,
          totalWagered: 1
        }
      }
    ]);

    return result[0] || { rtp: 0, totalWon: 0, totalWagered: 0 };
  } catch (error) {
    console.error('RTP calculation error:', error);
    throw error;
  }
};

module.exports = {
  calculateRTP,
}; 