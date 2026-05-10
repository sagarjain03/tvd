# Frontend Phase 5 — Chat UI (Diary Entries & Real-Time)

## Overview

This phase builds the full real-time chat experience themed as "Diary Entries".
Messages are styled as handwritten diary pages. Typing shows as "writing in diary…".
Pinned messages are called "Compulsion" and highlighted in blood red.
Socket.io handles all real-time events. REST handles message history on load.

> ⚠️ Phases 1–4 must be complete. This phase connects to Backend Phase 5.
> A chatId must exist (created on mutual match in Phase 4).

---

## Folder Structure Added in This Phase

```
client/src/
├── components/
│   └── chat/
│       ├── ChatList.jsx            ← List of all active chats
│       ├── ChatWindow.jsx          ← Main chat view (orchestrator)
│       ├── MessageBubble.jsx       ← Individual diary entry
│       ├── MessageInput.jsx        ← Text input + send
│       ├── TypingIndicator.jsx     ← "writing in diary…"
│       ├── PinnedMessage.jsx       ← Compulsion display
│       └── ChatHeader.jsx          ← Top bar with partner info
├── pages/
│   └── Chat.jsx                    ← Chat page (loads ChatWindow)
├── store/
│   └── chatStore.js
├── services/
│   ├── chatService.js
│   └── socket.js                   ← Socket.io singleton
```

---

## `src/services/socket.js` — Socket.io Singleton

```javascript
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};
```

---

## `src/store/chatStore.js`

```javascript
import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  // Messages per chat: { [chatId]: Message[] }
  messages: {},

  // Typing state: { [chatId]: { userId, name } | null }
  typing: {},

  // Unread counts: { [chatId]: number }
  unreadCounts: {},

  // Active chat ID
  activeChatId: null,

  setActiveChatId: (chatId) => set({ activeChatId: chatId }),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  setTyping: (chatId, typingUser) =>
    set((state) => ({
      typing: { ...state.typing, [chatId]: typingUser },
    })),

  clearTyping: (chatId) =>
    set((state) => ({
      typing: { ...state.typing, [chatId]: null },
    })),

  setUnreadCount: (chatId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [chatId]: count },
    })),

  incrementUnread: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    })),

  clearUnread: (chatId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [chatId]: 0 },
    })),
}));
```

---

## `src/services/chatService.js`

```javascript
import api from "./api";

export const fetchMessages = async (chatId, page = 1) => {
  const { data } = await api.get(`/chat/${chatId}/messages?page=${page}&limit=50`);
  return data;
};

export const sendMessageRest = async (chatId, content) => {
  const { data } = await api.post(`/chat/${chatId}/messages`, { content });
  return data.message;
};

export const fetchPinnedMessages = async (chatId) => {
  const { data } = await api.get(`/chat/${chatId}/messages/pinned`);
  return data.pinnedMessages;
};

export const markAllRead = async (chatId) => {
  await api.patch(`/chat/${chatId}/messages/read`);
};
```

---

## `src/pages/Chat.jsx`

```jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import ChatWindow from "../components/chat/ChatWindow";

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();

  if (!chatId) {
    navigate("/matches");
    return null;
  }

  return (
    // No AppLayout wrapper — chat is full height
    <div className="h-screen bg-bg-primary flex flex-col">
      <ChatWindow chatId={chatId} />
    </div>
  );
};

export default Chat;
```

---

## `src/components/chat/ChatWindow.jsx` — Main Orchestrator

```jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { fetchMessages, markAllRead } from "../../services/chatService";
import { connectSocket } from "../../services/socket";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import PinnedMessage from "./PinnedMessage";
import Spinner from "../ui/Spinner";

const ChatWindow = ({ chatId }) => {
  const { user } = useAuthStore();
  const {
    messages,
    typing,
    setMessages,
    addMessage,
    updateMessage,
    setTyping,
    clearTyping,
    clearUnread,
    setActiveChatId,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatMessages = messages[chatId] || [];
  const isTyping = typing[chatId];

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  // Load message history
  useEffect(() => {
    setActiveChatId(chatId);
    setIsLoading(true);

    fetchMessages(chatId)
      .then((data) => {
        setMessages(chatId, data.messages);
        clearUnread(chatId);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => scrollToBottom(false), 100);
      });

    markAllRead(chatId).catch(console.error);
  }, [chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.length, isTyping]);

  // Socket setup
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.emit("join_chat", { chatId });

    socket.on("receive_message", (message) => {
      if (message.chatId === chatId) {
        addMessage(chatId, message);
        // Mark as read since we're in this chat
        socket.emit("messages_seen", { chatId });
        clearUnread(chatId);
      }
    });

    socket.on("user_typing", ({ userId, name }) => {
      if (userId !== user._id) {
        setTyping(chatId, { userId, name });
      }
    });

    socket.on("user_stopped_typing", ({ userId }) => {
      if (userId !== user._id) {
        clearTyping(chatId);
      }
    });

    socket.on("messages_read", ({ chatId: cid }) => {
      if (cid === chatId) {
        // Update messages as read in store
        setMessages(
          chatId,
          (messages[chatId] || []).map((m) =>
            m.senderId._id === user._id ? { ...m, isRead: true } : m
          )
        );
      }
    });

    socket.on("message_pinned", ({ messageId, isPinned }) => {
      updateMessage(chatId, messageId, { isPinned });
    });

    return () => {
      socket.emit("leave_chat", { chatId });
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("messages_read");
      socket.off("message_pinned");
      setActiveChatId(null);
    };
  }, [chatId]);

  const handleSend = (content) => {
    const socket = socketRef.current;
    if (!socket || !content.trim()) return;

    socket.emit("send_message", { chatId, content });
    socket.emit("typing_stop", { chatId });
  };

  const handleTypingStart = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("typing_start", { chatId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { chatId });
    }, 2000);
  };

  const handlePinMessage = (messageId) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("pin_message", { chatId, messageId });
  };

  // Separate pinned messages
  const pinnedInChat = chatMessages.filter((m) => m.isPinned);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chatId={chatId} />

      {/* Pinned messages */}
      {pinnedInChat.length > 0 && (
        <div className="border-b border-border-subtle bg-bg-elevated px-4 py-2">
          <PinnedMessage message={pinnedInChat[pinnedInChat.length - 1]} />
        </div>
      )}

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-text-muted italic">
              The diary is empty. Write the first entry.
            </p>
          </div>
        ) : (
          chatMessages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.senderId._id === user._id || message.senderId === user._id}
              onPin={() => handlePinMessage(message._id)}
            />
          ))
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator name={isTyping.name} />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} onTyping={handleTypingStart} />
    </div>
  );
};

export default ChatWindow;
```

---

## `src/components/chat/ChatHeader.jsx`

```jsx
import { useNavigate } from "react-router-dom";

const ChatHeader = ({ chatId }) => {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border-subtle bg-bg-secondary px-6 py-4 flex items-center justify-between">
      <button
        onClick={() => navigate("/matches")}
        className="font-mono text-xs text-text-muted hover:text-accent tracking-widest uppercase transition-colors"
      >
        ← Back
      </button>

      <div className="text-center">
        <p className="font-display text-sm text-text-primary tracking-wide">
          Diary Exchange
        </p>
        <p className="font-mono text-xs text-text-muted tracking-widest">
          ◆ MYSTIC FALLS ◆
        </p>
      </div>

      <div className="w-12" />
    </div>
  );
};

export default ChatHeader;
```

---

## `src/components/chat/MessageBubble.jsx`

