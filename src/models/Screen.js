const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    screenId: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    isAuthorized: { type: Boolean, default: false },
    lastLayoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Layout' },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    lastSeen: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Screen || mongoose.model('Screen', ScreenSchema);
