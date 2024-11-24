const mongoose = require('mongoose');

const EventTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const EventType = mongoose.model('EventType', EventTypeSchema);

const defaultEventTypes = [
    { name: 'Работа' },
    { name: 'Учеба' },
    { name: 'Отношения' },
    { name: 'Здоровье' },
    { name: 'Хобби' },
    { name: 'Жизнь' },
];

const initializeEventTypes = async () => {
    try {
        const existingEventTypes = await EventType.find();
        if (existingEventTypes.length === 0) {
            await EventType.insertMany(defaultEventTypes);
            console.log('Event types initialized');
        } else {
            console.log('Event types already exist');
        }
    } catch (error) {
        console.error('Error initializing event types:', error);
    }
};

module.exports = { EventType, initializeEventTypes };
