const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  // Add password/email fields if authentication is needed
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 