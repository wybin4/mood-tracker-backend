const express = require('express');
const router = express.Router();
const Widget = require('../models/Widget');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add', authMiddleware, async (req, res) => {
    const { type, friendId } = req.body;

    if (!type) {
        return res.status(400).json({ message: 'Type are required' });
    }

    if (type === 'with_friend' && !friendId) {
        return res.status(400).json({ message: 'friendId is required when type is "with_friend"' });
    }

    if (type === 'without_friend' && friendId) {
        return res.status(400).json({ message: 'friendId should not be provided when type is "without_friend"' });
    }

    try {
        const user = req.user;
        const userId = req.user._id;

        if (friendId && !user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'Friend ID is not in user\'s friends list' });
        }

        if (type === 'without_friend') {
            const existingWidget = await Widget.findOne({ userId, type: 'without_friend' });
            if (existingWidget) {
                return res.status(400).json({ message: 'User already has a "without_friend" widget' });
            }
        }

        const newWidget = new Widget({
            userId,
            type,
            friendId: type === 'with_friend' ? friendId : undefined,
        });

        await newWidget.save();
        return res.status(201).json(newWidget);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/list', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    try {
        const widgets = await Widget.find({ userId }).populate('friendId', '_id name');

        const formattedWidgets = widgets.map(widget => {
            const widgetObject = widget.toObject();
            if (widgetObject.friendId) {
                widgetObject.friendName = widgetObject.friendId.name;
                widgetObject.friendId = widgetObject.friendId._id;
            }
            return widgetObject;
        });

        return res.status(200).json(formattedWidgets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/delete', authMiddleware, async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'ID is required' });
    }

    try {
        const deletedWidget = await Widget.findByIdAndDelete(id);

        if (!deletedWidget) {
            return res.status(404).json({ message: 'Widget not found' });
        }

        return res.status(200).json({ message: 'Widget deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
