import express from "express";
import {
  getPersonalityInsight,
  getMatchExplanation,
  getBattleResult,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/ai/insights/:userId
// @access  Private
router.get("/insights/:userId", protect, getPersonalityInsight);

// @route   POST /api/ai/match-explanation
// @access  Private
router.post("/match-explanation", protect, getMatchExplanation);

// @route   POST /api/ai/battle-result
// @access  Private
router.post("/battle-result", protect, getBattleResult);

export default router;
