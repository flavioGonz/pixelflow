const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pixelflow')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const createSpecificUser = async () => {
    try {
        const email = 'fgonzalez'; // Username requested by user, treating as email/username field
        const password = 'flavio20';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User fgonzalez already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Password updated successfully');
        } else {
            // Create new user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                email,
                password: hashedPassword
            });

            await user.save();
            console.log('User fgonzalez created successfully');
        }

    } catch (err) {
        console.error('Error seeding user:', err);
    } finally {
        mongoose.disconnect();
    }
};

createSpecificUser();
