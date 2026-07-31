/** @type {import('next').NextConfig} */
const _fs = require('fs');
const _path = require('path');

// Reutilizar BUILD_ID persistente si existe, sino generar uno nuevo
let _buildId = process.env.NEXT_BUILD_ID;
try {
    const bp = _path.join(__dirname, '.next-buildid');
    if (!_buildId && _fs.existsSync(bp)) _buildId = _fs.readFileSync(bp, 'utf8').trim();
} catch {}
if (!_buildId) _buildId = 'pf' + Date.now();
try {
    _fs.writeFileSync(_path.join(__dirname, '.next-buildid'), _buildId);
} catch {}

const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['lucide-react'],
    // KEY: assetPrefix hace que Next genere todos los URLs de chunks bajo /pfa-BUILDID/
    // NPM/OpenResty nunca vio este path → sirve todo fresh → adiós chunk 404 zombie
    assetPrefix: '/pfa-' + _buildId,
    generateBuildId: async () => _buildId,
    allowedDevOrigins: [
        '192.168.99.12',
        '192.168.99.0/24',
        '192.168.0.0/16',
        '10.0.0.0/8',
        '*.local',
    ],
};

module.exports = nextConfig;
