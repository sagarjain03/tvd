# Phase 5 — Real-Time Chat System (Socket.io)

## Overview

This phase wires up the full real-time chat system. Messages are called
"Diary Entries" in the UI. The backend handles both REST endpoints (for
loading message history) and Socket.io events (for live messaging).

The Chat model was created in Phase 4. This phase builds on top of it
with the Message model, chat controller, and the complete socket handler.

> ⚠️ Phase 4 must be complete before Phase 5.
> Chats are created when a mutual match is formed (Phase 4).
> A chatId must exist on a Match before this phase's endpoints are used.

---

## Folder Structure Added in This Phase

```
server/
├── controllers/
│   └── chatController.js           ← NEW
├── models/
│   └── Message.js                  ← NEW
├── routes/
│   └── chatRoutes.js               ← NEW
├── socket/
│   └── socketHandler.js            ← NEW
```

---

## Dependencies

```bash
npm install socket.io
```

---

## `models/Message.js`

```javascript
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
    isPinned: {
      type: Boolean,
      default: false,   // "Compulsion" feature
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient chat history queries
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ chatId: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
```

---

## `controllers/chatController.js`

```javascript
import asyncHandler from "express-async-handler";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Match from "../models/Match.js";

// Helper: verify user is a participant in a chat
const verifyChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) return null;
  const isParticipant = chat.participants.some(
    (p) => p.toString() === userId.toString()
  );
  return isParticipant ? chat : null;
};

// @desc    Get message history for a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 }) // Newest first
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
    messages: messages.reverse(), // Return chronological order
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: skip + messages.length < total,
    },
  });
});

// @desc    Send a message via REST (fallback if socket fails)
// @route   POST /api/chat/:chatId/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Diary entry cannot be empty");
  }

  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  const message = await Message.create({
    chatId,
    senderId: req.user._id,
    content: content.trim(),
  });

  const populated = await message.populate("senderId", "name profilePhoto supernaturalType");

  res.status(201).json({ success: true, message: populated });
});

// @desc    Pin / unpin a message ("Compulsion")
// @route   PATCH /api/chat/:chatId/messages/:messageId/pin
// @access  Private
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  const message = await Message.findById(messageId);
  if (!message || message.chatId.toString() !== chatId) {
    res.status(404);
    throw new Error("Message not found");
  }

  message.isPinned = !message.isPinned;
  await message.save();

  res.json({
    success: true,
    message,
    action: message.isPinned ? "compelled" : "released",
  });
});

// @desc    Mark all messages in a chat as read
// @route   PATCH /api/chat/:chatId/messages/read
// @access  Private
export const markAllRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

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

// @desc    Get pinned messages in a chat
// @route   GET /api/chat/:chatId/messages/pinned
// @access  Private
export const getPinnedMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await verifyChatParticipant(chatId, req.user._id);
  if (!chat) {
    res.status(403);
    throw new Error("Not authorised to access this chat");
  }

  const pinned = await Message.find({ chatId, isPinned: true })
    .sort({ createdAt: -1 })
    .populate("senderId", "name profilePhoto");

  res.json({ success: true, pinnedMessages: pinned });
});

// @desc    Get unread message count across all chats
// @route   GET /api/chat/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  // Get all chats this user participates in
  const chats = await Chat.find({ participants: req.user._id }).select("_id");
  const chatIds = chats.map((c) => c._id);

  const unreadCount = await Message.countDocuments({
    chatId: { $in: chatIds },
    senderId: { $ne: req.user._id },
    isRead: false,
  });

  res.json({ success: true, unreadCount });
});
```

---

## `routes/chatRoutes.js`

```javascript
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

router.get("/unread-count", protect, getUnreadCount);
router.get("/:chatId/messages", protect, getMessages);
router.post("/:chatId/messages", protect, sendMessage);
router.get("/:chatId/messages/pinned", protect, getPinnedMessages);
router.patch("/:chatId/messages/:messageId/pin", protect, togglePinMessage);
router.patch("/:chatId/messages/read", protect, markAllRead);

export default router;
```

