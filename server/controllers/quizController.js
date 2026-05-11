/**
 * Quiz Controller
 *
 * Handles personality quiz endpoints:
 * - GET /api/quiz/questions - Retrieve all quiz questions
 * - POST /api/quiz/submit - Submit answers and calculate archetype
 * - GET /api/quiz/result/:userId - Get quiz results
 */

import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import { classifyArchetype } from "../utils/archetypeClassifier.js";
import { generateInsight } from "../utils/quizInsightGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load quiz questions from static JSON file
let questions = [];
try {
  const questionsPath = path.join(__dirname, "../data/questions.json");
  const questionsData = fs.readFileSync(questionsPath, "utf-8");
  questions = JSON.parse(questionsData);
} catch (error) {
  console.error("Error loading quiz questions:", error.message);
  questions = [];
}

/**
 * @desc    Get all quiz questions
 * @route   GET /api/quiz/questions
 * @access  Private
 *
 * Returns quiz questions without revealing trait impacts to frontend.
 * This ensures scoring logic stays server-side only.
 */
export const getQuestions = asyncHandler(async (req, res) => {
  if (questions.length === 0) {
    res.status(500);
    throw new Error("Quiz questions not available");
  }

  // Sanitize questions: remove trait impacts from options
  const sanitized = questions.map((q) => ({
    id: q.id,
    chapter: q.chapter,
    question: q.question,
    options: q.options.map((option) => ({
      text: option.text,
      // Trait impacts NOT included - frontend must not see scoring logic
    })),
  }));

  res.status(200).json({
    success: true,
    message: "Quiz questions retrieved",
    data: {
      totalQuestions: sanitized.length,
      questions: sanitized,
    },
  });
});

/**
 * @desc    Submit quiz answers and calculate personality archetype
 * @route   POST /api/quiz/submit
 * @access  Private
 *
 * Accepts user answers, validates them, calculates trait scores,
 * classifies archetype, and saves results to user profile.
 */
export const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user._id;

  // Validation: answers must be array with exactly 15 entries
  if (!answers) {
    res.status(400);
    throw new Error("Answers array is required");
  }

  if (!Array.isArray(answers)) {
    res.status(400);
    throw new Error("Answers must be an array");
  }

  if (answers.length !== 15) {
    res.status(400);
    throw new Error("All 15 questions must be answered");
  }

  // Fetch user and check if already completed
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.quizCompleted) {
    res.status(400);
    throw new Error("Quiz has already been completed. Cannot resubmit.");
  }

  // Validate each answer
  const validatedAnswers = [];

  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];

    if (!answer.questionId || answer.optionIndex === undefined) {
      res.status(400);
      throw new Error(
        `Invalid answer format at index ${i}. Must have 'questionId' and 'optionIndex'.`
      );
    }

    // Find question
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) {
      res.status(400);
      throw new Error(`Invalid question ID: ${answer.questionId}`);
    }

    // Validate option index
    const optionIndex = parseInt(answer.optionIndex);
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
      res.status(400);
      throw new Error(
        `Invalid option index ${optionIndex} for question ${answer.questionId}`
      );
    }

    validatedAnswers.push({
      questionId: answer.questionId,
      optionIndex,
    });
  }

  // Calculate raw trait scores
  const rawTraits = {
    loyalty: 0,
    aggression: 0,
    empathy: 0,
    strategy: 0,
    dominance: 0,
    emotionalDepth: 0,
  };

  for (const answer of validatedAnswers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const selectedOption = question.options[answer.optionIndex];
    if (!selectedOption || !selectedOption.traits) continue;

    // Accumulate trait impacts
    for (const [trait, value] of Object.entries(selectedOption.traits)) {
      if (rawTraits.hasOwnProperty(trait)) {
        rawTraits[trait] += value;
      }
    }
  }

  // Classify archetype and get normalized traits
  const { archetype, traits: normalizedTraits } = classifyArchetype(rawTraits);

  // Generate personality insight
  const insight = generateInsight(archetype, normalizedTraits);

  // Save quiz results to user
  user.supernaturalType = archetype;
  user.personalityTraits = normalizedTraits;
  user.quizCompleted = true;
  user.activityScore = (user.activityScore || 0) + 10; // Award points for completing quiz

  await user.save();

  res.status(200).json({
    success: true,
    message: "Quiz submitted successfully. Archetype classified.",
    data: {
      supernaturalType: archetype,
      personalityTraits: normalizedTraits,
      insight: insight,
    },
  });
});

/**
 * @desc    Get quiz result for a specific user
 * @route   GET /api/quiz/result/:userId
 * @access  Private (self or admin)
 *
 * Returns user's quiz results, personality traits, and archetype.
 * Only the user themselves or an admin can view another user's results.
 */
export const getQuizResult = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user._id.toString();

  // Authorization: only user themselves or admin can view results
  if (userId !== requestingUserId && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Unauthorized. Can only view your own quiz results.");
  }

  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.quizCompleted) {
    return res.status(200).json({
      success: true,
      message: "User has not completed the quiz yet",
      data: {
        quizCompleted: false,
        supernaturalType: null,
        personalityTraits: null,
      },
    });
  }

  // Generate fresh insight based on stored results
  const insight = generateInsight(user.supernaturalType, user.personalityTraits);

  res.status(200).json({
    success: true,
    message: "Quiz result retrieved",
    data: {
      userId: user._id,
      quizCompleted: user.quizCompleted,
      supernaturalType: user.supernaturalType,
      personalityTraits: user.personalityTraits,
      insight: insight,
      completedAt: user.updatedAt,
    },
  });
});

/**
 * @desc    Get current user's quiz result
 * @route   GET /api/quiz/my-result
 * @access  Private
 *
 * Convenience endpoint - returns current authenticated user's quiz results
 */
export const getMyQuizResult = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.quizCompleted) {
    return res.status(200).json({
      success: true,
      message: "You have not completed the quiz yet",
      data: {
        quizCompleted: false,
        supernaturalType: null,
        personalityTraits: null,
      },
    });
  }

  const insight = generateInsight(user.supernaturalType, user.personalityTraits);

  res.status(200).json({
    success: true,
    message: "Your quiz result retrieved",
    data: {
      quizCompleted: user.quizCompleted,
      supernaturalType: user.supernaturalType,
      personalityTraits: user.personalityTraits,
      insight: insight,
      completedAt: user.updatedAt,
    },
  });
});
