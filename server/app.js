import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import csrf from 'csurf';
import sanitize from 'express-mongo-sanitize';
import rateLimit from "express-rate-limit";
import path from "path";
import routes from './Routes/index.js';
import { getClientIP } from "./Utils/apiHelpers.js";



const __dirname = path.resolve();
dotenv.config();
const app = express();

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3000,
    message: "Too many Requests from this IP, please try again in an hour!",
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", process.env.TRUSTED_CDN_URL || ''],
            styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'", process.env.API_BASE_URL || '']
        }
    },
    crossOriginEmbedderPolicy: false // Disable for CDN compatibility
}));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

const allowedOrigins = [
    "http://localhost:7272",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:7000"
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "x-csrf-token"
    ],
    exposedHeaders: ["X-CSRF-Token", "x-csrf-token"]
}));

app.use(express.json({ limit: "10kb" })); // Reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use((req, res, next) => {
    // Create sanitized copies without modifying originals
    if (req.query) res.locals.sanitizedQuery = sanitize.sanitize(req.query);
    if (req.body) res.locals.sanitizedBody = sanitize.sanitize(req.body);
    next();
});

// 1. Initialize CSRF protection first
export const csrfProtection = csrf({
    cookie: {
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        httpOnly: true,
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/'
    },
    value: (req) => {
        console.log('CSRF Validation:', {
            cookie: req.cookies._csrf,
            header: req.headers['x-csrf-token'],
            match: req.cookies._csrf === req.headers['x-csrf-token']
        });
        // Case-insensitive header check
        const headerToken = req.headers['x-csrf-token'] ||
            req.headers['X-CSRF-Token'];
        return String(headerToken).trim() === String(req.cookies._csrf).trim();
    }
});
app.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
app.use((req, res, next) => {
    console.log('CSRF Debug:', {
        method: req.method,
        path: req.path,
        cookies: req.cookies,
        headers: {
            'x-csrf-token': req.headers['x-csrf-token'],
            'X-CSRF-Token': req.headers['X-CSRF-Token']
        },
        bodyKeys: Object.keys(req.body || {})
    });
    next();
});

app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.path}`, {
        ip: getClientIP(req),
        time: new Date().toISOString()
    });
    next();
});

app.use(limiter);

// Using INdex Routes
app.use("/api/v1", routes);
// Initial memory log
const mem = process.memoryUsage();
console.log(`Initial memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

export default app;