// Spotify OAuth routes — extracted from server.js.
// deps: { app: expressApp, SpotifySettings }
module.exports = function registerSpotifyRoutes({ app: expressApp, SpotifySettings }) {

        // Spotify OAuth (admin — Client Credentials + Auth Code Flow)
        // ==========================================================
        expressApp.get('/api/spotify/settings', async (req, res) => {
            try {
                const st = await SpotifySettings.findOne({}) || {};
                res.json({
                    clientId: st.clientId || '',
                    clientSecret: st.clientSecret ? '••••••••' : '',
                    redirectUri: st.redirectUri || '',
                    scope: st.scope || '',
                    connected: !!st.refreshToken,
                    userDisplayName: st.userDisplayName || '',
                    userProfileUrl: st.userProfileUrl || '',
                    lastAuthAt: st.lastAuthAt,
                    lastError: st.lastError || '',
                });
            } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
        });
    
        expressApp.post('/api/spotify/settings', async (req, res) => {
            try {
                const { clientId, clientSecret, redirectUri, scope } = req.body || {};
                let st = await SpotifySettings.findOne({}) || new SpotifySettings({});
                if (clientId != null)    st.clientId = clientId;
                if (clientSecret && clientSecret !== '••••••••') st.clientSecret = clientSecret;
                if (redirectUri != null) st.redirectUri = redirectUri;
                if (scope != null)       st.scope = scope;
                await st.save();
                res.json({ ok: true });
            } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
        });
    
        // Generate Spotify auth URL (redirect target for /authorize)
        expressApp.get('/api/spotify/auth-url', async (req, res) => {
            try {
                const st = await SpotifySettings.findOne({});
                if (!st || !st.clientId || !st.redirectUri) return res.status(400).json({ error: 'Faltan clientId o redirectUri' });
                const params = new URLSearchParams({
                    client_id: st.clientId,
                    response_type: 'code',
                    redirect_uri: st.redirectUri,
                    scope: st.scope || 'user-read-currently-playing user-read-playback-state playlist-read-private',
                    show_dialog: 'true',
                });
                res.json({ url: 'https://accounts.spotify.com/authorize?' + params.toString() });
            } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
        });
    
        // OAuth callback endpoint — Spotify redirects here with `code`
        expressApp.get('/api/spotify/callback', async (req, res) => {
            try {
                const { code, error } = req.query;
                const st = await SpotifySettings.findOne({});
                if (error) {
                    if (st) { st.lastError = String(error); await st.save(); }
                    return res.redirect('/admin/settings/spotify?error=' + encodeURIComponent(String(error)));
                }
                if (!code || !st || !st.clientId || !st.clientSecret || !st.redirectUri) {
                    return res.status(400).send('Faltan credenciales o code');
                }
                const basic = Buffer.from(st.clientId + ':' + st.clientSecret).toString('base64');
                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: String(code),
                    redirect_uri: st.redirectUri,
                });
                const tokRes = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + basic,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body.toString(),
                });
                const tok = await tokRes.json();
                if (!tokRes.ok) {
                    st.lastError = tok.error_description || tok.error || 'token exchange failed';
                    await st.save();
                    return res.redirect('/admin/settings/spotify?error=' + encodeURIComponent(st.lastError));
                }
                st.accessToken = tok.access_token;
                st.refreshToken = tok.refresh_token || st.refreshToken;
                st.tokenExpiresAt = new Date(Date.now() + (tok.expires_in * 1000));
                st.scope = tok.scope || st.scope;
                st.lastAuthAt = new Date();
                st.lastError = '';
                // Get user profile
                try {
                    const meRes = await fetch('https://api.spotify.com/v1/me', {
                        headers: { 'Authorization': 'Bearer ' + st.accessToken }
                    });
                    if (meRes.ok) {
                        const me = await meRes.json();
                        st.userDisplayName = me.display_name || me.id || '';
                        st.userProfileUrl = (me.external_urls && me.external_urls.spotify) || '';
                    }
                } catch (_) {}
                await st.save();
                res.redirect('/admin/settings/spotify?connected=1');
            } catch (e) {
                console.error(e);
                res.status(500).send('Error: ' + e.message);
            }
        });
    
        // Disconnect
        expressApp.post('/api/spotify/disconnect', async (req, res) => {
            try {
                let st = await SpotifySettings.findOne({});
                if (st) {
                    st.accessToken = '';
                    st.refreshToken = '';
                    st.tokenExpiresAt = null;
                    st.userDisplayName = '';
                    st.userProfileUrl = '';
                    st.lastAuthAt = null;
                    await st.save();
                }
                res.json({ ok: true });
            } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
        });

    // Refresh access token using refresh token (Spotify OAuth)
    async function refreshSpotifyToken(st) {
        if (!st.refreshToken || !st.clientId || !st.clientSecret) return { ok: false, error: 'Missing credentials' };
        const basic = Buffer.from(st.clientId + ':' + st.clientSecret).toString('base64');
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: st.refreshToken,
        });
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + basic, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        const tok = await res.json();
        if (!res.ok) return { ok: false, error: tok.error_description || tok.error || 'refresh failed' };
        st.accessToken = tok.access_token;
        if (tok.refresh_token) st.refreshToken = tok.refresh_token;
        st.tokenExpiresAt = new Date(Date.now() + (tok.expires_in * 1000));
        await st.save();
        return { ok: true };
    }

    async function ensureFreshToken(st) {
        const expiresAt = st.tokenExpiresAt ? new Date(st.tokenExpiresAt).getTime() : 0;
        if (!st.accessToken || expiresAt - Date.now() < 60_000) {
            return await refreshSpotifyToken(st);
        }
        return { ok: true };
    }

    // Currently playing track (for MUSIC_PLAYER widget)
    expressApp.get('/api/spotify/current', async (req, res) => {
        try {
            const st = await SpotifySettings.findOne({});
            if (!st || !st.refreshToken) return res.json({ ok: false, error: 'No conectado', connected: false });
            const r = await ensureFreshToken(st);
            if (!r.ok) return res.json({ ok: false, error: r.error });
            const meRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: { 'Authorization': 'Bearer ' + st.accessToken },
            });
            if (meRes.status === 204) return res.json({ ok: true, playing: false });
            if (!meRes.ok) return res.json({ ok: false, error: 'Spotify API ' + meRes.status });
            const data = await meRes.json();
            const item = data.item || {};
            res.json({
                ok: true,
                playing: !!data.is_playing,
                progressMs: data.progress_ms || 0,
                durationMs: item.duration_ms || 0,
                track: item.name || '',
                artists: (item.artists || []).map(a => a.name).join(', '),
                album: (item.album && item.album.name) || '',
                cover: (item.album && item.album.images && item.album.images[0] && item.album.images[0].url) || '',
                url: (item.external_urls && item.external_urls.spotify) || '',
            });
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });

    // User playlists (for MUSIC_PLAYER admin panel)
    expressApp.get('/api/spotify/playlists', async (req, res) => {
        try {
            const st = await SpotifySettings.findOne({});
            if (!st || !st.refreshToken) return res.json({ ok: false, error: 'No conectado' });
            const r = await ensureFreshToken(st);
            if (!r.ok) return res.json({ ok: false, error: r.error });
            const pRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
                headers: { 'Authorization': 'Bearer ' + st.accessToken },
            });
            if (!pRes.ok) return res.json({ ok: false, error: 'Spotify API ' + pRes.status });
            const data = await pRes.json();
            res.json({
                ok: true,
                playlists: (data.items || []).map(pl => ({
                    id: pl.id,
                    name: pl.name,
                    uri: pl.uri,
                    tracks: (pl.tracks && pl.tracks.total) || 0,
                    image: (pl.images && pl.images[0] && pl.images[0].url) || '',
                })),
            });
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });
};
