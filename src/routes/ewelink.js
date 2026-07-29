// eWeLink OAuth2 routes — extracted from server.js.
// Requires deps: { app: expressApp, ewe, io }.
module.exports = function registerEwelinkRoutes({ app: expressApp, ewe, io }) {

    const EwelinkSettings = require('../models/EwelinkSettings');

    expressApp.get('/api/ewelink/settings', async (req, res) => {
        try {
            const st = (await EwelinkSettings.findOne({})) || {};
            res.json({
                appId: st.appId || '',
                appSecret: st.appSecret ? '••••••••' : '',
                region: st.region || 'us',
                pollIntervalMs: st.pollIntervalMs || 60000,
                enabled: !!st.enabled,
                connected: !!st.refreshToken,
                lastLoginAt: st.lastLoginAt || null,
                lastLoginError: st.lastLoginError || '',
                email: st.email || '',
                password: st.password ? '••••••••' : '',
                countryCode: st.countryCode || '+598',
            });
        } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
    });

    expressApp.post('/api/ewelink/settings', async (req, res) => {
        try {
            const { appId, appSecret, region, pollIntervalMs, enabled } = req.body || {};
            let st = await EwelinkSettings.findOne({}) || new EwelinkSettings({});
            if (appId != null) st.appId = appId;
            if (appSecret && appSecret !== '••••••••') st.appSecret = appSecret;
            if (region != null) st.region = region;
            if (pollIntervalMs != null) st.pollIntervalMs = parseInt(pollIntervalMs) || 60000;
            if (enabled != null) st.enabled = !!enabled;
            await st.save();
            await ewe.loadCreds();
            res.json({ ok: true });
        } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
    });

    expressApp.get('/api/ewelink/auth-url', async (req, res) => {
        try {
            await ewe.loadCreds();
            const region = req.query.region || (ewe.creds && ewe.creds.region) || 'us';
            const forwardedProto = req.get('x-forwarded-proto');
            const host = req.get('host') || '';
            const proto = forwardedProto || (host.includes('altosdelarapey.infratec.com.uy') || host.includes('.com') ? 'https' : req.protocol);
            const redirect = proto + '://' + host + '/api/ewelink/callback';
            ewe.region = String(region);
            const url = ewe.buildAuthUrl(redirect, 'pf-' + Date.now());
            if (!url) return res.status(400).json({ error: 'Faltan appId/appSecret' });
            await ewe.saveCreds({ region: String(region) });
            res.json({ url, redirectUri: redirect, region });
        } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
    });

    expressApp.get('/api/ewelink/callback', async (req, res) => {
        try {
            const { code, region } = req.query;
            if (!code) return res.status(400).send('Falta code en la URL de callback');
            await ewe.loadCreds();
            const forwardedProto = req.get('x-forwarded-proto');
            const host = req.get('host') || '';
            const proto = forwardedProto || (host.includes('altosdelarapey.infratec.com.uy') || host.includes('.com') ? 'https' : req.protocol);
            const redirect = proto + '://' + host + '/api/ewelink/callback';
            const r = await ewe.exchangeCode(String(code), redirect, String(region || (ewe.creds && ewe.creds.region) || 'us'));
            if (!r.ok) return res.redirect('/admin/settings/integrations/ewelink?error=' + encodeURIComponent(r.error));
            await ewe.saveCreds({ enabled: true });
            ewe.start();
            try {
                const imp = await ewe.importAllDevices();
                console.log('[eWeLink] auto-import:', imp);
                const q = imp.ok ? '&imported=' + imp.total + '&created=' + imp.created : '';
                res.redirect('/admin/settings/integrations/ewelink?connected=1' + q);
            } catch (e) {
                console.error('[eWeLink import error]', e);
                res.redirect('/admin/settings/integrations/ewelink?connected=1');
            }
        } catch (e) {
            console.error(e);
            res.status(500).send('Error: ' + e.message);
        }
    });

    expressApp.post('/api/ewelink/disconnect', async (req, res) => {
        try {
            await ewe.loadCreds();
            await ewe.disconnect();
            ewe.stop();
            res.json({ ok: true });
        } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
    });

    expressApp.post('/api/ewelink/test-login', async (req, res) => {
        try {
            await ewe.loadCreds();
            if (!ewe.rt) return res.status(400).json({ ok: false, error: 'Aún no conectaste tu cuenta. Usá "Conectar cuenta eWeLink"' });
            const r = await ewe.refreshAccessToken();
            if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
            res.json({ ok: true, msg: 'Token refresh OK' });
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });

    expressApp.post('/api/ewelink/import-all', async (req, res) => {
        try {
            await ewe.loadCreds();
            if (!ewe.at) return res.status(400).json({ ok: false, error: 'No autenticado' });
            const r = await ewe.importAllDevices();
            res.json(r);
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });

    expressApp.get('/api/ewelink/devices', async (req, res) => {
        try {
            await ewe.loadCreds();
            if (!ewe.at) return res.status(400).json({ ok: false, error: 'No conectado. Autorizá primero.' });
            const fams = await ewe.fetchFamilies();
            const devs = await ewe.fetchDevices();
            res.json({ ok: true, families: fams.data, devices: devs.data });
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });

    expressApp.post('/api/ewelink/action', async (req, res) => {
        try {
            const { deviceid, params, sensorId } = req.body || {};
            await ewe.loadCreds();
            if (!ewe.at) return res.status(400).json({ ok: false, error: 'No conectado' });
            let did = deviceid;
            if (!did && sensorId) {
                const Sensor = require('../models/Sensor');
                const sensor = await Sensor.findById(sensorId);
                if (!sensor) return res.status(404).json({ ok: false, error: 'Sensor no encontrado' });
                did = sensor.providerId;
            }
            if (!did) return res.status(400).json({ ok: false, error: 'Falta deviceid o sensorId' });
            const r = await ewe.setDeviceParams(did, params || {});
            res.json(r);
        } catch (e) { console.error(e); res.status(500).json({ ok: false, error: e.message }); }
    });
};
