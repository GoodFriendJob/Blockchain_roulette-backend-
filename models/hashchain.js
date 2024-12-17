const mongoose = require('mongoose');

const crypto = require('crypto');

const HashChainSchema = new mongoose.Schema({

  order_index: { type: Number, required: true },

  reverse_index: { type: Number, required: true },

  hash: { type: String, required: true },

  checksum: { type: String, required: true }

});

const HashChain = mongoose.model('HashChain', HashChainSchema);

