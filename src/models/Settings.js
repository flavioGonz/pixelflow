const mongoose = require('mongoose');

const MediaItemSchema = new mongoose.Schema({
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    durationMs: { type: Number, default: 8000 },
}, { _id: false });

const BottomNavItemSchema = new mongoose.Schema({
    icon: { type: String, default: 'Home' },
    label: { type: String, default: '' },
    action: { type: String, enum: ['GO_TO', 'BACK', 'HOME'], default: 'GO_TO' },
    layoutId: { type: String, default: '' },
    color: { type: String, default: '' },
    children: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { _id: false });

const BottomNavSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    showLabels: { type: Boolean, default: true },
    accentColor: { type: String, default: '#0ea5e9' },
    theme: { type: String, enum: ['glass', 'solid-dark', 'solid-light'], default: 'glass' },
    items: [BottomNavItemSchema],
    iconLibrary: [{ type: String }],
}, { _id: false });

const ScreensaverSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    idleMs: { type: Number, default: 30000 },
    rotateMs: { type: Number, default: 10000 },
    layoutIds: [{ type: String }],
    layoutDurationsMs: { type: mongoose.Schema.Types.Mixed, default: {} },
    mediaItems: [MediaItemSchema],
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, default: 'global' },
    screensaver: { type: ScreensaverSchema, default: () => ({}) },
    bottomNav: { type: BottomNavSchema, default: () => ({}) },
    updatedAt: { type: Date, default: Date.now },
});

SettingsSchema.pre('save', async function () { this.updatedAt = Date.now(); });

module.exports = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
