const mongoose = require('mongoose');

const VidgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: {
    type: String,
    enum: ['with_friend', 'without_friend'], // Определяем типы виджетов как enum
    required: true, // Обязательное поле
  },
  friendId: { type: String, required: false },
});

module.exports = mongoose.model('Vidget', VidgetSchema);
