/**
 * Story Controller
 *
 * Handles story mode endpoints:
 * - GET /api/story/chapter/:chapterId - Retrieve a chapter
 * - POST /api/story/decision - Submit a decision
 * - GET /api/story/progress/:userId - Get user's story progress
 * - GET /api/story/my-progress - Get current user's progress
 */

import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import StoryDecision from "../models/StoryDecision.js";
import { classifyArchetype } from "../utils/archetypeClassifier.js";
import {
  getChapterById,
  getDecisionInChapter,
  getOptionFromDecision,
  validateDecisionInput,
  calculateCompletionPercentage,
  isChapterComplete,
  buildStoryContext,
} from "../utils/storyEngine.js";
import { applyTraitImpact, getTraitChangeSummary } from "../utils/applyTraitImpact.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load story data from static JSON file
let storyData = [];
try {
  const storyPath = path.join(__dirname, "../data/story.json");
  const storyFile = fs.readFileSync(storyPath, "utf-8");
  storyData = JSON.parse(storyFile);
} catch (error) {
  console.error("Error loading story data:", error.message);
  storyData = [];
}

/**
 * @desc    Get a specific story chapter
 * @route   GET /api/story/chapter/:chapterId
 * @access  Private
 *
 * Returns full chapter data including scenes and decisions.
 * Does NOT reveal trait impacts (server-side only).
 */
export const getChapter = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  const chapterNum = parseInt(chapterId);

  if (isNaN(chapterNum) || chapterNum < 1) {
    res.status(400);
    throw new Error("Chapter ID must be a positive number");
  }

  const chapter = getChapterById(storyData, chapterNum);

  if (!chapter) {
    res.status(404);
    throw new Error(`Chapter ${chapterNum} not found`);
  }

  // Sanitize: remove trait impacts from options
  const sanitized = {
    chapterId: chapter.chapterId,
    title: chapter.title,
    description: chapter.description,
    scenes: chapter.scenes,
    decisions: chapter.decisions.map((d) => ({
      decisionId: d.decisionId,
      question: d.question,
      options: d.options.map((opt) => ({
        text: opt.text,
        consequence: opt.consequence || "",
        // traitImpact NOT included
      })),
    })),
  };

  res.status(200).json({
    success: true,
    message: `Chapter ${chapterNum} retrieved`,
    data: sanitized,
  });
});

/**
 * @desc    Submit a story decision
 * @route   POST /api/story/decision
 * @access  Private
 *
 * Validates decision, applies trait impacts, updates archetype,
 * and persists decision to database.
 */
export const submitDecision = asyncHandler(async (req, res) => {
  const { chapter, decisionId, selectedOption } = req.body;
  const userId = req.user._id;

  // Validate input format
  const inputValidation = validateDecisionInput({
    chapter,
    decisionId,
    selectedOption,
  });

  if (!inputValidation.valid) {
    res.status(400);
    throw new Error(inputValidation.error);
  }

  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Must complete quiz first
  if (!user.quizCompleted) {
    res.status(400);
    throw new Error("Complete the personality quiz before starting story mode");
  }

  // Get chapter from story data
  const storyChapter = getChapterById(storyData, chapter);
  if (!storyChapter) {
    res.status(404);
    throw new Error(`Story chapter ${chapter} not found`);
  }

  // Get decision from chapter
  const decision = getDecisionInChapter(storyChapter, decisionId);
  if (!decision) {
    res.status(404);
    throw new Error(`Decision ${decisionId} not found in chapter ${chapter}`);
  }

  // Get selected option
  const selectedOptionNum = parseInt(selectedOption);
  const option = getOptionFromDecision(decision, selectedOptionNum);
  if (!option) {
    res.status(400);
    throw new Error(
      `Invalid option index ${selectedOptionNum} for decision ${decisionId}`
    );
  }

  // Check for duplicate submission (user already made this decision)
  const existingDecision = await StoryDecision.findOne({
    userId,
    decisionId,
  });

  if (existingDecision) {
    res.status(400);
    throw new Error(
      `You have already made the decision "${decisionId}". Story choices are permanent.`
    );
  }

  // Store old traits for comparison
  const oldTraits = { ...user.personalityTraits };

  // Apply trait impact from decision
  const newTraits = applyTraitImpact(user.personalityTraits, option.traitImpact || {});

  // Recalculate archetype with new traits
  const { archetype: newArchetype, traits: normalizedTraits } =
    classifyArchetype(newTraits);

  // Save decision to database
  const storyDecisionDoc = new StoryDecision({
    userId,
    chapter,
    decisionId,
    choiceIndex: selectedOptionNum,
    selectedText: option.text,
    traitImpact: option.traitImpact || {},
    consequence: option.consequence || "",
    nextScene: option.nextScene || null,
  });

  await storyDecisionDoc.save();

  // Update user with new traits and archetype
  user.personalityTraits = newTraits;
  user.supernaturalType = newArchetype;

  // Update story progress
  user.storyProgress.currentChapter = chapter;

  // Check if chapter is complete (2 decisions per chapter)
  const decisionCount = await StoryDecision.countDocuments({
    userId,
    chapter,
  });

  if (decisionCount >= 2) {
    // Chapter complete, enable next chapter
    user.storyProgress.currentChapter = Math.min(chapter + 1, 3);
  }

  // Mark story as complete if all chapters done and 5+ decisions made
  const totalDecisions = await StoryDecision.countDocuments({ userId });
  if (totalDecisions >= 5 && chapter >= 3) {
    user.storyProgress.completed = true;
  }

  await user.save();

  // Get trait changes for feedback
  const changeSummary = getTraitChangeSummary(oldTraits, newTraits);

  res.status(200).json({
    success: true,
    message: "Story decision recorded. Your personality evolves.",
    data: {
      decisionSaved: true,
      consequence: option.consequence || "",
      traitChanges: changeSummary,
      updatedTraits: newTraits,
      archetypeEvolved: {
        previousArchetype: user.supernaturalType,
        currentArchetype: newArchetype,
      },
      storyProgress: {
        currentChapter: user.storyProgress.currentChapter,
        decisionsMade: totalDecisions + 1,
        storyComplete: user.storyProgress.completed,
      },
    },
  });
});

