/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['lucide-react'],
    // Allow Turbopack dev overlay + HMR from LAN clients (LXC IP, your dev machine, common ranges)
    allowedDevOrigins: [
        '192.168.99.12',
        '192.168.99.0/24',
        '192.168.0.0/16',
        '10.0.0.0/8',
        '*.local',
    ],
};

module.exports = nextConfig;
