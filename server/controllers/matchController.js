/**
 * Match Controller
 *
 * Handles matching endpoints:
 * - GET /api/matches - Get user's matches
 * - GET /api/matches/suggestions - Get match suggestions
 * - POST /api/matches/like/:userId - Like a user
 * - POST /api/matches/reject/:userId - Reject a user
 * - GET /api/matches/:matchId - Get match details
 */

import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Match from "../models/Match.js";
import Chat from "../models/Chat.js";
import StoryDecision from "../models/StoryDecision.js";
import { calculateCompatibility, getArchetypePairingDescription } from "../utils/compatibilityEngine.js";
import { generateFullMatchExplanation } from "../utils/matchExplanationGenerator.js";

/**
 * @desc    Get all matches for current user
 * @route   GET /api/matches
 * @access  Private
 *
 * Returns both pending and matched relationships.
 * Includes both user1 and user2 perspectives.
 */
export const getMatches = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all matches where user is either user1 or user2
  const matches = await Match.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate("user1", "name profilePhoto supernaturalType personalityTraits")
    .populate("user2", "name profilePhoto supernaturalType personalityTraits")
    .populate("chatId")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Matches retrieved",
    data: {
      totalMatches: matches.length,
      matches: matches.map((m) => ({
        matchId: m._id,
        with: m.user1._id === userId ? m.user2 : m.user1,
        compatibilityScore: m.compatibilityScore,
        compatibilityLabel: m.compatibilityLabel,
        status: m.status,
        chatId: m.chatId,
        createdAt: m.createdAt,
      })),
    },
  });
});

/**
 * @desc    Get match suggestions (top compatible users)
 * @route   GET /api/matches/suggestions
 * @access  Private
 *
 * Returns list of compatible users sorted by compatibility.
 * Excludes:
 * - Self
 * - Already matched users
 * - Liked/rejected users
 * - Users who rejected current user
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  // Get current user with full profile
  const currentUser = await User.findById(userId).populate("storyDecisions");
  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Get users to exclude
  const excludedMatches = await Match.find({
    $or: [{ user1: userId }, { user2: userId }],
  }).select("user1 user2");

  const excludedIds = new Set([userId]);
  for (const match of excludedMatches) {
    excludedIds.add(match.user1.toString());
    excludedIds.add(match.user2.toString());
  }

  // Get liked and rejected users
  const likedUsers = currentUser.likedUsers || [];
  const rejectedUsers = currentUser.rejectedUsers || [];

  for (const id of likedUsers) {
    excludedIds.add(id.toString());
  }
  for (const id of rejectedUsers) {
    excludedIds.add(id.toString());
  }

  // Get potential matches
  const potentialMatches = await User.find({
    _id: { $nin: Array.from(excludedIds) },
    quizCompleted: true, // Must complete quiz
  })
    .populate("storyDecisions")
    .limit(limit * 3); // Get more than needed for scoring

  // Calculate compatibility with each
  const scored = potentialMatches.map((user) => {
    const compatibility = calculateCompatibility(currentUser, user);
    return {
      user,
      compatibility,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.compatibility.score - a.compatibility.score);

  // Return top matches
  const suggestions = scored.slice(0, limit).map((item) => ({
    userId: item.user._id,
    name: item.user.name,
    profilePhoto: item.user.profilePhoto,
    supernaturalType: item.user.supernaturalType,
    compatibilityScore: item.compatibility.score,
    compatibilityLabel: item.compatibility.label,
    personalityTraits: {
      loyalty: item.user.personalityTraits?.loyalty || 0,
      empathy: item.user.personalityTraits?.empathy || 0,
      dominance: item.user.personalityTraits?.dominance || 0,
    },
  }));

  res.status(200).json({
    success: true,
    message: "Match suggestions retrieved",
    data: {
      totalSuggestions: suggestions.length,
      suggestions,
    },
  });
});

/**
 * @desc    Like a user (initiate or confirm match)
 * @route   POST /api/matches/like/:userId
 * @access  Private
 *
 * If both users like each other:
 * - Change status to "matched"
 * - Create Chat document
 * - Return match confirmation
 *
 * If one-sided:
 * - Create Match with "pending" status
 */