/**
 * @desc    Get story progress for a specific user
 * @route   GET /api/story/progress/:userId
 * @access  Private (self or admin)
 *
 * Returns all story decisions, chapter progress, and archetype evolution.
 */
export const getStoryProgress = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user._id.toString();

  // Authorization check
  if (userId !== requestingUserId && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Unauthorized. Can only view your own story progress.");
  }

  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Get all story decisions for user
  const decisions = await StoryDecision.find({ userId }).sort({ createdAt: 1 });

  // Calculate completion percentage
  const decisionPercentage = Math.round((decisions.length / 5) * 100);

  // Build story context (narrative summary)
  const storyContext = buildStoryContext(decisions, storyData);

  res.status(200).json({
    success: true,
    message: "Story progress retrieved",
    data: {
      userId,
      storyStarted: decisions.length > 0,
      storyCompleted: user.storyProgress.completed,
      currentChapter: user.storyProgress.currentChapter,
      decisionsCount: decisions.length,
      completionPercentage: decisionPercentage,
      currentArchetype: user.supernaturalType,
      personalityTraits: user.personalityTraits,
      decisions: decisions.map((d) => ({
        chapter: d.chapter,
        decisionId: d.decisionId,
        choice: d.selectedText,
        consequence: d.consequence,
        traitImpact: d.traitImpact,
        madeAt: d.createdAt,
      })),
      storyContext,
    },
  });
});

/**
 * @desc    Get current user's story progress
 * @route   GET /api/story/my-progress
 * @access  Private
 *
 * Convenience endpoint for authenticated user.
 */
export const getMyStoryProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Get all story decisions
  const decisions = await StoryDecision.find({ userId }).sort({ createdAt: 1 });

  // Calculate completion percentage
  const decisionPercentage = Math.round((decisions.length / 5) * 100);

  // Build story context
  const storyContext = buildStoryContext(decisions, storyData);

  res.status(200).json({
    success: true,
    message: "Your story progress retrieved",
    data: {
      storyStarted: decisions.length > 0,
      storyCompleted: user.storyProgress.completed,
      currentChapter: user.storyProgress.currentChapter,
      decisionsCount: decisions.length,
      completionPercentage: decisionPercentage,
      currentArchetype: user.supernaturalType,
      personalityTraits: user.personalityTraits,
      decisions: decisions.map((d) => ({
        chapter: d.chapter,
        decisionId: d.decisionId,
        choice: d.selectedText,
        consequence: d.consequence,
        traitImpact: d.traitImpact,
        madeAt: d.createdAt,
      })),
      storyContext,
    },
  });
});

/**
 * @desc    Get all available story chapters (metadata only)
 * @route   GET /api/story/chapters
 * @access  Private
 *
 * Returns list of available chapters for UI navigation.
 */
export const getChapters = asyncHandler(async (req, res) => {
  const chapters = storyData.map((ch) => ({
    chapterId: ch.chapterId,
    title: ch.title,
    description: ch.description,
    decisionCount: ch.decisions?.length || 0,
  }));

  res.status(200).json({
    success: true,
    message: "Story chapters retrieved",
    data: {
      totalChapters: chapters.length,
      chapters,
    },
  });
});
