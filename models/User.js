const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  services: {
    googleOauth: { id: String, displayName: String },
    password: { hash: String },
  },
  name: String,
  code: String,
  friends: [{ type: String, ref: 'User' }], // Ссылки на пользователей
  tokens: {
    accessToken: { type: String }, // Актуальный access token
    refreshToken: { type: String }, // Актуальный refresh token
  },
}, { timestamps: true });


userSchema.methods.generateAccessToken = function () {
  const payload = { id: this._id, name: this.name };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
};

userSchema.methods.generateRefreshToken = function () {
  const payload = { id: this._id };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
};

userSchema.methods.saveTokens = async function (accessToken, refreshToken) {
  this.tokens.accessToken = accessToken;
  this.tokens.refreshToken = refreshToken;
  await this.save();
};

userSchema.methods.clearTokens = async function () {
  this.tokens.accessToken = null;
  this.tokens.refreshToken = null;
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;