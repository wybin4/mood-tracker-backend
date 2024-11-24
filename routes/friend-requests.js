const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.put('/handle', authMiddleware, async (req, res) => {
  const { requestId, action } = req.body;

  try {
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Запрос не найден' });
    }

    if (action === 'accept') {
      const sender = await User.findById(request.from);
      const receiver = await User.findById(request.to);

      sender.friends.push(receiver._id);
      receiver.friends.push(sender._id);

      await sender.save();
      await receiver.save();

      request.status = 'accepted';
      await request.save();

      return res.status(200).json({ message: 'Запрос принят' });
    } else if (action === 'decline') {
      request.status = 'declined';
      await request.save();

      return res.status(200).json({ message: 'Запрос отклонён' });
    } else {
      return res.status(400).json({ message: 'Недопустимое действие' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
