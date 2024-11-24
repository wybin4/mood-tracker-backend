const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Widget = require('../models/Widget');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { _id, name, code } = req.user;
    return res.status(200).json({ _id, name, code });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/send-friend-request', authMiddleware, async (req, res) => {
  const { friendCode } = req.body;

  try {
    const user = req.user;

    if (user.code === friendCode) {
      return res.status(400).json({ message: 'Нельзя отправить запрос самому себе' });
    }

    const receiver = await User.findOne({ code: friendCode });
    if (!receiver) {
      return res.status(404).json({ message: 'Друг с указанным кодом не найден' });
    }

    const existingRequest = await FriendRequest.findOne({
      from: user._id,
      to: receiver._id,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Запрос на добавление уже отправлен' });
    }

    const newRequest = new FriendRequest({ from: user._id, to: receiver._id });
    await newRequest.save();

    return res.status(201).json({ message: 'Запрос на добавление в друзья отправлен' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/list-friend-requests', authMiddleware, async (req, res) => {
  const userId = req.user._id;

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

router.get('/list-friends', authMiddleware, async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate('friends', 'name code');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const friendsList = user.friends.map(friend => ({
      _id: friend._id,
      name: friend.name,
    }));
    return res.status(200).json(friendsList);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/list-friends-without-widgets', authMiddleware, async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate('friends', 'name code');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const friendsWithWidgets = await Widget.find({ userId: userId, friendId: { $ne: null } }).distinct('friendId');
    const friendsWithoutWidgets = user.friends.filter(friend => !friendsWithWidgets.includes(friend._id.toString()));

    const friendsList = friendsWithoutWidgets.map(friend => ({
      _id: friend._id,
      name: friend.name,
    }));

    return res.status(200).json(friendsList);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/remove-friend', authMiddleware, async (req, res) => {
  const { friendId } = req.body;

  try {
    const userId = req.user._id;
    const user = req.user;
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'Друг не найден' });
    }

    user.friends = user.friends.filter(id => id !== friendId);
    await user.save();

    friend.friends = friend.friends.filter(id => id !== userId);
    await friend.save();

    await Widget.deleteMany({
      userId: userId,
      friendId: friendId
    });

    const existingRequest = await FriendRequest.findOne({
      from: friendId,
      to: userId,
      status: 'pending'
    });

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
