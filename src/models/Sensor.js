const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
    ts: { type: Date, default: Date.now },
    value: mongoose.Schema.Types.Mixed,   // number, boolean, object
    unit: String,
}, { _id: false });

const SensorSchema = new mongoose.Schema({
    // Human-friendly identity
    name:        { type: String, required: true },       // "Hall temperatura"
    slug:        { type: String, default: '' },
    location:    { type: String, default: '' },          // "Hall principal", "Habitación 101"

    // What kind of sensor
    kind:        { type: String, enum: ['TEMPERATURE', 'HUMIDITY', 'MOTION', 'CONTACT', 'POWER', 'BINARY', 'GENERIC'], default: 'TEMPERATURE' },
    unit:        { type: String, default: '°C' },        // "°C", "%", "W", ...

    // Provider integration (ewelink initially)
    provider:    { type: String, enum: ['EWELINK', 'MOCK', 'MQTT'], default: 'EWELINK' },
    providerId:  { type: String, default: '' },          // deviceid en eWeLink
    providerParam: { type: String, default: '' },        // sub-key en el params (ej. "currentTemperature")

    // Latest reading + short history
    lastValue:   mongoose.Schema.Types.Mixed,
    lastUnit:    { type: String, default: '' },
    lastReadAt:  Date,
    history:     { type: [SensorReadingSchema], default: [] },

    // Display defaults (widget uses these unless overridden)
    displayColor:    { type: String, default: '#3b82f6' },
    displayIcon:     { type: String, default: 'Thermometer' },
    precision:       { type: Number, default: 1 },
    lowThreshold:    Number,
    highThreshold:   Number,

    // Ownership / status
    isOnline:    { type: Boolean, default: false },
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
});

SensorSchema.pre('save', async function () { this.updatedAt = Date.now(); });

module.exports = mongoose.models.Sensor || mongoose.model('Sensor', SensorSchema);