```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { ARCHETYPES } from "../../utils/archetypeConfig";

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageBubble = ({ message, isOwn, onPin }) => {
  const [showActions, setShowActions] = useState(false);
  const senderArchetype =
    ARCHETYPES[message.senderId?.supernaturalType] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (other user) */}
      {!isOwn && (
        <div className="w-8 h-8 bg-bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <span className="text-sm">{senderArchetype?.icon || "◆"}</span>
        </div>
      )}

      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Sender name (other user only) */}
        {!isOwn && (
          <p className="font-mono text-xs text-text-muted px-1">
            {message.senderId?.name}
          </p>
        )}

        {/* Message bubble */}
        <div className="relative flex items-end gap-2">
          {/* Pin action (show on hover) */}
          {showActions && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onPin}
              className={`font-mono text-xs text-text-muted hover:text-accent transition-colors ${
                isOwn ? "order-first" : "order-last"
              }`}
              title={message.isPinned ? "Release Compulsion" : "Compel"}
            >
              {message.isPinned ? "✦" : "◇"}
            </motion.button>
          )}

          <div
            className={`px-5 py-3 font-body text-base leading-relaxed italic relative ${
              message.isPinned
                ? "border border-accent/60 bg-accent/10"
                : isOwn
                ? "bg-bg-elevated border border-border-default"
                : "bg-bg-surface border border-border-subtle"
            }`}
          >
            {/* Compulsion label */}
            {message.isPinned && (
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">
                Compulsion
              </p>
            )}

            <p
              className={
                message.isPinned
                  ? "text-text-primary"
                  : isOwn
                  ? "text-text-primary"
                  : "text-text-secondary"
              }
            >
              {message.content}
            </p>
          </div>
        </div>

        {/* Timestamp + read receipt */}
        <div
          className={`flex items-center gap-2 px-1 ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="font-mono text-xs text-text-muted">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="font-mono text-xs text-text-muted">
              {message.isRead ? "Compelled to read" : "Sent"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
```

---

## `src/components/chat/TypingIndicator.jsx`

```jsx
import { motion } from "framer-motion";

const TypingIndicator = ({ name }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-1"
    >
      {/* Animated dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-text-muted rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-text-muted italic">
        {name} is writing in their diary…
      </span>
    </motion.div>
  );
};

export default TypingIndicator;
```

---

## `src/components/chat/MessageInput.jsx`

```jsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";

const MessageInput = ({ onSend, onTyping }) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);
    onTyping();

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border-subtle bg-bg-secondary px-4 py-4">
      {/* Label */}
      <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-3">
        Write a diary entry…
      </p>

      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Dear diary…"
          rows={1}
          className="flex-1 bg-bg-surface border border-border-subtle text-text-primary placeholder-text-muted px-4 py-3 font-body text-base italic outline-none focus:border-accent/50 transition-all duration-200 resize-none leading-relaxed"
          style={{ minHeight: "48px", maxHeight: "120px" }}
        />

        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-display text-xs tracking-widest uppercase transition-all duration-300 border border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          Seal
        </motion.button>
      </div>

      <p className="font-mono text-xs text-text-muted mt-2 opacity-50">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
```

---

## `src/components/chat/PinnedMessage.jsx`

```jsx
const PinnedMessage = ({ message }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-accent font-mono text-xs">◆ COMPULSION</span>
      <p className="font-body text-sm text-text-secondary italic truncate flex-1">
        "{message.content}"
      </p>
      <span className="font-mono text-xs text-text-muted flex-shrink-0">
        — {message.senderId?.name}
      </span>
    </div>
  );
};

export default PinnedMessage;
```

---

## Update Navbar — Add Unread Badge

In `Navbar.jsx`, update the Matches link to show unread count:

```jsx
import { useChatStore } from "../../store/chatStore";

// Inside Navbar component:
const { unreadCounts } = useChatStore();
const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

// In the nav link for matches:
<NavLink to="/matches" ...>
  <span>❤</span>
  <span className="hidden md:inline">Matches</span>
  {totalUnread > 0 && (
    <span className="w-4 h-4 bg-accent text-white font-mono text-xs rounded-full flex items-center justify-center">
      {totalUnread > 9 ? "9+" : totalUnread}
    </span>
  )}
</NavLink>
```

---

## Connect Socket on Auth

In `App.jsx`, connect socket when user is logged in:

```jsx
import { connectSocket, disconnectSocket } from "./services/socket";

// In App component:
useEffect(() => {
  if (user && accessToken) {
    connectSocket();
  } else {
    disconnectSocket();
  }
}, [user, accessToken]);
```

---

## Add Route to `App.jsx`

```jsx
import Chat from "./pages/Chat";

// Inside <Routes>:
<Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
```

---

## Testing Checklist

- [ ] `/chat/:chatId` loads and displays message history
- [ ] Messages display in chronological order (oldest top)
- [ ] Own messages right-aligned, other's left-aligned
- [ ] Sending a message via Enter submits and clears input
- [ ] Message appears instantly for sender (via socket)
- [ ] Message appears for receiver without page refresh
- [ ] Typing in input triggers "writing in diary…" on receiver's screen
- [ ] Typing indicator disappears after 2s of no typing
- [ ] Hovering a message shows pin/unpin action (◇/✦)
- [ ] Pinning a message shows "Compulsion" label in blood red
- [ ] Pinned message appears in the header strip
- [ ] "Compelled to read" shows on sender's message after receiver views
- [ ] Unread badge on Navbar updates correctly
- [ ] "Seal" button disabled when input is empty
- [ ] Shift+Enter creates a new line (doesn't send)
- [ ] Textarea auto-resizes up to 120px
- [ ] Back button navigates to `/matches`

---

## ✅ Phase 5 Complete When

- Real-time message delivery works between two browser windows
- Typing indicators appear and disappear correctly
- Pinned messages ("Compulsion") display in header and are highlighted
- Read receipts update after messages are seen
- Message history loads on page entry
- Unread counts update in Navbar
- Socket connects on login and disconnects on logout
- Chat UI is fully themed (diary entries, gothic styling, no generic chat look)