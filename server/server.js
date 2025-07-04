import mongoose from "mongoose";
import app from "./app.js";
import DataBaseConnection from "./Services/DB.js";

const port = process.env.PORT || 3000;
let server;

// ================== ERROR HANDLERS ==================
process.on('uncaughtException', (err) => {
    console.error(err);
    console.log("UNCAUGHT Exception! Shutting down ...");
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...\n', err);
    if (server) server.close(() => process.exit(1));
});

// ================== MEMORY MONITORING ==================
let maxMemoryUsage = 0;
setInterval(() => {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
    maxMemoryUsage = Math.max(maxMemoryUsage, usedMB);
    if (usedMB > process.env.MEMORY_WARNING_THRESHOLD || usedMB > 450) {
        console.log(`Memory: ${usedMB}MB (Max: ${maxMemoryUsage}MB)`);
        if (global.gc) {
            global.gc();
            console.log('⚠️ Forced garbage collection');
        }
    }
}, 30000);

// ================== SERVER STARTUP ==================
console.log('[1] Starting server initialization...');
const startServer = async () => {
    try {
        // 1. Connect to Database
        const { isConnected, connection } = await DataBaseConnection();

        // 3. Start Express server
        console.log('[6] Starting HTTP server...');
        const server = app.listen(port, () => {
            console.log(`
            🚀 Server ready at: http://localhost:${port}
            ⏱️  ${new Date().toLocaleString()}
            📊 Memory monitoring active
            🔒 Database connected: ${isConnected ? '✅' : '❌ (Databse Error)'}
            `);
            console.log(`[7] Server running on port ${port}`);
        });

        // Error handling for server
        server.on('error', (err) => {
            console.error('Server error:', err);
            process.exit(1);
        });

        // 4. Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM RECEIVED. Shutting down gracefully...');
            server.close(async () => {
                if (isConnected && connection) {
                    await mongoose.disconnect();
                    console.log('💤 Database Disconnected!');
                } else {
                    console.log('⚠️ No DB connection to close. Exiting.');
                }
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('💀 Failed to start server:', err);
        process.exit(1);
    }
}

startServer()
    .then(server => {
        console.log('[8] Server started successfully');
    })
    .catch(err => {
        console.error('[FATAL] Server failed to start:', err);
    });