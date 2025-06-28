import { config } from 'dotenv';
import path from 'path';

// Load env vars ONCE and ONLY ONCE
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

import express from 'express';
// import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
// import path from 'path';
import mongoose from 'mongoose';

// Load env vars ONCE at startup
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const __dirname = path.resolve();

// ================== CRITICAL MEMORY OPTIMIZATIONS ==================

// 1. Disable mongoose buffering and set timeouts
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000);

// 2. Limit connection pool size
const mongooseOptions = {
  // Correct option name is 'maxPoolSize' (not 'poolSize')
  maxPoolSize: 5, // Reduced connection pool size
  serverSelectionTimeoutMS: 5000, // Fail fast if no server available
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  connectTimeoutMS: 30000 // Give up initial connection after 30s
};

// 3. Remove all development-only middleware in production
if (process.env.NODE_ENV === 'production') {
  // Disable verbose logging
  mongoose.set('debug', false);
  
  // Remove any development middleware
} else {
  // Development-only logging
  mongoose.set('debug', true);
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ================== MIDDLEWARE ==================
app.use(express.json({ limit: "5mb" })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(helmet());
app.use(cookieParser());

// Slimmer rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Reduced from 3000
}));

// CORS with production-ready settings
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.PRODUCTION_URL] 
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173"
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ================== ROUTES ==================
import authRoutes from './Routes/authRoutes.js';
import qrRoutes from './Routes/qrRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

// Static files with cache control
app.use(express.static(path.join(__dirname, "qr_generator", "dist"), {
  maxAge: '1y',
  immutable: true
}));

// Single catch-all route for SPA
app.get((req, res) => {
  res.sendFile(path.join(__dirname, "qr_generator", "dist", "index.html"));
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

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});

// ================== SERVER START ==================
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log('✅ MongoDB Connected');
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle server shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1); // Exit with failure code
  }
};

// Start with memory limits
const memoryLimit = process.env.NODE_ENV === 'production' ? 500 : 4096;
process.env.NODE_OPTIONS = `--max-old-space-size=${memoryLimit}`;
startServer();

// // server.js
// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import mongoose from 'mongoose';
// // Custom Modules
// import connectDB from './Config/DB.js';
// import authRoutes from './Routes/authRoutes.js';
// import qrRoutes from './Routes/qrRoutes.js';


// dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// const app = express();
// const __dirname = path.resolve();

// // ================== CRITICAL MEMORY OPTIMIZATIONS ==================
// mongoose.set('bufferCommands', false);
// mongoose.set('bufferTimeoutMS', 30000);

// // 2. Limit connection pool size
// const mongoOptions = {
//   poolSize: 5, // Reduced from default 5
//   socketTimeoutMS: 30000,
//   connectTimeoutMS: 30000
// };
// // 3. Remove all development-only middleware in production
// if (process.env.NODE_ENV === 'production') {
//   // Disable verbose logging
//   mongoose.set('debug', false);
  
//   // Remove any development middleware
// } else {
//   // Development-only logging
//   mongoose.set('debug', true);
//   app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path}`);
//     next();
//   });
// }
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(helmet({
//   contentSecurityPolicy: false,
// }));
// app.use(cookieParser());
// // Rate limiter
// const limiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour window
//   max: 3000,
//   message: "Too many requests from this IP, please try again after an hour!",
// });
// app.use(limiter);




// // Allowed CORS origins
// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://localhost:3001",
//   "http://localhost:5173",
//   "http://127.0.0.1:7000",
//   "http://localhost:7000",
//   "https://qrgenious.onrender.com"
// ];

// // CORS setup
// app.use(cors({
//   origin: (origin, callback) => {
//     console.log("🌍 Origin:", origin);
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));



// // Routes Logging for Debugging
// console.log('✅ qrRoutes is:', typeof qrRoutes, qrRoutes?.stack ? 'Router stack loaded' : 'MISSING or INVALID');
// console.log('✅ authRoutes is:', typeof authRoutes, authRoutes?.stack ? 'Router stack loaded' : 'MISSING or INVALID');

// // Mount API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/qr', qrRoutes);

// // Serve frontend static files
// app.use(express.static(path.join(__dirname, "qr_generator", "dist")));

// // Log requests after static serving
// app.use((req, res, next) => {
//   console.log(`📥 ${req.method} ${req.url}`);
//   next();
// });


// // Catch-all route to serve index.html for SPA support — MUST BE LAST route
// app.get((req, res) => {
//   const indexPath = path.join(__dirname, "qr_generator", "dist", "index.html");
//   res.sendFile(indexPath);
// });

// // Global error handler (must come after all routes)
// app.use((err, req, res, next) => {
//   console.error('🔥 Full error stack:', err.stack);
//   res.status(500).json({ error: 'Internal Server Error: ' + err.message });
// });

// connectDB()
//   .then(() => {
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
      
//       // Development-only memory logging
//       if (process.env.NODE_ENV === 'development') {
//         setInterval(() => {
//           const mem = process.memoryUsage();
//           console.log("Memory Usage (MB):", {
//             rss: (mem.rss / 1024 / 1024).toFixed(2),
//             heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2),
//           });
//         }, 60000);
//       }
//     });
//   })
//   .catch(err => {
//     console.error('Database connection failed', err);
//     process.exit(1);
//   });

// mongoose.set('bufferCommands', false);
// mongoose.set('bufferTimeoutMS', 30000);

// mongoose.set('debug', true);


// app.use((req, res, next) => {
//   const acceptHeader = req.headers.accept || "";

//   // Serve index.html only for browser requests (not API requests or assets)
//   if (acceptHeader.includes("html")) {
//     res.sendFile(path.join(__dirname, "qr_generator", "dist", "index.html"));
//   } else {
//     next(); // Let 404 handler or static middleware handle it
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🌐 Server running on 🚀 http://localhost:${PORT}`);
// });
