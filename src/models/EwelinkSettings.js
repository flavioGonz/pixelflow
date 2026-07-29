const mongoose = require('mongoose');

const EwelinkSettingsSchema = new mongoose.Schema({
    // eWeLink credentials
    email:       { type: String, default: '' },
    password:    { type: String, default: '' },   // stored plain — user's own credentials, self-hosted server
    countryCode: { type: String, default: '+598' },
    appId:       { type: String, default: '' },
    appSecret:   { type: String, default: '' },
    region:      { type: String, default: 'us' }, // 'us' | 'eu' | 'as' | 'cn'

    // Session tokens (managed by client)
    accessToken:  { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    lastLoginAt:  Date,
    lastLoginError: { type: String, default: '' },

    // Polling
    pollIntervalMs: { type: Number, default: 60000 },
    enabled:        { type: Boolean, default: false },
});

module.exports = mongoose.models.EwelinkSettings || mongoose.model('EwelinkSettings', EwelinkSettingsSchema);
