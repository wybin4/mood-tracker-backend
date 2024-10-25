const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
require('./config/googleStrategy');
require('./config/localStrategy');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const friendRequestsRoutes = require('./routes/friend-requests');
const eventRoutes = require('./routes/events');
const vidgetRoutes = require('./routes/vidgets');
const { initializeDefaultMoodTypes } = require('./models/MoodType');
const { initializeDefaultMoods } = require('./models/Mood');
const { initializeEventTypes } = require('./models/EventType'); // Импорт функции инициализации

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await initializeEventTypes(); // Инициализация типов событий
    await initializeDefaultMoodTypes(); // Инициализация типов настроений
    await initializeDefaultMoods(); // Инициализация синонимов
  })
  .catch(err => console.error(err));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/friend-requests', friendRequestsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/vidgets', vidgetRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
