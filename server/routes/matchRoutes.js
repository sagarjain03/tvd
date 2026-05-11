/**
 * Match Routes
 *
 * Defines all matching system endpoints:
 * - GET /api/matches - Get user's matches
 * - GET /api/matches/suggestions - Get match suggestions
 * - POST /api/matches/like/:userId - Like a user
 * - POST /api/matches/reject/:userId - Reject a user
 * - GET /api/matches/:matchId - Get match details
 * - GET /api/matches/activity/history - Get matching history
 */

import express from "express";
import {
  getMatches,
  getSuggestions,
  likeUser,
  rejectUser,
  getMatchDetails,
  getMatchingHistory,
} from "../controllers/matchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * GET /api/matches
 * Get all matches for current user
 */
router.get("/", getMatches);

/**
 * GET /api/matches/suggestions
 * Get match suggestions (must come before /:matchId to avoid route conflict)
 */
router.get("/suggestions", getSuggestions);

/**
 * GET /api/matches/activity/history
 * Get matching activity (must come before /:matchId to avoid route conflict)
 */
router.get("/activity/history", getMatchingHistory);

/**
 * POST /api/matches/like/:userId
 * Like a user
 */
router.post("/like/:userId", likeUser);

/**
 * POST /api/matches/reject/:userId
 * Reject a user
 */
router.post("/reject/:userId", rejectUser);

/**
 * GET /api/matches/:matchId
 * Get match details (must come last to avoid route conflicts)
 */
router.get("/:matchId", getMatchDetails);

export default router;
