module.exports = {
    apps: [{
        name: 'pixelflow',
        script: 'server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
            MONGODB_URI: 'mongodb://localhost:27017/pixelflow'
        }
    }]
};
