const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateFriendCode = require('../functions/generateFriendCode');
const jwt = require('jsonwebtoken');
const { isValidPassword } = require('../functions/passwordUtils');
const { validateOauthToken } = require('../functions/oauthUtils');

router.post('/login', async (req, res, next) => {
  const { name, password, oauthToken } = req.body;

  let user;

  try {
    if (oauthToken) {
      const isValidOauthToken = await validateOauthToken(oauthToken);
      if (!isValidOauthToken) {
        return res.status(401).json({ message: 'Invalid OAuth token' });
      }

      user = await User.findOne({ 'services.googleOauth.id': isValidOauthToken.id });

      if (!user) {
        try {
          const newUser = new User({
            name: isValidOauthToken.name,  
            services: {
              googleOauth: {
                id: isValidOauthToken.id,  
                displayName: isValidOauthToken.name,  
              }
            },
            friends: [],
            code: generateFriendCode(),
          });

          await newUser.save();
          user = newUser; 
          return res.status(201).json({ message: 'User registered successfully via OAuth', user: newUser });
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Server error during user registration' });
        }
      }
    } else if (name && password) {
      user = await User.findOne({ name });
      if (!user || !(await isValidPassword(password, user.services.password.hash))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid request. Provide OAuth token or name/password.' });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.saveTokens(accessToken, refreshToken);

    res.json({ accessToken, refreshToken, userId: user._id });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  const user = await User.findOne({ 'tokens.refreshToken': refreshToken });
  if (!user) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }

  try {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const newAccessToken = user.generateAccessToken();

    await user.saveTokens(newAccessToken, refreshToken);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;
