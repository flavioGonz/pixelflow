const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    events: [{
        dayOfWeek: { type: Number, required: true }, // 0-6 (Sun-Sat)
        startTime: { type: String, required: true }, // "HH:mm"
        endTime: { type: String, required: true },   // "HH:mm"
        layoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Layout', required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
