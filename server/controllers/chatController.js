/**
 * Chat Controller
 *
 * Handles REST endpoints for chat functionality:
 * - Message history retrieval with pagination
 * - Message creation (fallback for socket failures)
 * - Message pinning/unpinning (Compulsions)
 * - Read receipt management
 * - Unread count tracking
 *
 * All endpoints require authentication and chat membership verification.
 */

import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

/**
 * Helper: Verify user is a participant in a chat
 */
const verifyChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) return null;
  const isParticipant = chat.participants.some((p) => p.toString() === userId.toString());
  return isParticipant ? chat : null;
};

/**
 * @desc    Get message history for a chat with pagination
 * @route   GET /api/chat/:chatId/messages
 * @access  Private
 *
 * Query params:
 * - page: Page number (default 1)
 * - limit: Messages per page (default 50)
 *
 * Returns messages in chronological order (oldest first)
 * and marks unread messages as read
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify user is a participant
  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Fetch messages sorted newest first
  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("senderId", "name profilePhoto supernaturalType");

  const total = await Message.countDocuments({ chatId });

  // Mark unread messages as read
  await Message.updateMany(
    {
      chatId,
      senderId: { $ne: req.user._id },
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  res.json({
    success: true,
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: skip + messages.length < total,
    },
  });
});

/**
 * @desc    Send a message via REST (fallback if socket fails)
 * @route   POST /api/chat/:chatId/messages
 * @access  Private
 *
 * Payload:
 * { content: string }
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  // Validate content
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Diary entry cannot be empty");
  }

  // Verify participant
  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  // Create message
  const message = await Message.create({
    chatId,
    senderId: req.user._id,
    content: content.trim(),
  });

  const populated = await message.populate(
    "senderId",
    "name profilePhoto supernaturalType"
  );

  res.status(201).json({ success: true, message: populated });
});

/**
 * @desc    Toggle pin on a message (Compulsion)
 * @route   PATCH /api/chat/:chatId/messages/:messageId/pin
 * @access  Private
 */
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  // Verify participant
  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  // Find message
  const message = await Message.findById(messageId);
  if (!message || message.chatId.toString() !== chatId) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Toggle pin
  message.isPinned = !message.isPinned;
  await message.save();

  res.json({
    success: true,
    message,
    action: message.isPinned ? "compelled" : "released",
  });
});

/**
 * @desc    Mark all messages in a chat as read
 * @route   PATCH /api/chat/:chatId/messages/read
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  // Verify participant
  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  // Mark unread messages as read
  await Message.updateMany(
    {
      chatId,
      senderId: { $ne: req.user._id },
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  res.json({ success: true, message: "All diary entries marked as read" });
});

/**
 * @desc    Get pinned messages in a chat
 * @route   GET /api/chat/:chatId/messages/pinned
 * @access  Private
 *
 * Returns all pinned messages (Compulsions) sorted newest first
 */
export const getPinnedMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  // Verify participant
  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  // Get pinned messages
  const pinned = await Message.find({ chatId, isPinned: true })
    .sort({ createdAt: -1 })
    .populate("senderId", "name profilePhoto");

  res.json({ success: true, pinnedMessages: pinned });
});

/**
 * @desc    Get total unread message count across all chats
 * @route   GET /api/chat/unread-count
 * @access  Private
 *
 * Returns count of unread messages the user has received
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  // Get all chats this user participates in
  const chats = await Chat.find({ participants: req.user._id }).select("_id");
  const chatIds = chats.map((c) => c._id);

  // Count unread messages
  const unreadCount = await Message.countDocuments({
    chatId: { $in: chatIds },
    senderId: { $ne: req.user._id },
    isRead: false,
  });

  res.json({ success: true, unreadCount });
});
