const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const generateFriendCode = require('../functions/generateFriendCode');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.URL + "/auth/google/callback",
  scope: ['profile', 'email']
},
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      // Проверим, содержит ли профиль ID
      const googleId = profile.id;
      if (!googleId) {
        return done(new Error('Google profile ID is missing'), null);
      }

      // Поиск пользователя по ID в googleOauth
      let user = await User.findOne({ 'services.googleOauth.id': googleId });

      // Если пользователя нет, создаем нового
      if (!user) {
        const friendCode = generateFriendCode(); // Генерируем код для друзей
        user = await User.create({
          name: profile.displayName,
          code: friendCode, // Здесь вы можете оставить null или добавить значение, если нужно
          friends: [], // Или любой массив, который вам нужен
          services: {
            googleOauth: {
              id: googleId, // Сохраняем ID
              email: profile.emails?.[0]?.value, // Проверка на наличие email
              displayName: profile.displayName // Сохраняем имя пользователя
            }
          }
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
