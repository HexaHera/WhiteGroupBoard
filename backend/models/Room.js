const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  whiteboardData: { type: Array, default: [] }, // Stores drawing actions
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema); 