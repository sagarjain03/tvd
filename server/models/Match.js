/**
 * Match Model
 *
 * Represents a potential or confirmed romantic match between two users.
 * Stores compatibility scores, match status, and references to chat.
 *
 * Lifecycle:
 * 1. pending - one user liked another, awaiting reciprocal like
 * 2. matched - both users liked each other, chat created
 * 3. rejected - one or both users rejected
 */

import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    // First user in the match
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User 1 is required"],
    },

    // Second user in the match
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User 2 is required"],
    },

    // Compatibility score from matching algorithm (0–100)
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Human-readable label (e.g., "Ancient Bond", "Fated Rivals")
    compatibilityLabel: {
      type: String,
      default: "",
    },

    // AI-generated explanation of compatibility
    // Populated in Phase 6 with Groq
    matchExplanation: {
      type: String,
      default: "",
    },

    // Match status
    // pending: one-sided like, awaiting reciprocal
    // matched: mutual like, chat created
    // rejected: one or both users rejected
    status: {
      type: String,
      enum: ["pending", "matched", "rejected"],
      default: "pending",
    },

    // Which user initiated this match (liked first)
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Reference to Chat document (created when status becomes "matched")
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    // Whether matched users have unlocked each other's dark side profiles
    darkSideUnlocked: {
      type: Boolean,
      default: false,
    },

    // Breakdown of compatibility score for display
    // { similarityScore: 80, archetypeScore: 70, complementaryScore: 85, ... }
    scoreBreakdown: {
      similarityScore: { type: Number, default: 0 },
      archetypeScore: { type: Number, default: 0 },
      complementaryScore: { type: Number, default: 0 },
      storyAlignmentScore: { type: Number, default: 0 },
      activityScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Prevent duplicate matches (unique pair of users regardless of order)
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Fast lookups for finding matches by user and status
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

// Get newest matches first
matchSchema.index({ createdAt: -1 });

const Match = mongoose.model("Match", matchSchema);

export default Match;
