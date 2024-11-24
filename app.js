const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const friendRequestsRoutes = require('./routes/friend-requests');
const eventRoutes = require('./routes/events');
const widgetRoutes = require('./routes/widgets');
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

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/friend-requests', friendRequestsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/widgets', widgetRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
