/**
 * Chat Model
 *
 * Represents a conversation between two matched users.
 * Messages are handled in Phase 5 (real-time with Socket.io).
 *
 * A Chat is created automatically when a Match status becomes "matched".
 */

import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // Reference to the Match that initiated this chat
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: [true, "Match ID is required"],
      unique: true, // One chat per match
    },

    // Two participants in the chat
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Last message preview for UI (populated in Phase 5)
    lastMessage: {
      type: String,
      default: "",
    },

    // Timestamp of last message (for sorting conversations)
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookups by match
chatSchema.index({ matchId: 1 });

// Index for participant queries
chatSchema.index({ participants: 1 });

// Get most recent chats first
chatSchema.index({ lastMessageAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
