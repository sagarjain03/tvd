/**
 * Phase 5 - Real-Time Chat System
 * API & Socket Testing Guide
 *
 * Complete examples for:
 * - REST API endpoints (Postman)
 * - Socket.io events (client-side)
 * - Frontend usage patterns
 * - Performance considerations
 */

// ============================================
// 1. SOCKET.IO CLIENT CONNECTION
// ============================================

/**
 * Frontend: Socket.io Client Connection Example
 * Install: npm install socket.io-client
 */

// React example
import io from "socket.io-client";

const connectSocket = (token) => {
  const socket = io(process.env.REACT_APP_SERVER_URL, {
    auth: {
      token: token, // JWT token from localStorage
    },
  });

  socket.on("connect", () => {
    console.log("✅ Connected to server");
    console.log("Socket ID:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });

  socket.on("error", (message) => {
    console.error("Socket error:", message);
  });

  return socket;
};

// ============================================
// 2. REST API ENDPOINTS - POSTMAN EXAMPLES
// ============================================

/**
 * GET /api/chat/unread-count
 * Get total unread message count
 */
GET http://localhost:5000/api/chat/unread-count
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "unreadCount": 5
}

// ============================================

/**
 * GET /api/chat/:chatId/messages
 * Get message history with pagination
 *
 * Query params:
 * - page: 1
 * - limit: 50
 */
GET http://localhost:5000/api/chat/64f7c2e1b8e2a4c6d9f3e8a1/messages?page=1&limit=50
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "messages": [
    {
      "_id": "64f7c2e1b8e2a4c6d9f3e8b1",
      "chatId": "64f7c2e1b8e2a4c6d9f3e8a1",
      "senderId": {
        "_id": "64f7c2e1b8e2a4c6d9f3e8a2",
        "name": "Elena",
        "profilePhoto": "https://...",
        "supernaturalType": "Witch"
      },
      "content": "Hi Stefan, how are you?",
      "isRead": true,
      "readAt": "2024-01-15T10:30:00Z",
      "isPinned": false,
      "createdAt": "2024-01-15T10:29:00Z",
      "updatedAt": "2024-01-15T10:29:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "hasMore": false
  }
}

// Error (403 - Not authorized):
{
  "success": false,
  "message": "Not authorised to access this chat"
}

// ============================================

/**
 * POST /api/chat/:chatId/messages
 * Send a message (REST fallback)
 */
POST http://localhost:5000/api/chat/64f7c2e1b8e2a4c6d9f3e8a1/messages
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request body:
{
  "content": "This is my diary entry"
}

Response (201):
{
  "success": true,
  "message": {
    "_id": "64f7c2e1b8e2a4c6d9f3e8b2",
    "chatId": "64f7c2e1b8e2a4c6d9f3e8a1",
    "senderId": {
      "_id": "64f7c2e1b8e2a4c6d9f3e8a3",
      "name": "Stefan",
      "profilePhoto": "https://...",
      "supernaturalType": "Vampire"
    },
    "content": "This is my diary entry",
    "isRead": false,
    "isPinned": false,
    "createdAt": "2024-01-15T10:35:00Z"
  }
}

// Error (400 - Empty content):
{
  "success": false,
  "message": "Diary entry cannot be empty"
}

// ============================================

/**
 * GET /api/chat/:chatId/messages/pinned
 * Get all pinned messages (Compulsions)
 */
GET http://localhost:5000/api/chat/64f7c2e1b8e2a4c6d9f3e8a1/messages/pinned
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "pinnedMessages": [
    {
      "_id": "64f7c2e1b8e2a4c6d9f3e8b1",
      "chatId": "64f7c2e1b8e2a4c6d9f3e8a1",
      "senderId": {
        "_id": "64f7c2e1b8e2a4c6d9f3e8a2",
        "name": "Elena",
        "profilePhoto": "https://..."
      },
      "content": "This is important!",
      "isRead": true,
      "isPinned": true,
      "createdAt": "2024-01-15T10:25:00Z"
    }
  ]
}

// ============================================

/**
 * PATCH /api/chat/:chatId/messages/:messageId/pin
 * Toggle pin on a message (Compulsion)
 */
PATCH http://localhost:5000/api/chat/64f7c2e1b8e2a4c6d9f3e8a1/messages/64f7c2e1b8e2a4c6d9f3e8b1/pin
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "message": {
    "_id": "64f7c2e1b8e2a4c6d9f3e8b1",
    "isPinned": true,
    ...
  },
  "action": "compelled"
}

// Toggle back to unpin:
// Response action: "released"

// ============================================

/**
 * PATCH /api/chat/:chatId/messages/read
 * Mark all unread messages as read
 */
