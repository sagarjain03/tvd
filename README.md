# 🧛 MysticMatch

> *A supernatural-themed, story-driven dating platform inspired by The Vampire Diaries.*

MysticMatch is a full-stack **MERN application** that reimagines online dating through immersive storytelling, personality-based matchmaking, and real-time interaction — all wrapped in a dark, gothic aesthetic.

---

## 📑 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Core Features](#core-features)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Compatibility Algorithm](#compatibility-algorithm)
- [Groq AI Integration](#groq-ai-integration)
- [Real-Time System (Socket.io)](#real-time-system-socketio)
- [UI/UX Design System](#uiux-design-system)
- [Installation & Setup](#installation--setup)
- [Development Roadmap](#development-roadmap)
- [Future Enhancements](#future-enhancements)

---

## Project Overview

MysticMatch is NOT a traditional dating app. It combines:

- **Narrative-driven onboarding** — users go through a branching storyline before they even set up a profile
- **Supernatural archetype classification** — every user is classified as a Vampire, Werewolf, Witch, or Hybrid based on their quiz + story decisions
- **Intelligent compatibility scoring** — matches are calculated using personality similarity, complementary traits, and story decision alignment
- **Immersive themed UI** — messages are "Diary Entries", typing indicators say "writing in diary…", and the entire app feels like Mystic Falls

The goal is to deliver both **emotional engagement** and **serious technical depth** — making it a strong portfolio-level full-stack project.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js (Vite) | UI framework |
| Tailwind CSS | Styling |
| Framer Motion | Animations & transitions |
| React Router v6 | Client-side routing |
| Zustand | Global state management |
| Socket.io-client | Real-time chat |
| Axios | HTTP requests |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| Socket.io | WebSocket server |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Multer + Cloudinary | Image uploads |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | Primary database |
| Mongoose | ODM (Object Document Mapper) |

### External APIs
| Service | Purpose |
|---|---|
| Groq API (LLaMA 3) | AI personality insights & character analysis |
| Cloudinary | Profile image & media storage |
| Google OAuth 2.0 | Social login |

---

## Project Structure

```
mysticmatch/
├── client/                          # React frontend
│   ├── public/
│   │   └── assets/                  # Static images, fonts, icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # Login, Register, OAuth
│   │   │   ├── quiz/                # Personality quiz engine
│   │   │   ├── story/               # Interactive story mode
│   │   │   ├── profile/             # User profiles, dual persona
│   │   │   ├── matching/            # Match cards, compatibility display
│   │   │   ├── chat/                # Real-time chat (diary entries)
│   │   │   ├── battle/              # Compatibility Battle Mode
│   │   │   ├── gamification/        # Badges, streaks, achievements
│   │   │   └── ui/                  # Shared UI components
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Onboarding.jsx       # Story + Quiz flow
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Matches.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── BattleMode.jsx
│   │   ├── store/                   # Zustand state stores
│   │   │   ├── authStore.js
│   │   │   ├── matchStore.js
│   │   │   └── chatStore.js
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Helper functions
│   │   ├── services/                # Axios API calls
│   │   └── App.jsx
│   └── package.json
│
├── server/                          # Express backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── cloudinary.js            # Cloudinary setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── quizController.js
│   │   ├── storyController.js
│   │   ├── matchController.js
│   │   ├── chatController.js
│   │   ├── aiController.js          # Groq API calls
│   │   └── gamificationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── uploadMiddleware.js      # Multer config
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Match.js
│   │   ├── Message.js
│   │   ├── StoryDecision.js
│   │   └── Achievement.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── storyRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── aiRoutes.js
│   │   └── gamificationRoutes.js
│   ├── socket/
│   │   └── socketHandler.js         # Socket.io event handlers
│   ├── utils/
│   │   ├── compatibilityEngine.js   # Core matching algorithm
│   │   ├── archetypeClassifier.js   # Supernatural type logic
│   │   └── groqClient.js            # Groq API wrapper
│   └── server.js                    # Entry point
│
├── .env                             # Environment variables (never commit)
├── .env.example                     # Template for env variables
├── .gitignore
└── README.md
```

---

## Environment Variables

Create a `.env` file in the `/server` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mysticmatch

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Groq API (replaces OpenAI)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `/client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Core Features

---

### 1. Authentication System

- JWT-based auth (access token stored in memory, refresh token in httpOnly cookie)
- Google OAuth 2.0 via Passport.js
- Password hashing with bcryptjs (salt rounds: 12)
- Protected routes on both frontend (React Router) and backend (middleware)
- Auto-logout on token expiry

---

### 2. Supernatural Identity Classification

Every user is assigned one of four archetypes based on their quiz score and story decisions:

| Archetype | Traits | Colour Identity |
|---|---|---|
| 🧛 Vampire | Intense, loyal, emotionally deep, possessive | Crimson / Deep Red |
| 🐺 Werewolf | Impulsive, fiercely protective, raw, honest | Amber / Burnt Orange |
| 🔮 Witch | Intelligent, strategic, perceptive, boundary-setter | Violet / Midnight Purple |
| ⚡ Hybrid | Unpredictable, dominant, complex, high-intensity | Dark Gold / Shadow Black |

**Classification Logic (in `archetypeClassifier.js`):**
```
1. Run user through 15-question Personality Quiz
2. Map answers to 6 trait axes:
   - Loyalty (0–10)
   - Aggression (0–10)
   - Empathy (0–10)
   - Strategy (0–10)
   - Dominance (0–10)
   - Emotional Depth (0–10)
3. User makes 5 key decisions in Story Mode
4. Each decision adds weight to trait axes
5. Final weighted score → maps to archetype
```

---

### 3. Personality Quiz Engine

- 15 multiple-choice questions
- Each question maps to 1–2 trait axes with weighted values
- Timed (optional 30s per question for engagement)
- Progress saved to DB so user can resume
- Results stored in `User.personalityTraits` object

**Sample Question Structure:**
```json
{
  "id": "q_007",
  "question": "Someone you trust betrays you. What do you do?",
  "options": [
    { "text": "Cut them off without a word", "traits": { "loyalty": -2, "dominance": +2 } },
    { "text": "Confront them and demand answers", "traits": { "aggression": +2, "empathy": +1 } },
    { "text": "Study their motives before acting", "traits": { "strategy": +3 } },
    { "text": "Forgive them — everyone makes mistakes", "traits": { "empathy": +3, "loyalty": +1 } }
  ]
}
```

---

### 4. Story Mode (Interactive Narrative System)

Users navigate a branching story set in **Mystic Falls**. The story has 3 chapters, each with 5 decision points.

- Decisions are stored as event logs in `StoryDecision` collection
- Each decision nudges personality trait scores
- Multiple story endings based on decision patterns
- Story progress is part of the compatibility calculation

**Story Structure:**
```
Chapter 1: Arrival in Mystic Falls
  └── Decision 1: Do you reveal your true identity at the Founders' Party?
  └── Decision 2: A stranger asks for your help at midnight. Do you go?

Chapter 2: The Conflict
  └── Decision 3: You discover your match has a dark secret...
  └── Decision 4: Choose between loyalty to your coven or your heart

Chapter 3: The Choice
  └── Decision 5: The final sacrifice — what do you protect?
```

---

### 5. Compatibility Matching Engine

Located in `server/utils/compatibilityEngine.js`

**Formula:**
```
Compatibility Score =
  (0.6 × Personality Similarity Score) +
  (0.3 × Complementary Traits Score) +
  (0.1 × Activity Score)
```

**Personality Similarity Score:**
- Cosine similarity between two users' trait vectors
- Same archetype gets a baseline boost

**Complementary Traits Score:**
- Certain archetype pairings are weighted higher (e.g., Vampire + Witch = high intellectual tension)
- Defined in a compatibility matrix

**Activity Score:**
- Based on login frequency, quiz completion, story progress, chat responsiveness

**Output:**
- Match percentage (0–100%)
- "Why you match" explanation string (generated by Groq AI)
- Archetype compatibility label (e.g., "Fated Rivals", "Ancient Bond", "Kindred Spirits")

---

### 6. Real-Time Chat System

Built with **Socket.io**.

**Themed UI:**
| Standard App | MysticMatch Version |
|---|---|
| Messages | Diary Entries |
| "Typing…" | "writing in diary…" |
| Pinned message | "Compulsion" (highlighted in blood red) |
| Seen receipt | "Compelled to read" |

**Socket Events:**
```
Client → Server:
  - join_room
  - send_message
  - typing_start
  - typing_stop

Server → Client:
  - receive_message
  - user_typing
  - user_stopped_typing
  - message_seen
```

**Message stored in DB with:**
- senderId, receiverId
- content, timestamp
- isRead (boolean)
- isPinned / isCompulsion (boolean)

---

### 7. Groq AI Personality Insights

Uses **Groq API with LLaMA 3 (70B)** — fast inference, free tier available, great for portfolio use.

Located in `server/utils/groqClient.js`

**What Groq generates:**
1. **Personality Summary** — 3-4 sentences describing the user's supernatural character
2. **Strengths & Weaknesses** — bullet points in-theme
3. **Ideal Partner Type** — which archetype(s) they'd match with and why
4. **Match Explanation** — when two users match, explains their chemistry

**Groq API Call Structure:**
```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generatePersonalityInsight = async (userTraits, archetype) => {
  const response = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
      {
        role: "system",
        content: `You are a mystical oracle in the world of The Vampire Diaries. 
        Speak poetically but concisely. Analyze supernatural personality profiles.`
      },
      {
        role: "user",
        content: `Analyze this ${archetype} with these traits: ${JSON.stringify(userTraits)}. 
        Return a JSON object with: summary, strengths (array), weaknesses (array), idealPartner (string).`
      }
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
};
```

---

### 8. Dual Persona Profiles

Every user has two profile layers:

| Layer | Visibility | Contains |
|---|---|---|
| **Public Profile** | Always visible | Name, archetype, public traits, profile photo |
| **Dark Side Profile** | Unlocked after mutual match | Hidden trait, dark secret, true supernatural origin story |

- Dark side is stored encrypted in DB
- Revealed with an animated "veil lift" effect on frontend
- User writes their own dark side during onboarding

---

### 9. Gamification System

**Streak Tracking:**
- Daily login + interaction streak
- Broken streak resets progress
- Streak stored in `User.streak` object

**Badges / Achievements:**

| Badge | Trigger |
|---|---|
| 🧛 Original Vampire | Complete all 3 story chapters |
| 🩸 Ripper Mode | Send 50+ diary entries in one day |
| 🔮 Loyal Witch | Maintain a 7-day streak |
| ⚡ Hybrid Awakening | Match with all 4 archetypes |
| 📖 Keeper of Secrets | Unlock 5 dark side profiles |

- Badges stored in `Achievement` collection
- Displayed on profile with unlock date
- Push notification (optional) on achievement unlock

---

### 10. Compatibility Battle Mode

Two matched users answer the same scenario question simultaneously.

**Flow:**
1. Either user initiates a "Battle"
2. Both users see the same scenario (e.g., "Your coven is threatened. What's your first move?")
3. Both answer independently (no peeking)
4. Answers submitted → Groq AI compares them → generates a **Chemistry Score**
5. Result displayed: agreement %, conflict areas, chemistry label

---

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: String,                    // bcrypt hashed
  googleId: String,                    // OAuth
  profilePhoto: String,                // Cloudinary URL
  supernaturalType: {
    type: String,
    enum: ['Vampire', 'Werewolf', 'Witch', 'Hybrid']
  },
  personalityTraits: {
    loyalty: Number,                   // 0–10
    aggression: Number,
    empathy: Number,
    strategy: Number,
    dominance: Number,
    emotionalDepth: Number
  },
  darkSideProfile: {
    secret: String,
    originStory: String,
    isUnlocked: Boolean
  },
  matches: [{ type: ObjectId, ref: 'Match' }],
  storyDecisions: [{ type: ObjectId, ref: 'StoryDecision' }],
  achievements: [{ type: ObjectId, ref: 'Achievement' }],
  streak: {
    current: Number,
    longest: Number,
    lastActiveDate: Date
  },
  activityScore: Number,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]              // [lng, lat]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Match Schema
```javascript
{
  user1: { type: ObjectId, ref: 'User' },
  user2: { type: ObjectId, ref: 'User' },
  compatibilityScore: Number,           // 0–100
  compatibilityLabel: String,           // e.g. "Ancient Bond"
  matchExplanation: String,             // AI-generated
  chatId: { type: ObjectId, ref: 'Chat' },
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected']
  },
  darkSideUnlocked: Boolean,
  createdAt: Date
}
```

### Message Schema
```javascript
{
  chatId: { type: ObjectId, ref: 'Chat' },
  senderId: { type: ObjectId, ref: 'User' },
  content: String,
  isRead: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },   // "Compulsion"
  timestamp: { type: Date, default: Date.now }
}
```

### StoryDecision Schema
```javascript
{
  userId: { type: ObjectId, ref: 'User' },
  chapter: Number,
  decisionId: String,
  choiceIndex: Number,
  traitImpact: Object,                  // e.g. { loyalty: +2, strategy: -1 }
  timestamp: Date
}
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/refresh-token
```

### Quiz
```
GET    /api/quiz/questions
POST   /api/quiz/submit
GET    /api/quiz/result/:userId
```

### Story
```
GET    /api/story/chapter/:chapterId
POST   /api/story/decision
GET    /api/story/progress/:userId
```

### Matching
```
GET    /api/matches                    # Get all matches for current user
GET    /api/matches/suggestions        # Get new match suggestions
POST   /api/matches/like/:userId
POST   /api/matches/reject/:userId
GET    /api/matches/:matchId           # Get match details + compatibility
```

### Chat
```
GET    /api/chat/:matchId/messages
POST   /api/chat/:matchId/messages
PATCH  /api/chat/:matchId/messages/:msgId/pin
PATCH  /api/chat/:matchId/messages/read
```

### AI (Groq)
```
GET    /api/ai/insights/:userId        # Personal personality insight
POST   /api/ai/match-explanation       # Why two users match
POST   /api/ai/battle-result           # Battle mode chemistry score
```

### Gamification
```
GET    /api/gamification/achievements/:userId
GET    /api/gamification/streak/:userId
POST   /api/gamification/streak/update
```

---

## Compatibility Algorithm

Full implementation in `server/utils/compatibilityEngine.js`:

```javascript
const ARCHETYPE_MATRIX = {
  Vampire: { Vampire: 0.7, Werewolf: 0.5, Witch: 0.9, Hybrid: 0.6 },
  Werewolf: { Vampire: 0.5, Werewolf: 0.6, Witch: 0.7, Hybrid: 0.8 },
  Witch: { Vampire: 0.9, Werewolf: 0.7, Witch: 0.5, Hybrid: 0.6 },
  Hybrid: { Vampire: 0.6, Werewolf: 0.8, Witch: 0.6, Hybrid: 0.4 },
};

const calculateCompatibility = (user1, user2) => {
  // Step 1: Trait vector similarity (cosine similarity)
  const traitSimilarity = cosineSimilarity(
    Object.values(user1.personalityTraits),
    Object.values(user2.personalityTraits)
  );

  // Step 2: Archetype compatibility from matrix
  const archetypeScore =
    ARCHETYPE_MATRIX[user1.supernaturalType][user2.supernaturalType];

  // Step 3: Complementary score (how well they balance each other)
  const complementaryScore = calculateComplementary(user1.personalityTraits, user2.personalityTraits);

  // Step 4: Activity score (average of both users)
  const activityScore = (user1.activityScore + user2.activityScore) / 200;

  // Final weighted score
  const finalScore =
    (0.4 * traitSimilarity) +
    (0.2 * archetypeScore) +
    (0.3 * complementaryScore) +
    (0.1 * activityScore);

  return Math.round(finalScore * 100); // Returns 0–100
};
```

---

## Real-Time System (Socket.io)

Server setup in `server/socket/socketHandler.js`:

```javascript
const socketHandler = (io) => {
  io.on("connection", (socket) => {
    // User joins their personal room on connect
    socket.on("join_room", ({ userId }) => {
      socket.join(userId);
    });

    // User joins a chat room
    socket.on("join_chat", ({ chatId }) => {
      socket.join(chatId);
    });

    // Send a diary entry (message)
    socket.on("send_message", async ({ chatId, senderId, content }) => {
      const message = await Message.create({ chatId, senderId, content });
      io.to(chatId).emit("receive_message", message);
    });

    // Typing indicator
    socket.on("typing_start", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_typing", { userId });
    });

    socket.on("typing_stop", ({ chatId, userId }) => {
      socket.to(chatId).emit("user_stopped_typing", { userId });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
```

---

## UI/UX Design System

### Color Palette
```css
--color-bg-primary: #0a0005;         /* Near-black with purple undertone */
--color-bg-secondary: #12000a;       /* Deep dark red-black */
--color-surface: #1a0010;            /* Card backgrounds */
--color-border: #3d0020;             /* Subtle borders */

--color-vampire: #8b0000;            /* Deep crimson */
--color-werewolf: #c45e00;           /* Burnt amber */
--color-witch: #5c0a8a;              /* Deep violet */
--color-hybrid: #8a7000;             /* Dark gold */

--color-text-primary: #f0dce8;       /* Pale lavender-white */
--color-text-secondary: #a07090;     /* Muted rose */
--color-accent: #c20045;             /* Blood red accent */
```

### Typography
- **Display Font:** `Cinzel Decorative` (Google Fonts) — gothic, regal
- **Body Font:** `EB Garamond` — elegant, classic, readable
- **Monospace (for timestamps):** `Courier Prime`

### Animations (Framer Motion)
- Page transitions: fade + slight upward drift
- Card reveals: staggered entrance with scale
- Match reveal: dramatic veil-lift animation
- Dark side unlock: glitch effect + red flash

---

## Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Cloudinary account
- Google Cloud Console project (for OAuth)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mysticmatch.git
cd mysticmatch

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install

# 4. Set up environment variables
# Copy .env.example to .env in both /server and /client
# Fill in all values

# 5. Run the development servers (from root)
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Backend runs on `http://localhost:5000`  
Frontend runs on `http://localhost:5173`

---

## Development Roadmap

### Phase 1 — Foundation (Week 1–2)
- [ ] Project setup (Vite + Express + MongoDB)
- [ ] Auth system (JWT + Google OAuth)
- [ ] User model + basic profile
- [ ] Personality Quiz engine (questions + scoring)
- [ ] Archetype classifier logic

### Phase 2 — Core Product (Week 3–4)
- [ ] Story Mode (3 chapters, 5 decisions each)
- [ ] Compatibility engine
- [ ] Match suggestions feed
- [ ] Like / reject functionality

### Phase 3 — Engagement (Week 5–6)
- [ ] Real-time chat with Socket.io (diary entries UI)
- [ ] Dual persona profiles + dark side unlock
- [ ] Groq AI personality insights integration
- [ ] Match explanation (AI-generated)

### Phase 4 — Polish (Week 7–8)
- [ ] Gamification (badges, streaks)
- [ ] Compatibility Battle Mode
- [ ] Animations + UI polish (Framer Motion)
- [ ] Mobile responsiveness
- [ ] Deployment (Render + Vercel)

### Phase 5 — Advanced (Optional)
- [ ] Location-based matching (MongoDB geospatial queries)
- [ ] Voice/video chat (WebRTC)
- [ ] Push notifications
- [ ] Community clans/groups

---

## Future Enhancements

- **ML-based matching** — replace weighted formula with a trained model over time
- **Voice diary entries** — audio messages with transcription
- **Clan system** — group spaces for each archetype community
- **Mobile app** — React Native version
- **Seasonal events** — limited-time story chapters (e.g., Halloween arc)

---

## Key Design Decisions & Notes for Cursor

> These are important context notes for AI-assisted development:

1. **Groq replaces OpenAI** — All AI features use `groq-sdk` package, model `llama3-70b-8192`. Never import or reference `openai` package.

2. **State management** — Use **Zustand** on frontend, not Redux or Context API for global state.

3. **No TypeScript** — This project uses plain JavaScript throughout for simplicity and speed.

4. **Image uploads** — All image handling goes through Cloudinary via Multer middleware. Never store images locally or in MongoDB.

5. **Socket rooms** — Each user has a personal room (userId) and each chat has a room (chatId). Always join both on connection.

6. **Quiz questions** — Stored as a static JSON file in `server/data/questions.json`, not in the database.

7. **Story content** — Story chapters stored as static JSON in `server/data/story.json`. Decisions (user choices) are stored in MongoDB.

8. **Compatibility score** — Always calculated server-side, never on the client. Scores are cached in the Match document.

9. **Dark mode only** — The entire app is dark-themed. There is no light mode.

10. **Archetype colours** — Always use the CSS variables defined in the design system. Never hardcode hex values in components.

---

*Built with 🩸 and JavaScript — MysticMatch, where love is a supernatural force.*