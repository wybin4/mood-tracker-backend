const mongoose = require('mongoose');

const MoodTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  disabled_icon: { type: String, required: true },
  icon: { type: String, required: true },
  gradientColor: { type: String, required: true },
  primaryColor: { type: String, required: true },
  background: { type: [String], required: true },
});

const MoodType = mongoose.model('MoodType', MoodTypeSchema);

async function initializeDefaultMoodTypes() {
  const defaultMoodTypes = [
    { name: 'Злость', disabled_icon: 'anger_disabled', icon: 'anger', gradientColor: '0xFFFF9480', primaryColor: '0xFFED6965', background: ['0xFFFFEDBF', '0xFFFDA47C'] },
    { name: 'Грусть', disabled_icon: 'sadness_disabled', icon: 'sadness', gradientColor: '0xFFC4B4FD', primaryColor: '0xFF345FA4', background: ['0xFFCFCAE7', '0xFF8EA7CF'] },
    { name: 'Спокойствие', disabled_icon: 'calmness_disabled', icon: 'calmness', gradientColor: '0xFF5DD985', primaryColor: '0xFF169B6E', background: ['0xFFE2E9CA', '0xFF8CCEAA'] },
    { name: 'Радость', disabled_icon: 'joy_disabled', icon: 'joy', gradientColor: '0xFFFFEC71', primaryColor: '0xFFFFC900', background: ['0xFFFFEFBC', '0xFFFFF73A'] },
    { name: 'Усталость', disabled_icon: 'fatigue_disabled', icon: 'fatigue', gradientColor: '0xFFE88EE9', primaryColor: '0xFF80359E', background: ['0xFFE9CADC', '0xFF9D8CD0'] },
  ];

  try {
    const existingTypes = await MoodType.find();
    if (existingTypes.length === 0) {
      await MoodType.insertMany(defaultMoodTypes);
      console.log('Default mood types have been added.');
    } else {
      console.log('Default mood types already exist.');
    }
  } catch (error) {
    console.error('Error initializing default mood types:', error);
  }
}

module.exports = { MoodType, initializeDefaultMoodTypes };