export const likeUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.userId;

  // Prevent self-like
  if (currentUserId.toString() === targetUserId) {
    res.status(400);
    throw new Error("You cannot like yourself");
  }

  // Verify target user exists and completed quiz
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!targetUser.quizCompleted) {
    res.status(400);
    throw new Error("Target user has not completed the personality quiz");
  }

  // Check if already liked/rejected
  const currentUser = await User.findById(currentUserId);
  if (currentUser.rejectedUsers?.includes(targetUserId)) {
    res.status(400);
    throw new Error("You have rejected this user");
  }

  if (currentUser.likedUsers?.includes(targetUserId)) {
    res.status(400);
    throw new Error("You have already liked this user");
  }

  // Check if match already exists
  let existingMatch = await Match.findOne({
    $or: [
      { user1: currentUserId, user2: targetUserId },
      { user1: targetUserId, user2: currentUserId },
    ],
  });

  // Add to liked users
  if (!currentUser.likedUsers) {
    currentUser.likedUsers = [];
  }
  if (!currentUser.likedUsers.includes(targetUserId)) {
    currentUser.likedUsers.push(targetUserId);
  }

  // If no existing match, create one
  if (!existingMatch) {
    // Calculate compatibility
    const targetUserFull = await User.findById(targetUserId).populate("storyDecisions");
    const compatibility = calculateCompatibility(currentUser, targetUserFull);

    existingMatch = new Match({
      user1: currentUserId,
      user2: targetUserId,
      compatibilityScore: compatibility.score,
      compatibilityLabel: compatibility.label,
      scoreBreakdown: compatibility.breakdown,
      status: "pending",
      initiatedBy: currentUserId,
    });

    await existingMatch.save();
  } else {
    // Check if target user already liked current user
    if (targetUser.likedUsers?.includes(currentUserId)) {
      // Mutual like! Create chat and set to matched
      existingMatch.status = "matched";

      // Create chat
      const chat = new Chat({
        matchId: existingMatch._id,
        participants: [currentUserId, targetUserId],
      });
      await chat.save();

      existingMatch.chatId = chat._id;
    } else {
      // One-sided, keep pending
      existingMatch.status = "pending";
      existingMatch.initiatedBy = currentUserId;
    }

    await existingMatch.save();
  }

  // Save current user
  currentUser.activityScore = (currentUser.activityScore || 0) + 5;
  await currentUser.save();

  res.status(200).json({
    success: true,
    message:
      existingMatch.status === "matched"
        ? "It's a match! A new conversation has been created."
        : "Like sent. Awaiting their response.",
    data: {
      matchId: existingMatch._id,
      status: existingMatch.status,
      compatibilityScore: existingMatch.compatibilityScore,
      compatibilityLabel: existingMatch.compatibilityLabel,
      chatId: existingMatch.chatId || null,
    },
  });
});

/**
 * @desc    Reject a user
 * @route   POST /api/matches/reject/:userId
 * @access  Private
 *
 * Stores rejection to exclude from future suggestions.
 * If Match exists, updates status to "rejected".
 */