PATCH http://localhost:5000/api/chat/64f7c2e1b8e2a4c6d9f3e8a1/messages/read
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "message": "All diary entries marked as read"
}

// ============================================
// 3. SOCKET.IO EVENTS - CLIENT-SIDE EXAMPLES
// ============================================

/**
 * CLIENT → SERVER: join_chat
 * Join a chat room
 */
socket.emit("join_chat", { chatId: "64f7c2e1b8e2a4c6d9f3e8a1" });

socket.on("joined_chat", ({ chatId }) => {
  console.log("✅ Joined chat:", chatId);
});

socket.on("error", ({ message }) => {
  console.error("Error joining chat:", message);
});

// ============================================

/**
 * CLIENT → SERVER: send_message
 * Send a message in real-time
 */
socket.emit("send_message", {
  chatId: "64f7c2e1b8e2a4c6d9f3e8a1",
  content: "This is a diary entry written in real-time",
});

// SERVER → CLIENT: receive_message
socket.on("receive_message", (message) => {
  console.log("📨 New message received:", message);
  // message = {
  //   _id: "...",
  //   chatId: "...",
  //   senderId: { _id, name, profilePhoto, supernaturalType },
  //   content: "...",
  //   isRead: false,
  //   isPinned: false,
  //   createdAt: "2024-01-15T10:35:00Z"
  // }
  addMessageToUI(message);
});

// ============================================

/**
 * CLIENT → SERVER: typing_start
 * Broadcast typing indicator
 */
socket.emit("typing_start", { chatId: "64f7c2e1b8e2a4c6d9f3e8a1" });

// SERVER → CLIENT: user_typing
socket.on("user_typing", ({ userId, name }) => {
  console.log(`💭 ${name} is writing in diary...`);
  showTypingIndicator(name);
});

// ============================================

/**
 * CLIENT → SERVER: typing_stop
 * Stop typing indicator
 */
socket.emit("typing_stop", { chatId: "64f7c2e1b8e2a4c6d9f3e8a1" });

// SERVER → CLIENT: user_stopped_typing
socket.on("user_stopped_typing", ({ userId }) => {
  console.log("✏️  Typing stopped");
  hideTypingIndicator(userId);
});

// ============================================

/**
 * CLIENT → SERVER: messages_seen
 * Mark messages as read (Compelled to read)
 */
socket.emit("messages_seen", { chatId: "64f7c2e1b8e2a4c6d9f3e8a1" });

// SERVER → CLIENT: messages_read
socket.on("messages_read", ({ chatId, readBy, readAt }) => {
  console.log("✅ Other user read messages");
  updateReadReceipts(readBy, readAt);
});

// ============================================

/**
 * CLIENT → SERVER: pin_message
 * Toggle pin on a message (Compulsion)
 */
socket.emit("pin_message", {
  chatId: "64f7c2e1b8e2a4c6d9f3e8a1",
  messageId: "64f7c2e1b8e2a4c6d9f3e8b1",
});

// SERVER → CLIENT: message_pinned
socket.on("message_pinned", ({ messageId, isPinned, pinnedBy, pinnedByName }) => {
  console.log(`📌 ${pinnedByName} ${isPinned ? "compelled" : "released"} a message`);
  updateMessagePin(messageId, isPinned);
});

// ============================================

/**
 * CLIENT → SERVER: leave_chat
 * Leave a chat room
 */
socket.emit("leave_chat", { chatId: "64f7c2e1b8e2a4c6d9f3e8a1" });

// ============================================

/**
 * SERVER → CLIENT: user_online
 * User came online
 */
socket.on("user_online", ({ userId, name }) => {
  console.log(`🟢 ${name} is online`);
  updateOnlineStatus(userId, true);
});

// ============================================

/**
 * SERVER → CLIENT: user_offline
 * User went offline
 */
socket.on("user_offline", ({ userId, name }) => {
  console.log(`🔴 ${name} is offline`);
  updateOnlineStatus(userId, false);
});

// ============================================

/**
 * SERVER → CLIENT: new_message_notification
 * Notification of new message (when outside chat)
 */
socket.on("new_message_notification", ({ chatId, from, preview }) => {
  console.log(`📬 New message from ${from.name}: "${preview}..."`);
  showNotification(`New message from ${from.name}`);
});

// ============================================
// 4. COMPLETE REACT COMPONENT EXAMPLE
// ============================================

/**
 * React Hook: useChat
 * Complete chat component integration
 */
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

