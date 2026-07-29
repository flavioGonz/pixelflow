const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    value: { type: Number, required: true, min: 1, max: 5 },
    source: { type: String, default: 'default' },
    userAgent: { type: String, default: '' },
    at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
