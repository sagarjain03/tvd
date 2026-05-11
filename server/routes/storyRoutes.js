/**
 * Story Routes
 *
 * Defines all endpoints for the story mode system:
 * - GET /api/story/chapters - List available chapters
 * - GET /api/story/chapter/:chapterId - Get specific chapter
 * - POST /api/story/decision - Submit a decision
 * - GET /api/story/my-progress - Get current user's progress
 * - GET /api/story/progress/:userId - Get specific user's progress
 */

import express from "express";
import {
  getChapters,
  getChapter,
  submitDecision,
  getMyStoryProgress,
  getStoryProgress,
} from "../controllers/storyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All story routes require authentication
router.use(protect);

/**
 * Get all available chapters
 * @route   GET /api/story/chapters
 * @access  Private
 *
 * Returns array of chapters with metadata.
 * Useful for chapter selection UI.
 */
router.get("/chapters", getChapters);

/**
 * Get current user's story progress
 * @route   GET /api/story/my-progress
 * @access  Private
 *
 * Convenience endpoint - returns authenticated user's story progress.
 */
router.get("/my-progress", getMyStoryProgress);

/**
 * Get a specific story chapter
 * @route   GET /api/story/chapter/:chapterId
 * @access  Private
 *
 * Returns chapter scenes, decisions, and options.
 * Does NOT include trait impacts (server-side only).
 * 
 * Params:
 * - chapterId: Chapter number (1, 2, 3)
 */
router.get("/chapter/:chapterId", getChapter);

/**
 * Submit a story decision
 * @route   POST /api/story/decision
 * @access  Private
 *
 * Body:
 * {
 *   "chapter": 1,
 *   "decisionId": "d_1_1",
 *   "selectedOption": 0
 * }
 *
 * Response includes:
 * - Trait changes applied
 * - Updated archetype (if changed)
 * - Story consequence
 * - Updated story progress
 *
 * Prevents duplicate submissions (permanent choices).
 */
router.post("/decision", submitDecision);

/**
 * Get specific user's story progress
 * @route   GET /api/story/progress/:userId
 * @access  Private (self or admin)
 *
 * Returns full story progress including:
 * - All decisions made
 * - Trait evolution
 * - Completion percentage
 * - Story narrative context
 *
 * Authorization: Only the user or admin can view.
 */
router.get("/progress/:userId", getStoryProgress);

export default router;