function ChatWindow({ chatId, token }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(null);
  const [content, setContent] = useState("");
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect socket
    socketRef.current = io(process.env.REACT_APP_SERVER_URL, {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("Connected");
      socketRef.current.emit("join_chat", { chatId });
    });

    socketRef.current.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on("user_typing", ({ name }) => {
      setTyping(name);
    });

    socketRef.current.on("user_stopped_typing", () => {
      setTyping(null);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, token]);

  const handleTyping = () => {
    socketRef.current.emit("typing_start", { chatId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing_stop", { chatId });
    }, 1000);
  };

  const sendMessage = () => {
    if (!content.trim()) return;

    socketRef.current.emit("send_message", { chatId, content });
    setContent("");
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg._id} className="message">
            <strong>{msg.senderId.name}:</strong> {msg.content}
            {msg.isPinned && <span className="pinned">📌 Compelled</span>}
          </div>
        ))}
        {typing && <div className="typing">💭 {typing} is writing in diary...</div>}
      </div>

      <div className="input-area">
        <input
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Write in your diary..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;

// ============================================
// 5. SOCKET.IO EVENT REFERENCE
// ============================================

/**
 * Socket.io Events Reference
 *
 * CLIENT → SERVER:
 * - join_chat { chatId }
 * - leave_chat { chatId }
 * - send_message { chatId, content }
 * - typing_start { chatId }
 * - typing_stop { chatId }
 * - messages_seen { chatId }
 * - pin_message { chatId, messageId }
 *
 * SERVER → CLIENT:
 * - joined_chat { chatId }
 * - receive_message { message object }
 * - new_message_notification { chatId, from, preview }
 * - user_typing { userId, name }
 * - user_stopped_typing { userId }
 * - messages_read { chatId, readBy, readAt }
 * - message_pinned { messageId, isPinned, pinnedBy, pinnedByName }
 * - user_online { userId, name }
 * - user_offline { userId, name }
 * - error { message }
 */

// ============================================
// 6. TESTING CHECKLIST
// ============================================

/**
 * REST API Tests (Postman or curl)
 * ✅ GET /api/chat/:chatId/messages - Returns messages
 * ✅ GET /api/chat/:chatId/messages (403) - Unauthorized user rejected
 * ✅ POST /api/chat/:chatId/messages - Creates message
 * ✅ POST /api/chat/:chatId/messages (400) - Empty content rejected
 * ✅ GET /api/chat/:chatId/messages/pinned - Returns pinned messages
 * ✅ PATCH /api/chat/:chatId/messages/:msgId/pin - Toggles pin
 * ✅ PATCH /api/chat/:chatId/messages/read - Marks all read
 * ✅ GET /api/chat/unread-count - Returns correct count
 *
 * Socket.io Tests (Postman WebSocket or socket-io-client)
 * ✅ Connect with valid token - Succeeds
 * ✅ Connect without token - Fails with auth error
 * ✅ join_chat - Receives joined_chat confirmation
 * ✅ send_message - Both participants receive receive_message
 * ✅ send_message - Sender receives in room, non-participant gets notification
 * ✅ typing_start - Other user receives user_typing
 * ✅ typing_stop - Other user receives user_stopped_typing
 * ✅ messages_seen - Other user receives messages_read
 * ✅ pin_message - Both participants receive message_pinned
 * ✅ Disconnect - All users notified user_offline
 * ✅ user_online - Emitted on connect
 * ✅ user_offline - Emitted on disconnect
 */

// ============================================
// 7. PERFORMANCE TIPS
// ============================================

/**
 * Real-Time Chat Performance Optimization
 *
 * 1. Pagination:
 *    - Load messages in pages (default 50)
 *    - Implement infinite scroll
 *    - Don't load entire history on chat open
 *
 * 2. Typing Indicators:
 *    - Debounce typing events (emit every 1 second)
 *    - Stop on keyup after 1 second of inactivity
 *    - Don't emit for every keystroke
 *
 * 3. Read Receipts:
 *    - Only update unread messages
 *    - Batch updates when possible
 *    - Avoid marking individual messages
 *
 * 4. Message Queries:
 *    - Use indexes: { chatId, createdAt }
 *    - Use lean() for read-only queries
 *    - Limit populate fields
 *
 * 5. Socket Connections:
 *    - Implement reconnection logic
 *    - Handle connection errors gracefully
 *    - Clean up listeners on unmount
 *
 * 6. Memory Management:
 *    - Limit in-memory message cache
 *    - Paginate old messages out
 *    - Remove inactive user rooms after timeout
 */

// ============================================
// 8. AUTHENTICATION ERROR HANDLING
// ============================================

/**
 * Socket Authentication Errors
 */

// No token provided
// Error: "Authentication error: No token"

// Invalid token format
// Error: "Authentication error: Invalid token"

// Expired token
// Error: "Authentication error: Invalid token"

// User not found
// Error: "Authentication error: User not found"

// Handling in React:
socket.on("connect_error", (error) => {
  if (error.message.includes("Authentication error")) {
    // Redirect to login
    window.location.href = "/login";
  }
});
