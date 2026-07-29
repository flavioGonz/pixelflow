const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelflow')
    .then(async () => {
        console.log('Connected to MongoDB');
        const users = await User.find({}, 'email');
        console.log('Users found:', users);
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
