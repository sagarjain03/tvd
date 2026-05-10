import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { connectDB } from "./config/db.js";
import { initPassport } from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Configure Passport after environment variables are loaded
initPassport();

const app = express();

// ========================
// MIDDLEWARE
// ========================

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Passport.js initialization
app.use(passport.initialize());

// ========================
// ROUTES
// ========================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "MysticMatch server is alive 🧛",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// ========================
// ERROR HANDLING
// ========================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ========================
// START SERVER
// ========================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🧛 MysticMatch Server Started                      ║
║                                                            ║
║  Server:    http://localhost:${PORT}                       ║
║  Env:       ${process.env.NODE_ENV}                        ║
║  Database:  Connected to MongoDB                          ║
║                                                            ║
║  📚 Documentation:                                         ║
║  - Auth Routes: /api/auth/**                              ║
║  - Health Check: /api/health                              ║
║                                                            ║
║  💡 Phase 1: Foundation Auth System                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
