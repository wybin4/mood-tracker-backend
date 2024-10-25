const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { Mood } = require('../models/Mood'); // Импортируем модель Mood

router.post('/add', async (req, res) => {
  const { eventType, name, description, mids } = req.body;

  if (!eventType || !name || !mids) {
    return res.status(400).json({ message: 'eventType, name, and mids are required' });
  }

  try {
    // Проверяем, существуют ли все идентификаторы настроений
    const existingMoods = await Mood.find({ _id: { $in: mids } });
    if (existingMoods.length !== mids.length) {
      return res.status(400).json({ message: 'Some mood ids do not exist' });
    }

    const newEvent = new Event({
      eventType,
      name,
      description,
      mids,
    });
    await newEvent.save();
    return res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Эндпоинт для удаления отдельных событий
router.delete('/delete', async (req, res) => {
  const { ids } = req.body; // Получаем массив идентификаторов из тела запроса

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs are required and must be an array' });
  }

  try {
    const deletedEvents = await Event.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({ message: 'Events deleted successfully', deletedCount: deletedEvents.deletedCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Эндпоинт для удаления всех событий за сегодняшний день
router.delete('/delete/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Начало дня
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Конец дня

    const deletedEvents = await Event.deleteMany({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return res.status(200).json({ message: 'Events deleted successfully', deletedCount: deletedEvents.deletedCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/list', async (req, res) => {
  try {
    const events = await Event.aggregate([
      {
        $lookup: {
          from: "eventtypes",
          localField: "eventType",
          foreignField: "_id",
          as: "eventTypeDefault"
        }
      },
      {
        $lookup: {
          from: "moods",
          localField: "mids",
          foreignField: "_id",
          as: "moodDetails"
        }
      },
      {
        $lookup: {
          from: "moodtypes",
          localField: "moodDetails.moodTypeId",
          foreignField: "_id",
          as: "moodTypeDetails"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          eventTypeNames: {
            $map: {
              input: "$eventTypeDefault",
              as: "eventType",
              in: "$$eventType.name"
            }
          },
          moods: {
            $map: {
              input: "$moodTypeDetails",
              as: "moodType",
              in: {
                _id: "$$moodType._id",
                name: "$$moodType.name",
                details: {
                  $map: {
                    input: "$moodDetails",
                    as: "moodDetail",
                    in: "$$moodDetail.synonym"
                  }
                }
              }
            }
          }
        }
      }
    ]);

    return res.status(200).json(events);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
