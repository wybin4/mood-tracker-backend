const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventType: { type: mongoose.Schema.Types.ObjectId, ref: 'EventType', required: true },
  name: { type: String, required: true }, // Название события
  description: { type: String, default: '' }, // Описание события (необязательное)
  mids: { type: [mongoose.Schema.Types.ObjectId], ref: 'Mood', required: true }, // Массив идентификаторов синонимов
  createdAt: { type: Date, default: Date.now }, // Дата создания
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
