const mongoose = require('mongoose');

const WidgetSchema = new mongoose.Schema({
    id: String,
    type: { type: String, enum: ['VIDEO', 'PRICE_LIST', 'SLIDER', 'TEXT', 'WEATHER', 'ACTIVITIES', 'PRODUCT_LIST', 'QR_CODE', 'CATEGORY_NAV', 'NAV_BUTTON'] },
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    zIndex: { type: Number, default: 1 },
    blur: { type: Number, default: 0 },
    data: mongoose.Schema.Types.Mixed,
}, { _id: false });

const LayoutSchema = new mongoose.Schema({
    name: { type: String, required: true },
    orientation: { type: String, enum: ['landscape', 'portrait'], default: 'landscape' },
    widgets: [WidgetSchema],
    backgroundColor: { type: String, default: '#000000' },
    backgroundImage: String,
    backgroundVideo: String,
    backgroundBlur: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

LayoutSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.models.Layout || mongoose.model('Layout', LayoutSchema);
