// 📦 Packages
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from 'cookie-parser';
// import xss from "xss-clean";
// import mongoSanitize from "express-mongo-sanitize";

// 🔗 Custom Modules
import connectDB from './Config/DB.js';
import authRoutes from './Routes/authRoutes.js';
import qrRoutes from './Routes/qrRoutes.js';
//For Live  Server Running 
import path from "path";
const __dirname = path.resolve();

// 🌱 Load .env
dotenv.config();

// 🔌 MongoDB
connectDB();

const app = express();

// 🔐 Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3000,
  message: "Too many Requests from this IP, please try again in an hour!",
});

// 🌐 CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

// 🛡️ Security Middleware
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(helmet({
  contentSecurityPolicy: false, // If you use inline scripts and don’t want CSP errors
}));
app.use(
  cors({
    // origin: process.env.ORIGIN || '*',
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Custom-Header",
    ],
  })
);
app.use(limiter);
app.use(cookieParser());
// app.use(mongoSanitize());
// app.use(xss());

// 🛣️ Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

app.use(express.static(path.join(__dirname, "/qr_generator/dist")));
console.log(path.join(__dirname, "/qr_generator/dist")); // Path verification

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "qr_generator", "dist", "index.html"));
});

// 🔧 Root test route
app.get('/', (req, res) => {
  res.send('🚀 QR Auth Server is running...');
});

// ❌ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Full error stack:', err.stack);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on 🚀 http://localhost:${PORT}`);
});
