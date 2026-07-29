const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    time: { type: String },
    desc: { type: String },
    photo: { type: String },
    category: { type: String },
    day: { type: String },
    isWeekly: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
