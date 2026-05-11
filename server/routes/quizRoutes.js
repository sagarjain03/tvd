/**
 * Quiz Routes
 *
 * Defines all endpoints for the personality quiz system:
 * - GET /api/quiz/questions - Get quiz questions
 * - POST /api/quiz/submit - Submit answers and get results
 * - GET /api/quiz/result/:userId - Get specific user's results
 * - GET /api/quiz/my-result - Get current user's results
 */

import express from "express";
import {
  getQuestions,
  submitQuiz,
  getQuizResult,
  getMyQuizResult,
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All quiz routes require authentication
router.use(protect);

/**
 * Get all quiz questions
 * @route   GET /api/quiz/questions
 * @access  Private
 *
 * Returns array of 15 personality quiz questions with options.
 * Does NOT include trait impacts (those stay server-side).
 */
router.get("/questions", getQuestions);

/**
 * Submit quiz answers
 * @route   POST /api/quiz/submit
 * @access  Private
 *
 * Body:
 * {
 *   "answers": [
 *     { "questionId": "q_001", "optionIndex": 2 },
 *     ...
 *   ]
 * }
 *
 * Response includes:
 * - Calculated personality traits (0–10 scale)
 * - Determined supernatural archetype
 * - Personality insight summary
 */
router.post("/submit", submitQuiz);

/**
 * Get current user's quiz result
 * @route   GET /api/quiz/my-result
 * @access  Private
 *
 * Convenience endpoint - returns authenticated user's quiz results.
 * No parameters needed.
 */
router.get("/my-result", getMyQuizResult);

/**
 * Get specific user's quiz result
 * @route   GET /api/quiz/result/:userId
 * @access  Private (self or admin)
 *
 * Returns quiz results for a specific user.
 * Authorization: Only the user themselves or admin can view.
 */
router.get("/result/:userId", getQuizResult);

export default router;
