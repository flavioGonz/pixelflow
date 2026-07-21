const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    screenId: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    isAuthorized: { type: Boolean, default: false },
    lastLayoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Layout' },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    lastSeen: { type: Date, default: Date.now },
    viewport: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        orientation: { type: String, default: 'landscape' },
    },
    userAgent: { type: String, default: '' },
});

module.exports = mongoose.models.Screen || mongoose.model('Screen', ScreenSchema);
