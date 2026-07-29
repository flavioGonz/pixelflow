const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    type: { type: String, enum: ['day', 'week', 'month'], default: 'week' },
    name: { type: String, required: true },
    events: [{
        dayOfWeek: { type: Number, required: true }, // 0-6 (Sun-Sat)
        startTime: { type: String, required: true }, // "HH:mm"
        endTime: { type: String, required: true },   // "HH:mm"
        layoutId: { type: String, required: true }   // Changed to String for flexibility
    }],
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

ScheduleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
