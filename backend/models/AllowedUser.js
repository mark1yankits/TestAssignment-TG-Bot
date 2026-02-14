const mongoose = require('mongoose');

const allowedUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AllowedUser', allowedUserSchema);