---

## `socket/socketHandler.js` — Full Socket.io Handler

```javascript
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

// Online users map: userId → socketId
const onlineUsers = new Map();

export const socketHandler = (io) => {
  // Middleware: Authenticate socket connection with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name profilePhoto supernaturalType");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🧛 ${socket.user.name} connected (${socket.id})`);

    // Track online status
    onlineUsers.set(userId, socket.id);
    io.emit("user_online", { userId });

    // ─── JOIN PERSONAL ROOM ──────────────────────────────────────────────────
    // Each user joins a room named after their userId for direct notifications
    socket.join(userId);

    // ─── JOIN CHAT ROOM ───────────────────────────────────────────────────────
    socket.on("join_chat", async ({ chatId }) => {
      try {
        // Verify user is a participant
        const chat = await Chat.findById(chatId);
        if (!chat) return socket.emit("error", { message: "Chat not found" });

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return socket.emit("error", { message: "Not authorised for this chat" });
        }

        socket.join(chatId);
        socket.emit("joined_chat", { chatId });
        console.log(`${socket.user.name} joined chat ${chatId}`);
      } catch (err) {
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ─── LEAVE CHAT ROOM ──────────────────────────────────────────────────────
    socket.on("leave_chat", ({ chatId }) => {
      socket.leave(chatId);
    });

    // ─── SEND DIARY ENTRY (MESSAGE) ───────────────────────────────────────────
    socket.on("send_message", async ({ chatId, content }) => {
      try {
        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Diary entry cannot be empty" });
        }

        // Verify participant
        const chat = await Chat.findById(chatId);
        if (!chat) return socket.emit("error", { message: "Chat not found" });

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          return socket.emit("error", { message: "Not authorised" });
        }

        // Save message to DB
        const message = await Message.create({
          chatId,
          senderId: socket.user._id,
          content: content.trim(),
        });

        const populated = await message.populate(
          "senderId",
          "name profilePhoto supernaturalType"
        );

        // Emit to everyone in the chat room (including sender)
        io.to(chatId).emit("receive_message", populated);

        // Send notification to the other participant if they're online
        // but not currently in this chat room
        const otherParticipant = chat.participants.find(
          (p) => p.toString() !== userId
        );

        if (otherParticipant) {
          const otherSocketId = onlineUsers.get(otherParticipant.toString());
          if (otherSocketId) {
            // Send to their personal room so they get notified even outside chat
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
      } catch (err) {
        socket.emit("error", { message: "Failed to send diary entry" });
      }
    });

    // ─── TYPING INDICATORS ────────────────────────────────────────────────────
    socket.on("typing_start", ({ chatId }) => {
      // Emit to everyone ELSE in the room
      socket.to(chatId).emit("user_typing", {
        userId,
        name: socket.user.name,
      });
    });

    socket.on("typing_stop", ({ chatId }) => {
      socket.to(chatId).emit("user_stopped_typing", { userId });
    });

    // ─── MESSAGE SEEN ─────────────────────────────────────────────────────────
    socket.on("messages_seen", async ({ chatId }) => {
      try {
        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: socket.user._id },
            isRead: false,
          },
          { isRead: true, readAt: new Date() }
        );

        // Notify sender that their messages were read
        socket.to(chatId).emit("messages_read", {
          chatId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    });

    // ─── PIN MESSAGE (COMPULSION) ─────────────────────────────────────────────
    socket.on("pin_message", async ({ chatId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.isPinned = !message.isPinned;
        await message.save();

        io.to(chatId).emit("message_pinned", {
          messageId,
          isPinned: message.isPinned,
          pinnedBy: userId,
        });
      } catch (err) {
        socket.emit("error", { message: "Failed to compel this entry" });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🧛 ${socket.user.name} disconnected`);
      onlineUsers.delete(userId);
      io.emit("user_offline", { userId });
    });
  });
};

// Utility: check if a user is online (used by other modules)
export const isUserOnline = (userId) => onlineUsers.has(userId.toString());
export const getOnlineUsers = () => Array.from(onlineUsers.keys());
```

---

## Update `server.js` — Integrate Socket.io

Replace the `app.listen` block in `server.js` with:

```javascript
import { createServer } from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket/socketHandler.js";
import chatRoutes from "./routes/chatRoutes.js";

// ...existing imports and middleware...

app.use("/api/chat", chatRoutes);

// Create HTTP server and attach Socket.io
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`Server + Socket.io running on port ${PORT} 🧛`)
);
```

---

## Socket.io Event Reference

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ chatId }` | Join a chat room |
| `leave_chat` | `{ chatId }` | Leave a chat room |
| `send_message` | `{ chatId, content }` | Send a diary entry |
| `typing_start` | `{ chatId }` | Start typing indicator |
| `typing_stop` | `{ chatId }` | Stop typing indicator |
| `messages_seen` | `{ chatId }` | Mark messages as read |
| `pin_message` | `{ chatId, messageId }` | Toggle pin (Compulsion) |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `joined_chat` | `{ chatId }` | Confirmation of room join |
| `receive_message` | Full message object | New message received |
| `new_message_notification` | `{ chatId, from, preview }` | Notification outside chat |
| `user_typing` | `{ userId, name }` | Someone is "writing in diary…" |
| `user_stopped_typing` | `{ userId }` | Typing stopped |
| `messages_read` | `{ chatId, readBy, readAt }` | Messages seen by other user |
| `message_pinned` | `{ messageId, isPinned, pinnedBy }` | Message pinned/unpinned |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `error` | `{ message }` | Socket error |

---

## API Endpoints in This Phase

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/chat/:chatId/messages` | Private | Get paginated message history |
| POST | `/api/chat/:chatId/messages` | Private | Send message (REST fallback) |
| GET | `/api/chat/:chatId/messages/pinned` | Private | Get pinned messages |
| PATCH | `/api/chat/:chatId/messages/:msgId/pin` | Private | Toggle pin (Compulsion) |
| PATCH | `/api/chat/:chatId/messages/read` | Private | Mark all as read |
| GET | `/api/chat/unread-count` | Private | Get total unread count |

---

## Testing Checklist

### REST Tests (Postman)
- [ ] `GET /api/chat/:chatId/messages` — returns messages in chronological order
- [ ] `GET /api/chat/:chatId/messages` without being a participant — returns 403
- [ ] `POST /api/chat/:chatId/messages` — creates message, returns populated sender
- [ ] `POST /api/chat/:chatId/messages` with empty content — returns 400
- [ ] `PATCH /api/chat/:chatId/messages/:msgId/pin` — toggles isPinned field
- [ ] `PATCH /api/chat/:chatId/messages/read` — marks all unread messages as read
- [ ] `GET /api/chat/unread-count` — returns correct unread count
- [ ] `GET /api/chat/:chatId/messages/pinned` — only returns isPinned: true messages

### Socket Tests (Use Socket.io client or Postman WebSocket)
- [ ] Connect with valid JWT token in `auth.token` — succeeds
- [ ] Connect without token — fails with auth error
- [ ] `join_chat` — receives `joined_chat` confirmation
- [ ] `send_message` — receives `receive_message` in the chat room
- [ ] `send_message` — other participant receives `new_message_notification`
- [ ] `typing_start` — other participant receives `user_typing`
- [ ] `typing_stop` — other participant receives `user_stopped_typing`
- [ ] `messages_seen` — other participant receives `messages_read`
- [ ] `pin_message` — both participants receive `message_pinned`
- [ ] Disconnect — `user_offline` emitted to all

---

## ✅ Phase 5 Complete When

- Message history loads with pagination
- Messages are created and delivered via socket in real-time
- Typing indicators work between two connected clients
- Read receipts update correctly
- Pinned messages ("Compulsion") toggle correctly
- Unread count is accurate
- Non-participants cannot access chats
- Socket authentication rejects invalid tokens