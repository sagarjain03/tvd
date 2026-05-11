/**
 * Message Model
 *
 * Represents individual messages/diary entries in a chat.
 * Supports:
 * - Message persistence
 * - Read receipts
 * - Pinned messages (Compulsions)
 * - Indexed queries for performance
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content cannot be empty"],
      maxlength: [2000, "Diary entry cannot exceed 2000 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false, // "Compulsion" feature
    },
  },
  { timestamps: true }
);

// Index for efficient chat history queries
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ chatId: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
