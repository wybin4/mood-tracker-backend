const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Vidget = require('../models/Vidget');
const router = express.Router();

router.post('/profile', async (req, res) => {
  const { userId } = req.body; // Извлекаем userId из тела запроса

  try {
    const user = await User.findById(userId).select('_id name code'); // Ищем пользователя и возвращаем только _id, name и code

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' }); // Проверяем, если пользователь не найден
    }

    return res.status(200).json(user); // Возвращаем данные пользователя
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' }); // Обрабатываем возможные ошибки
  }
});


// Эндпоинт для отправки запроса на добавление в друзья
router.post('/send-friend-request', async (req, res) => {
  const { userId, friendCode } = req.body;

  try {
    // Находим пользователя, который отправляет запрос
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, что пользователь не отправляет запрос самому себе
    if (sender.code === friendCode) {
      return res.status(400).json({ message: 'Нельзя отправить запрос самому себе' });
    }

    // Находим пользователя по коду друга
    const receiver = await User.findOne({ code: friendCode });
    if (!receiver) {
      return res.status(404).json({ message: 'Друг с указанным кодом не найден' });
    }

    // Проверяем, не отправлен ли уже запрос
    const existingRequest = await FriendRequest.findOne({
      from: sender._id,
      to: receiver._id,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Запрос на добавление уже отправлен' });
    }

    // Создаем новый запрос на добавление в друзья
    const newRequest = new FriendRequest({ from: sender._id, to: receiver._id });
    await newRequest.save();

    return res.status(201).json({ message: 'Запрос на добавление в друзья отправлен' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Эндпоинт для получения входящих запросов на добавление в друзья
router.post('/list-friend-requests', async (req, res) => {
  const { userId } = req.body;

  try {
    const requests = await FriendRequest.find({ to: userId, status: 'pending' })
      .select('-status -createdAt')
      .populate('from', 'name code');

    return res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});


// Эндпоинт для получения списка друзей
router.post('/list-friends', async (req, res) => {
  const { userId } = req.body;

  try {
    // Находим пользователя с заполнением друзей
    const user = await User.findById(userId).populate('friends', 'name code'); // Заполняем поля 'name' и 'code' у друзей
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Возвращаем имена друзей
    const friendsList = user.friends.map(friend => ({
      _id: friend._id,
      name: friend.name,  // Получаем имя друга
    }));
    return res.status(200).json(friendsList); // Возвращаем список друзей
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Эндпоинт для удаления друга
router.post('/remove-friend', async (req, res) => {
  const { userId, friendId } = req.body;

  try {
    // Находим пользователя и друга
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: 'Пользователь или друг не найден' });
    }

    // Удаляем друга из списка friends у пользователя
    user.friends = user.friends.filter(id => id !== friendId);
    await user.save();

    // Удаляем пользователя из списка друзей у друга
    friend.friends = friend.friends.filter(id => id !== userId);
    await friend.save();

    await Vidget.deleteMany({
      userId: userId,
      friendId: friendId
    });

    // Проверяем, нет ли уже активного запроса в обратном направлении
    const existingRequest = await FriendRequest.findOne({
      from: friendId,
      to: userId,
      status: 'pending'
    });

    // Если запроса нет, создаем новый запрос от друга к пользователю (чтобы восстановить дружбу)
    if (!existingRequest) {
      const newRequest = new FriendRequest({
        from: friendId,
        to: userId,
        status: 'pending'
      });
      await newRequest.save();
    }

    return res.status(200).json({ message: 'Друг удален, заявка на добавление отправлена обратно' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
