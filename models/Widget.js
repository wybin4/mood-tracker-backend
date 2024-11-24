const mongoose = require('mongoose');

const WidgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['with_friend', 'without_friend'], // Определяем типы виджетов как enum
    required: true, // Обязательное поле
  },
  friendId: { type: String, required: false, ref: 'User' },
});

module.exports = mongoose.model('Widget', WidgetSchema);
