import express from "express";
import {
  getAchievements,
  getStreak,
  updateStreak,
  triggerAchievementCheck,
} from "../controllers/gamificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/gamification/achievements/:userId
// @access  Private
router.get("/achievements/:userId", protect, getAchievements);

// @route   GET /api/gamification/streak/:userId
// @access  Private
router.get("/streak/:userId", protect, getStreak);

// @route   POST /api/gamification/streak/update
// @access  Private
router.post("/streak/update", protect, updateStreak);

// @route   POST /api/gamification/check-achievements
// @access  Private
router.post("/check-achievements", protect, triggerAchievementCheck);

export default router;