export const rejectUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.userId;

  // Prevent self-reject
  if (currentUserId.toString() === targetUserId) {
    res.status(400);
    throw new Error("You cannot reject yourself");
  }

  // Verify target exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Get current user
  const currentUser = await User.findById(currentUserId);

  // Check if already rejected
  if (currentUser.rejectedUsers?.includes(targetUserId)) {
    res.status(400);
    throw new Error("You have already rejected this user");
  }

  // Add to rejected users
  if (!currentUser.rejectedUsers) {
    currentUser.rejectedUsers = [];
  }
  currentUser.rejectedUsers.push(targetUserId);

  // Remove from liked if present
  if (currentUser.likedUsers?.includes(targetUserId)) {
    currentUser.likedUsers = currentUser.likedUsers.filter(
      (id) => id.toString() !== targetUserId
    );
  }

  // Update Match status if exists
  const existingMatch = await Match.findOne({
    $or: [
      { user1: currentUserId, user2: targetUserId },
      { user1: targetUserId, user2: currentUserId },
    ],
  });

  if (existingMatch) {
    existingMatch.status = "rejected";
    await existingMatch.save();
  }

  // Save current user
  await currentUser.save();

  res.status(200).json({
    success: true,
    message: "User rejected",
    data: {
      rejected: true,
    },
  });
});

/**
 * @desc    Get details of a specific match
 * @route   GET /api/matches/:matchId
 * @access  Private
 *
 * Returns full match details including:
 * - Both user profiles
 * - Compatibility breakdown
 * - Explanation text
 * - Chat reference
 */
export const getMatchDetails = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const currentUserId = req.user._id;

  // Get match
  const match = await Match.findById(matchId)
    .populate("user1", "name profilePhoto supernaturalType personalityTraits darkSideProfile")
    .populate("user2", "name profilePhoto supernaturalType personalityTraits darkSideProfile")
    .populate("chatId");

  if (!match) {
    res.status(404);
    throw new Error("Match not found");
  }

  // Verify authorization
  if (
    match.user1._id.toString() !== currentUserId.toString() &&
    match.user2._id.toString() !== currentUserId.toString()
  ) {
    res.status(403);
    throw new Error("Unauthorized. Can only view your own matches.");
  }

  // Determine which user is "other"
  const otherUser =
    match.user1._id.toString() === currentUserId.toString() ? match.user2 : match.user1;

  // Generate explanation if not already stored
  let explanation = match.matchExplanation;
  if (!explanation) {
    const explanationObj = generateFullMatchExplanation(
      match.user1,
      match.user2,
      {
        score: match.compatibilityScore,
        label: match.compatibilityLabel,
        breakdown: match.scoreBreakdown,
      }
    );
    explanation = explanationObj.summary;
  }

  res.status(200).json({
    success: true,
    message: "Match details retrieved",
    data: {
      matchId: match._id,
      with: {
        userId: otherUser._id,
        name: otherUser.name,
        profilePhoto: otherUser.profilePhoto,
        supernaturalType: otherUser.supernaturalType,
        personalityTraits: otherUser.personalityTraits,
        // Only show dark side if unlocked or matched
        darkSideProfile:
          match.status === "matched" && match.darkSideUnlocked
            ? otherUser.darkSideProfile
            : null,
      },
      compatibility: {
        score: match.compatibilityScore,
        label: match.compatibilityLabel,
        breakdown: match.scoreBreakdown,
        pairing: getArchetypePairingDescription(
          match.user1.supernaturalType,
          match.user2.supernaturalType
        ),
      },
      explanation,
      status: match.status,
      chatId: match.chatId,
      createdAt: match.createdAt,
    },
  });
});

/**
 * @desc    Get user's interaction history
 * @route   GET /api/matches/activity/history
 * @access  Private
 *
 * Returns summary of likes, rejects, and matches.
 */
export const getMatchingHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  const matchCount = await Match.countDocuments({
    $or: [{ user1: userId }, { user2: userId }],
    status: "matched",
  });

  const likedCount = user.likedUsers?.length || 0;
  const rejectedCount = user.rejectedUsers?.length || 0;
  const pendingCount = await Match.countDocuments({
    $or: [{ user1: userId }, { user2: userId }],
    status: "pending",
  });

  res.status(200).json({
    success: true,
    message: "Matching activity retrieved",
    data: {
      matches: matchCount,
      pending: pendingCount,
      liked: likedCount,
      rejected: rejectedCount,
      activityScore: user.activityScore || 0,
    },
  });
});
