// ================== MEMORY LIMITS ==================
import v8 from 'v8';
v8.setFlagsFromString('--max-old-space-size=500'); // 500MB limit

// ================== SINGLE ENV CONFIG ==================
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env') });

// ================== IMPORTS ==================
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './Routes/authRoutes.js';
import qrRoutes from './Routes/qrRoutes.js';

// ================== EXPRESS CONFIG ==================
const app = express();
const __dirname = path.resolve();

// Disable unnecessary features
app.disable('x-powered-by');
app.disable('etag');

// ================== MONGOOSE OPTIMIZATION ==================
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 10000); // Reduced from 30000
const mongooseOptions = {
  maxPoolSize: 2, // Very conservative
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000
};

// ================== MEMORY-EFFICIENT MIDDLEWARE ==================
app.use(express.json({ limit: '100kb' })); // Reduced from 500kb
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(helmet());
app.use(cookieParser());

// Lightweight rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50 // Reduced from 100
}));

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.PRODUCTION_URL]
  : ["http://localhost:3000"]; // Minimal local origins

app.use(cors({ origin: allowedOrigins }));

// ================== ROUTE VALIDATION ==================
function validateRoutes() {
  if (!authRoutes || !qrRoutes) {
    console.error('❌ Missing required routes');
    process.exit(1);
  }
  console.log('✅ All routes validated');
}
validateRoutes();

// ================== ROUTES ==================
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);

// ================== IMAGE PROCESSING OPTIMIZATION ==================
// Add stream-based image processing
app.use('/api/upload', (req, res, next) => {
  // Implement streaming for image uploads
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  
  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    // Process file in chunks - don't buffer entire file
    file.on('data', (chunk) => {
      // Stream to ImageKit or other service
    });
  });
  
  req.pipe(bb);
  next();
});

// Static files with aggressive caching
app.use(express.static(path.join(__dirname, "qr_generator", "dist"), {
  maxAge: '1y',
  immutable: true
}));

// SPA fallback
app.get( (req, res) => {
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

// ================== MEMORY MONITORING ==================
let maxMemoryUsage = 0;
setInterval(() => {
  const mem = process.memoryUsage();
  const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
  maxMemoryUsage = Math.max(maxMemoryUsage, usedMB);
  console.log(`Memory: ${usedMB}MB (Max: ${maxMemoryUsage}MB)`);
  
  // Force GC if approaching limit
  if (usedMB > 450 && global.gc) {
    global.gc();
    console.log('⚠️ Forced garbage collection');
  }
}, 30000);

// ================== DB CONNECTION ==================
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log('✅ MongoDB Connected (Optimized)');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

// ================== SERVER START ==================
async function startServer() {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // Initial memory log
      const mem = process.memoryUsage();
      console.log(`Initial memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('✅ Server and MongoDB closed');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

// Start with explicit garbage collection flags
if (global.gc) {
  global.gc();
  console.log('⚠️ Manual garbage collection triggered at startup');
}

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
