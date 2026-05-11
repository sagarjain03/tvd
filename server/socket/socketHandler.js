/**
 * Socket.io Handler
 *
 * Core real-time chat system using Socket.io
 * Handles:
 * - JWT authentication for socket connections
 * - Join/leave chat rooms
 * - Message sending and receiving
 * - Typing indicators
 * - Read receipts
 * - Pinned messages (Compulsions)
 * - Online status tracking
 *
 * Architecture:
 * - Personal user rooms (by userId) for notifications
 * - Chat rooms (by chatId) for message broadcast
 * - onlineUsers map to track connected users
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// Track online users: userId → socketId
const onlineUsers = new Map();

/**
 * Main Socket.io handler
 * Called with io instance from server.js
 */
export const socketHandler = (io) => {
  /**
   * Middleware: Authenticate socket connection with JWT
   * Token passed in auth.token from client
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        "_id name profilePhoto supernaturalType"
      );

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket for later use
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  /**
   * Main connection handler
   */
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🧛 ${socket.user.name} connected (${socket.id})`);

    // Track online status
    onlineUsers.set(userId, socket.id);

    // Notify everyone that this user is online
    io.emit("user_online", { userId, name: socket.user.name });

    // ─── JOIN PERSONAL USER ROOM ─────────────────────────────────────────────
    // Each user joins a room named after their userId
    // Used for notifications, match alerts, etc.
    socket.join(userId);

    // ─── JOIN CHAT ROOM ──────────────────────────────────────────────────────
    socket.on("join_chat", async ({ chatId }) => {
      try {
        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return socket.emit("error", { message: "Chat not found" });
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return socket.emit("error", { message: "Not authorised for this chat" });
        }

        // Join the chat room
        socket.join(chatId);
        socket.emit("joined_chat", { chatId });

        console.log(`✅ ${socket.user.name} joined chat ${chatId}`);
      } catch (err) {
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ─── LEAVE CHAT ROOM ─────────────────────────────────────────────────────
    socket.on("leave_chat", ({ chatId }) => {
      socket.leave(chatId);
      console.log(`❌ ${socket.user.name} left chat ${chatId}`);
    });

    // ─── SEND MESSAGE (DIARY ENTRY) ───────────────────────────────────────────
    socket.on("send_message", async ({ chatId, content }) => {
      try {
        // Validate content
        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Diary entry cannot be empty" });
        }

        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return socket.emit("error", { message: "Chat not found" });
        }

        // Verify user is a participant
        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return socket.emit("error", { message: "Not authorised" });
        }

        // Create message in database
        const message = await Message.create({
          chatId,
          senderId: socket.user._id,
          content: content.trim(),
        });

        // Populate sender info
        const populated = await message.populate(
          "senderId",
          "name profilePhoto supernaturalType"
        );

        // Broadcast message to everyone in the chat room
        io.to(chatId).emit("receive_message", populated);

        // Send notification to the other participant if online but not in chat
        const otherParticipant = chat.participants.find(
          (p) => p.toString() !== userId
        );

        if (otherParticipant) {
          const otherSocketId = onlineUsers.get(otherParticipant.toString());
          if (otherSocketId) {
            // Send to their personal room for notification
            io.to(otherParticipant.toString()).emit("new_message_notification", {
              chatId,
              from: {
                id: socket.user._id,
                name: socket.user.name,
                profilePhoto: socket.user.profilePhoto,
              },
              preview: content.substring(0, 50),
            });
          }
        }

        console.log(`💬 Message sent in chat ${chatId}`);
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("error", { message: "Failed to send diary entry" });
      }
    });

    // ─── TYPING INDICATORS ────────────────────────────────────────────────────
    socket.on("typing_start", ({ chatId }) => {
      // Emit to everyone EXCEPT the sender
      socket.to(chatId).emit("user_typing", {
        userId,
        name: socket.user.name,
      });
    });

    socket.on("typing_stop", ({ chatId }) => {
      // Emit to everyone EXCEPT the sender
      socket.to(chatId).emit("user_stopped_typing", { userId });
    });

    // ─── MESSAGE READ RECEIPTS ───────────────────────────────────────────────
    socket.on("messages_seen", async ({ chatId }) => {
      try {
        // Mark unread messages in this chat as read
        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: socket.user._id },
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Notify other participants that messages were read
        socket.to(chatId).emit("messages_read", {
          chatId,
          readBy: userId,
          readAt: new Date(),
        });

        console.log(`✅ ${socket.user.name} read messages in ${chatId}`);
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    });

    // ─── PIN MESSAGE (COMPULSION) ─────────────────────────────────────────────
    socket.on("pin_message", async ({ chatId, messageId }) => {
      try {
        // Find message
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        // Toggle pin status
        message.isPinned = !message.isPinned;
        await message.save();

        // Broadcast to everyone in the chat room
        io.to(chatId).emit("message_pinned", {
          messageId,
          isPinned: message.isPinned,
          pinnedBy: userId,
          pinnedByName: socket.user.name,
        });

        const action = message.isPinned ? "compelled" : "released";
        console.log(`📌 Message ${action} in chat ${chatId}`);
      } catch (err) {
        console.error("Error pinning message:", err);
        socket.emit("error", { message: "Failed to compel this entry" });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🧛 ${socket.user.name} disconnected`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Notify everyone that user is offline
      io.emit("user_offline", { userId, name: socket.user.name });
    });
  });
};

/**
 * Utility: Check if a user is currently online
 * Can be used by other modules (e.g., match suggestions)
 */
export const isUserOnline = (userId) => onlineUsers.has(userId.toString());

/**
 * Utility: Get array of all online user IDs
 */
export const getOnlineUsers = () => Array.from(onlineUsers.keys());

/**
 * Utility: Get socket ID for a user (if online)
 */
export const getUserSocketId = (userId) => onlineUsers.get(userId.toString());
