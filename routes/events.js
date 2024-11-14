const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { MoodType } = require('../models/MoodType');
const { EventType } = require('../models/EventType');
const mongoose = require('mongoose');
const { Mood } = require('../models/Mood'); // Импортируем модель Mood
const { ObjectId } = mongoose.Types;

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

// router.get('/list', async (req, res) => {
//   try {
//     const events = await Event.aggregate([
//       {
//         $lookup: {
//           from: "eventtypes",
//           localField: "eventType",
//           foreignField: "_id",
//           as: "eventTypeDefault"
//         }
//       },
//       {
//         $lookup: {
//           from: "moods",
//           localField: "mids",
//           foreignField: "_id",
//           as: "moodDetails"
//         }
//       },
//       {
//         $lookup: {
//           from: "moodtypes",
//           localField: "moodDetails.moodTypeId",
//           foreignField: "_id",
//           as: "moodTypeDetails"
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           description: 1,
//           createdAt: 1,
//           eventTypeNames: {
//             $map: {
//               input: "$eventTypeDefault",
//               as: "eventType",
//               in: "$$eventType.name"
//             }
//           },
//           moods: {
//             $map: {
//               input: "$moodTypeDetails",
//               as: "moodType",
//               in: {
//                 _id: "$$moodType._id",
//                 name: "$$moodType.name",
//                 details: {
//                   $map: {
//                     input: "$moodDetails",
//                     as: "moodDetail",
//                     in: "$$moodDetail.synonym"
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     ]);

//     return res.status(200).json(events);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Ошибка сервера' });
//   }
// });

function parseDate(input) {
  const formats = [
    { regex: /^\d{2}-\d{2}-\d{4}$/, separator: '-', isReversed: true },
    { regex: /^\d{2}\.\d{2}\.\d{4}$/, separator: '.', isReversed: true },
    { regex: /^\d{4}-\d{2}-\d{2}$/, separator: '-', isReversed: false },
    { regex: /^\d{2}\/\d{2}\/\d{4}$/, separator: '/', isReversed: true }
  ];

  for (const { regex, separator, isReversed } of formats) {
    if (regex.test(input)) {
      const parts = input.split(separator);
      if (isReversed) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        return new Date(input);
      }
    }
  }

  return null;
}

router.post('/list/by-day', async (req, res) => {
  const { day } = req.body;

  if (!day) {
    return res.status(400).json({ message: 'Не указана дата' });
  }

  try {
    const parsedDate = parseDate(day);

    if (!parsedDate) {
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const startDate = new Date(parsedDate);
    const endDate = new Date(parsedDate);
    endDate.setDate(startDate.getDate() + 1);

    const events = await Event.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate
          }
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
          createdAt: 1,
          moods: {
            $map: {
              input: "$moodDetails",
              as: "moodDetail",
              in: "$$moodDetail.synonym"
            }
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ]);

    return res.status(200).json(events);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/get/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Неверный формат ID' });
    }

    const event = await Event.aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
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


    if (!event || event.length === 0) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    return res.status(200).json(event[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/list-mood-types', async (req, res) => {
  try {
    const moodTypesWithSynonyms = await MoodType.aggregate([
      {
        $lookup: {
          from: 'moods',
          localField: '_id',
          foreignField: 'moodTypeId',
          as: 'synonyms',
        },
      },
      {
        $project: {
          name: 1,
          disabled_icon: 1,
          icon: 1,
          gradientColor: 1,
          primaryColor: 1,
          background: 1,
          synonyms: {
            $map: {
              input: '$synonyms',
              as: 'synonym',
              in: {
                _id: '$$synonym._id',
                synonym: '$$synonym.synonym',
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json(moodTypesWithSynonyms);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/list-dates-with-events-for-week', async (req, res) => {
  try {
    const { date } = req.body;

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const startOfWeek = new Date(parsedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const events = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $project: {
          _id: 0,
          createdAt: { $dateToString: { format: "%d.%m.%Y", date: "$createdAt" } },
        },
      },
      {
        $group: {
          _id: "$createdAt",
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const datesWithEvents = events.map(event => event._id);

    return res.status(200).json({ dates: datesWithEvents });
  } catch (error) {
    console.error('Error fetching dates with events:', error);
    return res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});


router.get('/list-event-types', async (req, res) => {
  try {
    const eventTypes = await EventType.find();
    return res.status(200).json(eventTypes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
