require('dotenv').config();
const http = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Layout = require('./src/models/Layout');
const Screen = require('./src/models/Screen');
const Schedule = require('./src/models/Schedule');
const multer = require('multer');
const path = require('path');
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./src/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

nextApp.prepare().then(() => {
    const expressApp = express();
    const server = http.createServer(expressApp);

    // Logging middleware
    expressApp.use((req, res, next) => {
        // console.log(`${req.method} ${req.url}`);
        next();
    });

    expressApp.use(express.json());
    expressApp.use(cookieParser());

    // --- AUTHENTICATION ROUTES ---

    expressApp.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
                sameSite: 'strict'
            });

            res.json({ user: { email: user.email } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    expressApp.post('/api/auth/logout', (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logged out' });
    });

    expressApp.get('/api/auth/me', async (req, res) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            res.json({ user });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });

    // Serve static files from /uploads
    expressApp.use('/uploads', express.static(uploadDir));

    // API Upload
    expressApp.post('/api/upload', upload.single('image'), (req, res) => {
        console.log('Upload request received');
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log('File uploaded successfully:', req.file.filename);
        res.json({ url: `/uploads/${req.file.filename}` });
    });

    // Next.js handler (Regex catch-all for Express 5 support)
    expressApp.all(/.*/, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    io.on('connection', (socket) => {
        // console.log('Client connected:', socket.id);

        // Register a screen to its own room
        socket.on('register_screen', async (data) => {
            try {
                const { screenId } = data;
                socket.join(`screen_${screenId}`);

                // Find or create screen
                let screen = await Screen.findOne({ screenId });
                if (!screen) {
                    screen = await Screen.create({ screenId });
                } else {
                    screen.lastSeen = Date.now();
                    await screen.save();
                }

                console.log(`Screen ${screenId} registered. Authorized: ${screen.isAuthorized}`);

                // If screen is authorized and has a last layout, send it
                if (screen.isAuthorized && screen.lastLayoutId) {
                    const layout = await Layout.findById(screen.lastLayoutId);
                    if (layout) {
                        socket.emit('update_layout', layout);
                    }
                }

                // Inform admins about screen status
                const screens = await Screen.find();
                io.emit('screens_list', screens);
            } catch (err) {
                console.error('Error in register_screen:', err);
            }
        });

        // Request a specific layout (for interactive navigation)
        socket.on('request_layout', async (data) => {
            try {
                const { screenId, layoutId } = data;
                const layout = await Layout.findById(layoutId);
                if (layout) {
                    io.to(`screen_${screenId}`).emit('update_layout', layout);
                }
            } catch (err) {
                console.error('Error in request_layout:', err);
            }
        });

        // Push live content (without saving necessarily, for preview)
        socket.on('update_content', (data) => {
            const { screenId, layout } = data;
            io.to(`screen_${screenId}`).emit('update_layout', layout);
        });

        // Save and push layout
        socket.on('save_layout', async (data) => {
            try {
                const { screenId, layout } = data;

                // Save to DB
                let savedLayout;
                if (layout._id && mongoose.Types.ObjectId.isValid(layout._id)) {
                    savedLayout = await Layout.findByIdAndUpdate(layout._id, layout, { new: true });
                } else {
                    savedLayout = await Layout.findOneAndUpdate(
                        { name: layout.name },
                        layout,
                        { upsert: true, new: true }
                    );
                }

                console.log(`Layout "${layout.name}" saved to DB.`);

                // Push update to the specific screen
                if (screenId) {
                    io.to(`screen_${screenId}`).emit('update_layout', savedLayout);

                    // Update screen lastLayoutId
                    await Screen.findOneAndUpdate(
                        { screenId },
                        { lastLayoutId: savedLayout._id, lastSeen: Date.now() }
                    );
                    const screens = await Screen.find();
                    io.emit('screens_list', screens);
                }
            } catch (error) {
                console.error('Error saving layout:', error);
            }
        });

        // Screen Management Events
        socket.on('get_screens', async () => {
            const screens = await Screen.find();
            socket.emit('screens_list', screens);
        });

        socket.on('authorize_screen', async (data) => {
            const { screenId, isAuthorized } = data;
            await Screen.findOneAndUpdate({ screenId }, { isAuthorized });
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        });

        socket.on('rename_screen', async (data) => {
            const { screenId, name } = data;
            await Screen.findOneAndUpdate({ screenId }, { name });
            const screens = await Screen.find();
            io.emit('screens_list', screens);
        });

        socket.on('assign_layout_to_screen', async (data) => {
            const { screenId, layoutId } = data;
            try {
                const screen = await Screen.findOneAndUpdate({ screenId }, { lastLayoutId: layoutId }, { new: true });
                const layout = await Layout.findById(layoutId);
                if (layout) {
                    io.to(`screen_${screenId}`).emit('update_layout', layout);
                }
                const screens = await Screen.find();
                io.emit('screens_list', screens);
                console.log(`Layout ${layoutId} assigned to screen ${screenId}`);
            } catch (err) {
                console.error('Error assigning layout:', err);
            }
        });

        // Get all layouts
        socket.on('get_layouts', async () => {
            try {
                const layouts = await Layout.find().sort({ updatedAt: -1 });
                socket.emit('layouts_list', layouts);
            } catch (error) {
                console.error('Error getting layouts:', error);
            }
        });

        // Delete layout
        socket.on('delete_layout', async (id) => {
            try {
                await Layout.findByIdAndDelete(id);
                const layouts = await Layout.find().sort({ updatedAt: -1 });
                io.emit('layouts_list', layouts);
            } catch (error) {
                console.error('Error deleting layout:', error);
            }
        });

        // --- SCHEDULE EVENTS ---
        socket.on('get_schedules', async () => {
            try {
                const schedules = await Schedule.find();
                socket.emit('schedules_list', schedules);
            } catch (error) {
                console.error('Error getting schedules:', error);
            }
        });

        socket.on('save_schedule', async (scheduleData) => {
            try {
                console.log(`[Schedule] Saving schedule: ${scheduleData.name}`);
                let saved;
                if (scheduleData._id && mongoose.Types.ObjectId.isValid(scheduleData._id)) {
                    saved = await Schedule.findByIdAndUpdate(scheduleData._id, scheduleData, { new: true, upsert: true });
                } else {
                    // Try to update by name if no ID is present, or create new
                    saved = await Schedule.findOneAndUpdate(
                        { name: scheduleData.name },
                        scheduleData,
                        { upsert: true, new: true }
                    );
                }
                const schedules = await Schedule.find().sort({ createdAt: -1 });
                io.emit('schedules_list', schedules);
                console.log(`[Schedule] Schedule saved successfully: ${saved.name}`);
            } catch (error) {
                console.error('[Schedule] Error saving schedule:', error);
                socket.emit('error_message', 'No se pudo guardar el calendario. Revisa la consola del servidor.');
            }
        });

        socket.on('delete_schedule', async (id) => {
            try {
                await Schedule.findByIdAndDelete(id);
                const schedules = await Schedule.find().sort({ createdAt: -1 });
                io.emit('schedules_list', schedules);
            } catch (error) {
                console.error('Error deleting schedule:', error);
            }
        });

        socket.on('assign_schedule_to_screen', async (data) => {
            const { screenId, scheduleId } = data;
            try {
                await Screen.findOneAndUpdate({ screenId }, { scheduleId });
                const screens = await Screen.find();
                io.emit('screens_list', screens);
            } catch (err) {
                console.error('Error assigning schedule:', err);
            }
        });

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });
    });

    // --- BACKGROUND SCHEDULER ---
    // Runs every 30 seconds to check if any screen needs a layout update based on its schedule
    setInterval(async () => {
        try {
            const now = new Date();
            const currentDay = now.getDay();
            const currentH = now.getHours().toString().padStart(2, '0');
            const currentM = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentH}:${currentM}`;

            const screens = await Screen.find({ scheduleId: { $exists: true, $ne: null } }).populate('scheduleId');

            for (const screen of screens) {
                if (!screen.scheduleId) continue;

                // Find if there's an event right now
                const activeEvent = screen.scheduleId.events.find(event => {
                    return event.dayOfWeek === currentDay &&
                        currentTime >= event.startTime &&
                        currentTime < event.endTime;
                });

                if (activeEvent) {
                    // Check if the current layout on screen is different
                    if (screen.lastLayoutId?.toString() !== activeEvent.layoutId.toString()) {
                        const layout = await Layout.findById(activeEvent.layoutId);
                        if (layout) {
                            console.log(`[Scheduler] Updating screen ${screen.screenId} to layout ${layout.name} based on schedule.`);
                            io.to(`screen_${screen.screenId}`).emit('update_layout', layout);
                            screen.lastLayoutId = activeEvent.layoutId;
                            await screen.save();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Background Scheduler Error:', error);
        }
    }, 30000);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
