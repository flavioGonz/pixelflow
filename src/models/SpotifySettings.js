const mongoose = require('mongoose');

const SpotifySettingsSchema = new mongoose.Schema({
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    redirectUri: { type: String, default: '' },
    // OAuth tokens (returned by /api/token exchange)
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    tokenExpiresAt: { type: Date, default: null },
    scope: { type: String, default: 'user-read-currently-playing user-read-playback-state playlist-read-private' },
    userDisplayName: { type: String, default: '' },
    userProfileUrl: { type: String, default: '' },
    lastAuthAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.SpotifySettings || mongoose.model('SpotifySettings', SpotifySettingsSchema);
