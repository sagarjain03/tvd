import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Match from "../models/Match.js";
import {
  generatePersonalityInsight,
  generateMatchExplanation,
  generateBattleResult,
} from "../utils/groqClient.js";

// @desc    Generate or retrieve personality insight for a user
// @route   GET /api/ai/insights/:userId
// @access  Private
export const getPersonalityInsight = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.quizCompleted || !user.supernaturalType) {
    res.status(400);
    throw new Error("User must complete the quiz before insights can be generated");
  }

  try {
    // Generate fresh insight from Groq
    const insight = await generatePersonalityInsight(user);

    res.json({
      success: true,
      insight,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to generate personality insight: ${err.message}`);
  }
});

// @desc    Generate match explanation for two matched users
// @route   POST /api/ai/match-explanation
// @access  Private
export const getMatchExplanation = asyncHandler(async (req, res) => {
  const { matchId } = req.body;

  if (!matchId) {
    res.status(400);
    throw new Error("matchId is required");
  }

  const match = await Match.findById(matchId)
    .populate("user1", "name supernaturalType personalityTraits")
    .populate("user2", "name supernaturalType personalityTraits");

  if (!match || match.status !== "matched") {
    res.status(404);
    throw new Error("Match not found or not yet matched");
  }

  // Check requesting user is part of this match
  const isParticipant =
    match.user1._id.toString() === req.user._id.toString() ||
    match.user2._id.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorised to view this match");
  }

  try {
    // Return cached explanation if it exists
    if (match.matchExplanation) {
      return res.json({
        success: true,
        explanation: JSON.parse(match.matchExplanation),
        cached: true,
      });
    }

    // Generate and cache
    const explanation = await generateMatchExplanation(
      match.user1,
      match.user2,
      match.compatibilityScore,
      match.compatibilityLabel
    );

    match.matchExplanation = JSON.stringify(explanation);
    await match.save();

    res.json({
      success: true,
      explanation,
      cached: false,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to generate match explanation: ${err.message}`);
  }
});

// @desc    Generate Battle Mode chemistry result
// @route   POST /api/ai/battle-result
// @access  Private
export const getBattleResult = asyncHandler(async (req, res) => {
  const { scenario, answer1, answer2, user1Id, user2Id } = req.body;

  if (!scenario || !answer1 || !answer2 || !user1Id || !user2Id) {
    res.status(400);
    throw new Error("Scenario, both answers, and both user IDs are required");
  }

  const user1 = await User.findById(user1Id).select("name supernaturalType");
  const user2 = await User.findById(user2Id).select("name supernaturalType");

  if (!user1 || !user2) {
    res.status(404);
    throw new Error("One or both users not found");
  }

  try {
    const result = await generateBattleResult(user1, user2, scenario, answer1, answer2);

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to generate battle result: ${err.message}`);
  }
});
