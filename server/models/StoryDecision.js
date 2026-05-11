/**
 * StoryDecision Model
 *
 * Tracks user decisions made during story mode.
 * Records what choice was made, when, and what impact it had.
 *
 * This model allows us to:
 * - Track story progression
 * - Calculate trait evolution
 * - Remember user choices for narrative continuity
 * - Analyze decision patterns
 */

import mongoose from "mongoose";

const storyDecisionSchema = new mongoose.Schema(
  {
    // Reference to the user making the decision
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Story chapter (1, 2, 3, etc.)
    chapter: {
      type: Number,
      required: [true, "Chapter number is required"],
      min: 1,
    },

    // Unique identifier for this decision within the chapter
    decisionId: {
      type: String,
      required: [true, "Decision ID is required"],
      // e.g., "d_1_1", "d_2_1", "d_3_1"
    },

    // Which option did the user choose (0-indexed)
    choiceIndex: {
      type: Number,
      required: [true, "Choice index is required"],
      min: 0,
      max: 3, // Currently all decisions have 3-4 options
    },

    // The text of the option they selected (for easy reference)
    selectedText: {
      type: String,
      required: [true, "Selected text is required"],
    },

    // The trait impacts that were applied
    traitImpact: {
      loyalty: { type: Number, default: 0 },
      aggression: { type: Number, default: 0 },
      empathy: { type: Number, default: 0 },
      strategy: { type: Number, default: 0 },
      dominance: { type: Number, default: 0 },
      emotionalDepth: { type: Number, default: 0 },
    },

    // Optional consequence text that was triggered
    consequence: {
      type: String,
      default: "",
    },

    // Next scene ID if the decision leads to a specific path
    nextScene: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick lookups by user
storyDecisionSchema.index({ userId: 1, createdAt: -1 });

// Index for chapter-based queries
storyDecisionSchema.index({ userId: 1, chapter: 1 });

// Unique constraint: one decision per user per decision ID
// (prevents double-submitting the same decision)
storyDecisionSchema.index(
  { userId: 1, decisionId: 1 },
  { unique: true }
);

const StoryDecision = mongoose.model("StoryDecision", storyDecisionSchema);

export default StoryDecision;
