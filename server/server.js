import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { initPassport } from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { socketHandler } from "./socket/socketHandler.js";
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

// Quiz routes
app.use("/api/quiz", quizRoutes);

// Story routes
app.use("/api/story", storyRoutes);

// Match routes
app.use("/api/matches", matchRoutes);

// Chat routes
app.use("/api/chat", chatRoutes);

// AI routes (Phase 6)
app.use("/api/ai", aiRoutes);

// Gamification routes (Phase 6)
app.use("/api/gamification", gamificationRoutes);

// Upload routes (Phase 6)
app.use("/api/upload", uploadRoutes);

// ========================
// ERROR HANDLING
// ========================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ========================
// START SERVER WITH SOCKET.IO
// ========================

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket.io handler for real-time chat
socketHandler(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🧛 MysticMatch Server + Socket.io Started         ║
║                                                            ║
║  Server:    http://localhost:${PORT}                       ║
║  Env:       ${process.env.NODE_ENV}                        ║
║  Database:  Connected to MongoDB                          ║
║  Socket.io: Connected and ready for real-time chat        ║
║  Groq AI:   Ready for personality insights                ║
║  Cloudinary: Ready for profile uploads                    ║
║                                                            ║
║  📚 Documentation:                                         ║
║  - Auth Routes: /api/auth/**                              ║
║  - Quiz Routes: /api/quiz/**                              ║
║  - Story Routes: /api/story/**                            ║
║  - Match Routes: /api/matches/**                          ║
║  - Chat Routes: /api/chat/**                              ║
║  - AI Routes: /api/ai/**                                  ║
║  - Gamification Routes: /api/gamification/**              ║
║  - Upload Routes: /api/upload/**                          ║
║  - Health Check: /api/health                              ║
║                                                            ║
║  ✅ Phase 1: Foundation Auth System                        ║
║  ✅ Phase 2: Personality Quiz & Archetype Classifier      ║
║  ✅ Phase 3: Interactive Story Mode & Archetype Evolution║
║  ✅ Phase 4: Compatibility Matching Engine                ║
║  ✅ Phase 5: Real-Time Chat System (Socket.io)            ║
║  ✅ Phase 6: Groq AI Insights, Gamification & Cloudinary  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
