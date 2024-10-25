const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Использование LocalStrategy для проверки username и password
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Поиск пользователя по имени
    const user = await User.findOne({ 'services.password.username': username });

    if (!user) {
      return done(null, false, { message: 'Неправильное имя пользователя' });
    }

    // Сравнение пароля с хэшем
    const isMatch = await bcrypt.compare(password, user.services.password.hash);
    if (!isMatch) {
      return done(null, false, { message: 'Неправильный пароль' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));
