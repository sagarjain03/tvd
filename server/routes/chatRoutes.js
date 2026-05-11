/**
 * Chat Routes
 *
 * REST endpoints for chat/message functionality:
 * - GET /api/chat/:chatId/messages - Get message history
 * - POST /api/chat/:chatId/messages - Send message (REST fallback)
 * - GET /api/chat/:chatId/messages/pinned - Get pinned messages
 * - PATCH /api/chat/:chatId/messages/:msgId/pin - Toggle pin
 * - PATCH /api/chat/:chatId/messages/read - Mark all read
 * - GET /api/chat/unread-count - Get unread count
 *
 * All routes require JWT authentication (protect middleware)
 */

import express from "express";
import {
  getMessages,
  sendMessage,
  togglePinMessage,
  markAllRead,
  getPinnedMessages,
  getUnreadCount,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * GET /api/chat/unread-count
 * Get total unread count across all chats
 * Must come before /:chatId routes to avoid route conflict
 */
router.get("/unread-count", getUnreadCount);

/**
 * GET /api/chat/:chatId/messages
 * Get paginated message history
 * Query params: page, limit
 */
router.get("/:chatId/messages", getMessages);

/**
 * POST /api/chat/:chatId/messages
 * Send a message (fallback for socket failures)
 */
router.post("/:chatId/messages", sendMessage);

/**
 * GET /api/chat/:chatId/messages/pinned
 * Get all pinned messages in chat
 * Must come before /:messageId routes
 */
router.get("/:chatId/messages/pinned", getPinnedMessages);

/**
 * PATCH /api/chat/:chatId/messages/:messageId/pin
 * Toggle pin on a message (Compulsion)
 */
router.patch("/:chatId/messages/:messageId/pin", togglePinMessage);

/**
 * PATCH /api/chat/:chatId/messages/read
 * Mark all unread messages in chat as read
 */
router.patch("/:chatId/messages/read", markAllRead);

export default router;
