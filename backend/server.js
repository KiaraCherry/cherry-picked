import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import recipesRoutes from './routes/recipes.js';
import savedRoutes from './routes/saved.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Configure Cloudinary
configureCloudinary();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' }
});

// login limit
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limits each IP to 10 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts from this IP, please try again in 15 minutes.' }
});

app.use('/api', limiter);
app.use('/api/auth/login', loginLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err);
    const message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message;

    res.status(err.status || 500).json({ message });
});

// patch router to catch async errors
import { Router } from 'express';
const originalRouter = Router.prototype.route;
Router.prototype.route = function (path) {
    const route = originalRouter.call(this, path);
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    methods.forEach(method => {
        const originalMethod = route[method].bind(route);
        route[method] = (...handlers) => {
            const wrappedHandlers = handlers.map(h =>
                h.length === 4 ? h : async (req, res, next) => {
                    try {
                        await h(req, res, next);
                    } catch (error) {
                        next(error);
                    }
                }
            );
            return originalMethod(...wrappedHandlers);
        };
    });
    return route;
};

// create admin on startup if not exists
async function createAdmin() {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn('Admin credentials not set in environment variables. Skipping admin creation.');
        return;
    }

    await User.create({ email, password, role: 'admin' });
    console.log('Admin user created with email:', email);
    console.warn('Please change the admin password immediately after first login! :DDD (PLEASE DONT FORGET YOU LOSER... I KNOW YOU WILL... D:)');
}

// Start the server

async function startServer() {
    await connectDB();
    configureCloudinary();
    await createAdmin();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Press Ctrl+C to stop the server`);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

