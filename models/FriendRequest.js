const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  from: { type: String, ref: 'User' }, // Ссылка на отправителя
  to: { type: String, ref: 'User' },   // Ссылка на получателя
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
