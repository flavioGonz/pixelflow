// eWeLink v2 OAuth2 Authorization Code Flow client.
// Reference: https://coolkit-technologies.github.io/eWeLink-API/#/en/oauth2.html
const crypto = require('crypto');
const https = require('https');

const EwelinkSettings = require('./EwelinkSettings');
const Sensor = require('./Sensor');

// Regional endpoints for API calls
const REGION_HOST = {
    cn: 'cn-apia.coolkit.cn',
    as: 'as-apia.coolkit.cc',
    us: 'us-apia.coolkit.cc',
    eu: 'eu-apia.coolkit.cc',
};

function httpJson(host, method, path, headers, body) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : '';
        const req = https.request({
            host,
            method,
            path,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
            },
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// HMAC-SHA256(base64) signature required by v2 API
function sign(payload, secret) {
    return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

class EwelinkClient {
    constructor() {
        this.creds = null;
        this.at = '';
        this.rt = '';
        this.tokenExpiresAt = 0;
        this.timer = null;
    }

    async loadCreds() {
        this.creds = await EwelinkSettings.findOne({});
        if (this.creds) {
            this.at = this.creds.accessToken || '';
            this.rt = this.creds.refreshToken || '';
            this.region = this.creds.region || 'us';
        }
        return this.creds;
    }

    async saveCreds(patch) {
        if (!this.creds) this.creds = new EwelinkSettings({});
        Object.assign(this.creds, patch);
        await this.creds.save();
        return this.creds;
    }

    _host() { return REGION_HOST[this.region || 'us'] || REGION_HOST.us; }
    _appId() { return (this.creds && this.creds.appId) || ''; }
    _appSecret() { return (this.creds && this.creds.appSecret) || ''; }

    enabled() { return !!(this.creds && this.creds.appId && this.creds.appSecret && this.creds.refreshToken); }

    // ==== OAuth2 flow ====

    // Build the URL to redirect the user to for authorization.
    buildAuthUrl(redirectUri, state) {
        const seq = String(Date.now());
        const clientId = this._appId();
        const appSecret = this._appSecret();
        if (!clientId || !appSecret || !redirectUri) return null;
        // Authorization signature: HMAC_SHA256(clientId + '_' + seq, appSecret), base64
        const authorization = sign(clientId + '_' + seq, appSecret);
        const params = new URLSearchParams({
            clientId,
            seq,
            authorization,
            redirectUrl: redirectUri,
            state: state || 'pf',
            grantType: 'authorization_code',
            nonce: crypto.randomBytes(4).toString('hex'),
            showQRCode: 'false',
        });
        return 'https://c2ccdn.coolkit.cc/oauth/index.html?' + params.toString();
    }

    // Exchange authorization code for access/refresh tokens.
    async exchangeCode(code, redirectUri, region) {
        this.region = region || this.region || 'us';
        const clientId = this._appId();
        const appSecret = this._appSecret();
        if (!clientId || !appSecret) return { ok: false, error: 'Faltan appId/appSecret' };

        const body = {
            clientId,
            clientSecret: appSecret,
            grantType: 'authorization_code',
            code,
            redirectUrl: redirectUri,
        };
        const bodyStr = JSON.stringify(body);
        const authorization = sign(bodyStr, appSecret);
        const res = await httpJson(this._host(), 'POST', '/v2/user/oauth/token', {
            'X-CK-Appid': clientId,
            'Authorization': 'Sign ' + authorization,
        }, body);

        if (res.status !== 200 || !res.body || res.body.error) {
            const err = (res.body && (res.body.msg || res.body.error)) || ('HTTP ' + res.status);
            await this.saveCreds({ lastLoginError: String(err) });
            return { ok: false, error: err, raw: res.body };
        }
        const data = res.body.data || res.body;
        this.at = data.accessToken || data.access_token;
        this.rt = data.refreshToken || data.refresh_token;
        this.tokenExpiresAt = Date.now() + ((data.atExpiredTime ? Math.floor((data.atExpiredTime - Date.now())) : 30 * 86400 * 1000));
        await this.saveCreds({
            accessToken: this.at,
            refreshToken: this.rt,
            region: this.region,
            lastLoginAt: new Date(),
            lastLoginError: '',
        });
        return { ok: true, region: this.region };
    }

    // Refresh access token using refresh token.
    async refreshAccessToken() {
        if (!this.rt) return { ok: false, error: 'No refresh token' };
        const clientId = this._appId();
        const appSecret = this._appSecret();
        const body = { rt: this.rt };
        const bodyStr = JSON.stringify(body);
        const authorization = sign(bodyStr, appSecret);
        const res = await httpJson(this._host(), 'POST', '/v2/user/refresh', {
            'X-CK-Appid': clientId,
            'Authorization': 'Sign ' + authorization,
        }, body);
        if (res.status !== 200 || !res.body || res.body.error) {
            return { ok: false, error: (res.body && res.body.msg) || 'refresh failed' };
        }
        const data = res.body.data || res.body;
        this.at = data.at || data.accessToken || this.at;
        this.rt = data.rt || data.refreshToken || this.rt;
        await this.saveCreds({ accessToken: this.at, refreshToken: this.rt });
        return { ok: true };
    }

    async apiGet(path) {
        if (!this.at) return { ok: false, error: 'Not authenticated' };
        let res = await httpJson(this._host(), 'GET', path, {
            'X-CK-Appid': this._appId(),
            'Authorization': 'Bearer ' + this.at,
        });
        if (res.status === 401 || (res.body && (res.body.error === 401 || res.body.error === '401'))) {
            const refr = await this.refreshAccessToken();
            if (!refr.ok) return { ok: false, error: 'Auth expired: ' + refr.error };
            res = await httpJson(this._host(), 'GET', path, {
                'X-CK-Appid': this._appId(),
                'Authorization': 'Bearer ' + this.at,
            });
        }
        if (res.status !== 200) return { ok: false, error: 'HTTP ' + res.status, raw: res.body };
        return { ok: true, data: (res.body && (res.body.data || res.body)) || null };
    }

    async fetchFamilies() {
        return this.apiGet('/v2/family');
    }

    async fetchDevices(familyId) {
        const q = familyId ? '?familyId=' + encodeURIComponent(familyId) : '';
        return this.apiGet('/v2/device/thing' + q);
    }

    async disconnect() {
        this.at = ''; this.rt = '';
        await this.saveCreds({ accessToken: '', refreshToken: '', lastLoginAt: null, lastLoginError: '' });
    }


    // Detect sensor kind from device params
    _detectKind(params) {
        if (!params) return { kind: 'GENERIC', param: '', unit: '' };
        if ('currentTemperature' in params) return { kind: 'TEMPERATURE', param: 'currentTemperature', unit: '°C' };
        if ('temperature' in params)         return { kind: 'TEMPERATURE', param: 'temperature',        unit: '°C' };
        if ('currentHumidity' in params)     return { kind: 'HUMIDITY',    param: 'currentHumidity',    unit: '%' };
        if ('humidity' in params)            return { kind: 'HUMIDITY',    param: 'humidity',           unit: '%' };
        if ('power' in params)               return { kind: 'POWER',       param: 'power',              unit: 'W' };
        if ('motion' in params || 'motionEvent' in params) return { kind: 'MOTION', param: 'motion',    unit: '' };
        if ('lock' in params || 'doorState' in params)     return { kind: 'CONTACT', param: 'lock',     unit: '' };
        if ('switch' in params)              return { kind: 'BINARY',      param: 'switch',             unit: '' };
        return { kind: 'GENERIC', param: '', unit: '' };
    }

    // Fetch all devices and upsert them as Sensor documents (idempotent on providerId).
    async importAllDevices() {
        if (!this.at) return { ok: false, error: 'No autenticado' };
        const dev = await this.fetchDevices();
        if (!dev.ok) return { ok: false, error: dev.error };
        const list = (dev.data && (dev.data.thingList || dev.data.list || dev.data)) || [];
        let created = 0, updated = 0;
        for (const item of list) {
            const t = item.itemData || item;
            const deviceid = t.deviceid;
            if (!deviceid) continue;
            const { kind, param, unit } = this._detectKind(t.params || {});
            let sensor = await Sensor.findOne({ provider: 'EWELINK', providerId: deviceid });
            if (!sensor) {
                sensor = new Sensor({
                    name: t.name || 'Sonoff ' + deviceid.slice(-4),
                    location: '',
                    kind,
                    unit,
                    provider: 'EWELINK',
                    providerId: deviceid,
                    providerParam: param,
                    isOnline: !!(t.online === undefined ? true : t.online),
                });
                await sensor.save();
                created++;
            } else {
                sensor.name = sensor.name || t.name || sensor.name;
                sensor.isOnline = !!(t.online === undefined ? true : t.online);
                if (!sensor.providerParam) sensor.providerParam = param;
                if (!sensor.unit) sensor.unit = unit;
                await sensor.save();
                updated++;
            }
        }
        return { ok: true, created, updated, total: list.length };
    }

    // Send a status update to a device (e.g. switch: 'on'/'off')
    async setDeviceParams(deviceid, params) {
        if (!this.at) return { ok: false, error: 'No autenticado' };
        const clientId = this._appId();
        const body = { type: 1, id: deviceid, params };
        const bodyStr = JSON.stringify(body);
        let res = await httpJson(this._host(), 'POST', '/v2/device/thing/status', {
            'X-CK-Appid': clientId,
            'Authorization': 'Bearer ' + this.at,
            'Content-Type': 'application/json',
        }, body);
        if (res.status === 401) {
            const r = await this.refreshAccessToken();
            if (!r.ok) return { ok: false, error: 'Auth expired' };
            res = await httpJson(this._host(), 'POST', '/v2/device/thing/status', {
                'X-CK-Appid': clientId,
                'Authorization': 'Bearer ' + this.at,
                'Content-Type': 'application/json',
            }, body);
        }
        if (res.status !== 200) return { ok: false, error: 'HTTP ' + res.status, raw: res.body };
        return { ok: true, data: res.body };
    }

    // Convenience: toggle a switch
    async setSwitch(deviceid, on) {
        return this.setDeviceParams(deviceid, { switch: on ? 'on' : 'off' });
    }

    // ==== Polling ====
    async pollOnce() {
        if (!this.enabled()) return;
        try {
            const dev = await this.fetchDevices();
            if (!dev.ok) { console.warn('[eWeLink poll] devices error:', dev.error); return; }
            const list = (dev.data && (dev.data.thingList || dev.data.list || dev.data)) || [];
            for (const item of list) {
                const t = item.itemData || item;
                const deviceid = t.deviceid || t.itemData?.deviceid;
                if (!deviceid) continue;
                const sensor = await Sensor.findOne({ providerId: deviceid, provider: 'EWELINK' });
                if (!sensor) continue;
                const params = t.params || {};
                let value = null;
                // Prefer the explicit providerParam if defined on the sensor
                if (sensor.providerParam && sensor.providerParam in params) {
                    const raw = params[sensor.providerParam];
                    value = (typeof raw === 'boolean') ? (raw ? 1 : 0) : (raw === 'on' ? 1 : (raw === 'off' ? 0 : raw));
                } else if (sensor.kind === 'TEMPERATURE') value = params.currentTemperature ?? params.temperature;
                else if (sensor.kind === 'HUMIDITY') value = params.currentHumidity ?? params.humidity;
                else if (sensor.kind === 'POWER')    value = params.power ?? params.watt;
                else if (sensor.kind === 'MOTION')   value = (params.motion || params.motionEvent) ? 1 : 0;
                else if (sensor.kind === 'CONTACT')  value = (params.lock || params.doorState) ? 1 : 0;
                else if (sensor.kind === 'BINARY')   value = (params.switch === 'on') ? 1 : 0;
                else if (sensor.kind === 'GENERIC') {
                    // For generic devices, save the first meaningful param
                    for (const k of Object.keys(params)) {
                        const v = params[k];
                        if (typeof v === 'number' || typeof v === 'boolean' || v === 'on' || v === 'off') {
                            value = (typeof v === 'boolean') ? (v ? 1 : 0) : (v === 'on' ? 1 : (v === 'off' ? 0 : v));
                            break;
                        }
                    }
                }
                if (value != null) {
                    sensor.lastValue = Number(value);
                    sensor.lastReadAt = new Date();
                    sensor.isOnline = !!(t.online === undefined ? true : t.online);
                    sensor.history = (sensor.history || []).slice(-99).concat([{ v: sensor.lastValue, t: new Date() }]);
                    await sensor.save();
                    if (process.env.EWE_DEBUG) console.log('[eWeLink] updated', sensor.name, '=', value);
                }
            }
        } catch (e) {
            console.warn('[eWeLink poll error]', e.message, e.stack);
        }
    }

    start(intervalMs) {
        if (this.timer) clearInterval(this.timer);
        const ms = intervalMs || (this.creds && this.creds.pollIntervalMs) || 60000;
        this.timer = setInterval(() => this.pollOnce(), ms);
        // Initial poll after 5s
        setTimeout(() => this.pollOnce(), 5000);
    }

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
}

module.exports = new EwelinkClient();
