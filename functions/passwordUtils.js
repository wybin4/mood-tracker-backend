const bcrypt = require('bcrypt');

const isValidPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

module.exports = { isValidPassword, hashPassword };
