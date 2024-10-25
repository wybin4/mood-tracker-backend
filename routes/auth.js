const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const generateFriendCode = require('../functions/generateFriendCode');

// Маршрут для регистрации нового пользователя
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Хэшируем пароль перед сохранением
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: username,
      services: {
        password: {
          hash: hashedPassword,
        }
      },
      friends: [],
      code: generateFriendCode(),
    });

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Маршрут для входа с использованием имени пользователя и пароля
router.post('/login', (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    if (!user) {
      return res.status(400).json({ message: info.message || 'Invalid credentials' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ message: 'Login failed' });
      }
      return res.status(200).json({ message: 'Logged in successfully', user });
    });
  })(req, res, next);
});

// Маршрут для входа через Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile'] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
  session: true,
}), (req, res) => {
  res.redirect('/');
});

// Маршрут для выхода (logout)
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
