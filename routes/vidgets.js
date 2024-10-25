const express = require('express');
const router = express.Router();
const Vidget = require('../models/Vidget'); // Путь к вашей модели виджета
const User = require('../models/User'); // Путь к вашей модели пользователя

// Эндпоинт для создания виджета
router.post('/add', async (req, res) => {
    const { userId, type, friendId } = req.body;

    // Проверяем, что обязательные поля заполнены
    if (!userId || !type) {
        return res.status(400).json({ message: 'userId and type are required' });
    }

    // Проверяем тип виджета
    if (type === 'with_friend' && !friendId) {
        return res.status(400).json({ message: 'friendId is required when type is "with_friend"' });
    }

    if (type === 'without_friend' && friendId) {
        return res.status(400).json({ message: 'friendId should not be provided when type is "without_friend"' });
    }

    try {
        // Находим пользователя по userId
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Если friendId указан, проверяем, что он в списке друзей пользователя
        if (friendId && !user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'Friend ID is not in user\'s friends list' });
        }

        // Создаём новый виджет
        const newVidget = new Vidget({
            userId,
            type,
            friendId: type === 'with_friend' ? friendId : undefined, // friendId должен быть только для with_friend
        });

        await newVidget.save();
        return res.status(201).json(newVidget);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Эндпоинт для удаления виджета
router.delete('/delete', async (req, res) => {
    const { id } = req.body; // Получаем идентификатор из тела запроса

    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    try {
        const deletedVidget = await Vidget.findByIdAndDelete(id);

        if (!deletedVidget) {
            return res.status(404).json({ message: 'Vidget not found' });
        }

        return res.status(200).json({ message: 'Vidget deleted successfully', deletedVidget });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
