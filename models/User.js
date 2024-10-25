const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  services: {
    googleOauth: { id: String, displayName: String },
    password: { hash: String },
  },
  name: String,
  code: String,
  friends: [{ type: String, ref: 'User' }], // Делаем friends ссылкой на User
});

const User = mongoose.model('User', userSchema);

module.exports = User;
