// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';

// Custom Modules
import connectDB from './Config/DB.js';
import authRoutes from './Routes/authRoutes.js';
import qrRoutes from './Routes/qrRoutes.js';

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Middleware: Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.path}`);
  next();
});

// Optional: Heapdump on startup for memory profiling
if (process.env.ENABLE_HEAP === 'true') {
  import('heapdump').then(heapdump => {
    heapdump.writeSnapshot(`./heap-${Date.now()}.heapsnapshot`);
  });
}

// Show memory usage after startup
setTimeout(() => {
  const used = process.memoryUsage();
  console.log("🚨 Memory Usage After Startup:", {
    rss: (used.rss / 1024 / 1024).toFixed(2) + " MB",
    heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2) + " MB",
    heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2) + " MB",
  });
}, 2000);

// Connect to MongoDB
connectDB();

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3000,
  message: "Too many requests from this IP, please try again after an hour!",
});

// Allowed CORS origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:7000",
  "http://localhost:7000"
];

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    console.log("🌍 Origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Security and Parsing Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cookieParser());
app.use(limiter);

// Optional: Add your XSS and mongoSanitize middleware here if needed
// app.use(xss());
// app.use(mongoSanitize());

// Routes Logging for Debugging
console.log('✅ qrRoutes is:', typeof qrRoutes, qrRoutes?.stack ? 'Router stack loaded' : 'MISSING or INVALID');
console.log('✅ authRoutes is:', typeof authRoutes, authRoutes?.stack ? 'Router stack loaded' : 'MISSING or INVALID');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "qr_generator", "dist")));

// Log requests after static serving
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Catch-all route to serve index.html for SPA support — MUST BE LAST route
app.get((req, res) => {
  const indexPath = path.join(__dirname, "qr_generator", "dist", "index.html");
  res.sendFile(indexPath);
});

// Global error handler (must come after all routes)
app.use((err, req, res, next) => {
  console.error('🔥 Full error stack:', err.stack);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});


app.use((req, res, next) => {
  const acceptHeader = req.headers.accept || "";
  
  // Serve index.html only for browser requests (not API requests or assets)
  if (acceptHeader.includes("html")) {
    res.sendFile(path.join(__dirname, "qr_generator", "dist", "index.html"));
  } else {
    next(); // Let 404 handler or static middleware handle it
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on 🚀 http://localhost:${PORT}`);
});
