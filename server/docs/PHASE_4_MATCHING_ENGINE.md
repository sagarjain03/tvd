# Phase 4 — Compatibility Matching Engine

## Overview

This phase is the core of MysticMatch. It builds the matching algorithm,
the Match model, and all the endpoints for discovering, liking, rejecting,
and retrieving matches. The compatibility score is calculated server-side
using cosine similarity, an archetype matrix, and activity scores.

> ⚠️ Phases 2 and 3 should be complete before this phase.
> The matching engine reads from `personalityTraits`, `supernaturalType`,
> `storyDecisions`, and `activityScore` — all populated in earlier phases.

---

## Folder Structure Added in This Phase

```
server/
├── controllers/
│   └── matchController.js          ← NEW
├── models/
│   └── Match.js                    ← NEW
├── routes/
│   └── matchRoutes.js              ← NEW
├── utils/
│   └── compatibilityEngine.js      ← NEW
```

---

## Dependencies

No new dependencies. Uses existing packages from Phase 1.

---

## `models/Match.js`

```javascript
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    compatibilityScore: {
      type: Number, // 0–100
      default: 0,
    },
    compatibilityLabel: {
      type: String, // e.g. "Ancient Bond", "Fated Rivals"
      default: "",
    },
    matchExplanation: {
      type: String, // AI-generated in Phase 6
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "matched", "rejected"],
      default: "pending",
    },
    // Which user initiated (liked first)
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Chat reference (added when match is made)
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    darkSideUnlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast lookup
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

const Match = mongoose.model("Match", matchSchema);
export default Match;
```

---

## `models/Chat.js`

> Create this model now so the Match can reference it.
> Full chat logic is implemented in Phase 5.

```javascript
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
```

---

## `utils/compatibilityEngine.js` — Core Algorithm

```javascript
// Archetype compatibility matrix
// Values represent natural chemistry between types (0.0 – 1.0)
const ARCHETYPE_MATRIX = {
  Vampire: {
    Vampire: 0.65,
    Werewolf: 0.50,
    Witch: 0.90,   // High intellectual tension
    Hybrid: 0.60,
  },
  Werewolf: {
    Vampire: 0.50,
    Werewolf: 0.60,
    Witch: 0.75,
    Hybrid: 0.85,  // Complementary raw energy
  },
  Witch: {
    Vampire: 0.90,  // Strategic meets intense
    Werewolf: 0.75,
    Witch: 0.55,
    Hybrid: 0.65,
  },
  Hybrid: {
    Vampire: 0.60,
    Werewolf: 0.85,
    Witch: 0.65,
    Hybrid: 0.45,  // Too similar — clash
  },
};

// Compatibility labels based on score ranges + archetype pairing
const COMPATIBILITY_LABELS = {
  high: ["Ancient Bond", "Fated Connection", "Eternal Match", "Soul Recognition"],
  medium: ["Kindred Spirits", "Unlikely Alliance", "Magnetic Pull", "Rising Chemistry"],
  low: ["Curious Strangers", "Potential Spark", "Distant Echoes", "Untested Waters"],
};

// Cosine similarity between two trait vectors
const cosineSimilarity = (vecA, vecB) => {
  const keys = Object.keys(vecA);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const key of keys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// Complementary score — how well the two trait sets balance each other
// High when one is strong where the other is weak
const calculateComplementaryScore = (traitsA, traitsB) => {
  const keys = Object.keys(traitsA);
  let complementScore = 0;

  for (const key of keys) {
    const a = traitsA[key] || 0;
    const b = traitsB[key] || 0;
    const avg = (a + b) / 2;
    const diff = Math.abs(a - b);

    // Perfect complement: one is high, other is low, average is medium
    // Score highest when difference is 3–6 on 0–10 scale
    if (diff >= 3 && diff <= 6) {
      complementScore += avg / 10;
    } else if (diff < 3) {
      complementScore += (avg / 10) * 0.5; // Similar — less complementary
    } else {
      complementScore += (avg / 10) * 0.3; // Too different — harder to connect
    }
  }

  return complementScore / keys.length;
};

// Generate a compatibility label
const getCompatibilityLabel = (score, type1, type2) => {
  let pool;
  if (score >= 75) pool = COMPATIBILITY_LABELS.high;
  else if (score >= 50) pool = COMPATIBILITY_LABELS.medium;
  else pool = COMPATIBILITY_LABELS.low;

  // Deterministic pick based on archetype pairing
  const index = (type1.charCodeAt(0) + type2.charCodeAt(0)) % pool.length;
  return pool[index];
};

// Main compatibility calculator
export const calculateCompatibility = (user1, user2) => {
  const traits1 = user1.personalityTraits;
  const traits2 = user2.personalityTraits;
  const type1 = user1.supernaturalType;
  const type2 = user2.supernaturalType;

  // If either user hasn't completed the quiz, return a base score
  if (!type1 || !type2) {
    return { score: 50, label: "Mystery Connection" };
  }

  // Component 1: Personality trait similarity (cosine similarity)
  const similarity = cosineSimilarity(traits1, traits2); // 0.0–1.0

  // Component 2: Archetype chemistry from matrix
  const archetypeScore = ARCHETYPE_MATRIX[type1][type2]; // 0.0–1.0

  // Component 3: Complementary traits score
  const complementary = calculateComplementaryScore(traits1, traits2); // 0.0–1.0

  // Component 4: Activity balance (neither should be dramatically more active)
  const activity1 = Math.min(user1.activityScore || 0, 100) / 100;
  const activity2 = Math.min(user2.activityScore || 0, 100) / 100;
  const activityScore = 1 - Math.abs(activity1 - activity2); // Closer = better

  // Weighted final score
  const rawScore =
    similarity * 0.35 +
    archetypeScore * 0.25 +
    complementary * 0.30 +
    activityScore * 0.10;

  const finalScore = Math.round(rawScore * 100);
  const label = getCompatibilityLabel(finalScore, type1, type2);

  return { score: finalScore, label };
};
```

---

## `controllers/matchController.js`

```javascript
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Match from "../models/Match.js";
import Chat from "../models/Chat.js";
import { calculateCompatibility } from "../utils/compatibilityEngine.js";

// Helper: normalize match order (always lower ObjectId as user1)
const normalizeMatchOrder = (id1, id2) => {
  return id1.toString() < id2.toString()
    ? { user1: id1, user2: id2 }
    : { user1: id2, user2: id1 };
};

// @desc    Get match suggestions for current user
// @route   GET /api/matches/suggestions
// @access  Private
export const getMatchSuggestions = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  // Exclude self, already liked, already rejected
  const excludeIds = [
    req.user._id,
    ...currentUser.likedUsers,
    ...currentUser.rejectedUsers,
  ];

  // Find users who have completed quiz (have a supernaturalType)
  const candidates = await User.find({
    _id: { $nin: excludeIds },
    supernaturalType: { $ne: null },
    quizCompleted: true,
  })
    .select("name profilePhoto supernaturalType personalityTraits activityScore storyProgress")
    .limit(20);

  // Calculate compatibility for each candidate
  const suggestions = candidates.map((candidate) => {
    const { score, label } = calculateCompatibility(currentUser, candidate);
    return {
      user: candidate,
      compatibilityScore: score,
      compatibilityLabel: label,
    };
  });

  // Sort by compatibility score descending
  suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  res.json({ success: true, suggestions });
});

// @desc    Like a user
// @route   POST /api/matches/like/:userId
// @access  Private
export const likeUser = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    res.status(400);
    throw new Error("You cannot like yourself");
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Add to likedUsers if not already there
  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { likedUsers: targetId },
  });

  // Check if target has already liked current user (mutual match)
  const targetLikedCurrent = targetUser.likedUsers.includes(currentUserId);

  if (targetLikedCurrent) {
    // It's a match!
    const { user1, user2 } = normalizeMatchOrder(currentUserId, targetId);
    const currentUser = await User.findById(currentUserId);
    const { score, label } = calculateCompatibility(currentUser, targetUser);

    // Create or update match
    let match = await Match.findOne({ user1, user2 });

    if (!match) {
      // Create chat for this match
      const chat = await Chat.create({
        matchId: null, // Will update after match is created
        participants: [user1, user2],
      });

      match = await Match.create({
        user1,
        user2,
        compatibilityScore: score,
        compatibilityLabel: label,
        status: "matched",
        initiatedBy: currentUserId,
        chatId: chat._id,
      });

      // Update chat with matchId
      chat.matchId = match._id;
      await chat.save();

      // Add match to both users
      await User.findByIdAndUpdate(user1, {
        $addToSet: { matches: match._id },
      });
      await User.findByIdAndUpdate(user2, {
        $addToSet: { matches: match._id },
      });

      // Increment activity scores
      await User.findByIdAndUpdate(currentUserId, { $inc: { activityScore: 5 } });
      await User.findByIdAndUpdate(targetId, { $inc: { activityScore: 5 } });
    }

    return res.json({
      success: true,
      isMatch: true,
      match: {
        id: match._id,
        compatibilityScore: match.compatibilityScore,
        compatibilityLabel: match.compatibilityLabel,
        chatId: match.chatId,
      },
    });
  }

  // Not a mutual match yet — pending
  const { user1, user2 } = normalizeMatchOrder(currentUserId, targetId);
  await Match.findOneAndUpdate(
    { user1, user2 },
    {
      user1,
      user2,
      status: "pending",
      initiatedBy: currentUserId,
    },
    { upsert: true }
  );

  res.json({ success: true, isMatch: false });
});

// @desc    Reject a user
// @route   POST /api/matches/reject/:userId
// @access  Private
export const rejectUser = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { rejectedUsers: targetId },
  });

  const { user1, user2 } = normalizeMatchOrder(req.user._id, targetId);
  await Match.findOneAndUpdate(
    { user1, user2 },
    { status: "rejected" },
    { upsert: true }
  );

  res.json({ success: true, message: "User rejected" });
});

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
export const getMatches = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "matches",
    match: { status: "matched" },
    populate: [
      { path: "user1", select: "name profilePhoto supernaturalType" },
      { path: "user2", select: "name profilePhoto supernaturalType" },
    ],
  });

  // Return the OTHER user in each match
  const matches = user.matches.map((match) => {
    const otherUser =
      match.user1._id.toString() === req.user._id.toString()
        ? match.user2
        : match.user1;

    return {
      matchId: match._id,
      user: otherUser,
      compatibilityScore: match.compatibilityScore,
      compatibilityLabel: match.compatibilityLabel,
      chatId: match.chatId,
      darkSideUnlocked: match.darkSideUnlocked,
      matchedAt: match.createdAt,
    };
  });

  res.json({ success: true, matches });
});

// @desc    Get a specific match with full details
// @route   GET /api/matches/:matchId
// @access  Private
export const getMatchById = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.matchId)
    .populate("user1", "name profilePhoto supernaturalType personalityTraits")
    .populate("user2", "name profilePhoto supernaturalType personalityTraits");

  if (!match) {
    res.status(404);
    throw new Error("Match not found");
  }

  // Ensure requesting user is part of this match
  const isParticipant =
    match.user1._id.toString() === req.user._id.toString() ||
    match.user2._id.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorised to view this match");
  }

  res.json({ success: true, match });
});

// @desc    Unlock dark side profile after match
// @route   PATCH /api/matches/:matchId/unlock-dark-side
// @access  Private
export const unlockDarkSide = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.matchId);

  if (!match || match.status !== "matched") {
    res.status(404);
    throw new Error("Match not found");
  }

  match.darkSideUnlocked = true;
  await match.save();

  // Return the other user's dark side profile
  const otherUserId =
    match.user1.toString() === req.user._id.toString()
      ? match.user2
      : match.user1;

  const otherUser = await User.findById(otherUserId).select("darkSideProfile");

  res.json({
    success: true,
    darkSideProfile: otherUser.darkSideProfile,
  });
});
```

---

## `routes/matchRoutes.js`

```javascript
import express from "express";
import {
  getMatchSuggestions,
  likeUser,
  rejectUser,
  getMatches,
  getMatchById,
  unlockDarkSide,
} from "../controllers/matchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMatches);
router.get("/suggestions", protect, getMatchSuggestions);
router.get("/:matchId", protect, getMatchById);
router.post("/like/:userId", protect, likeUser);
router.post("/reject/:userId", protect, rejectUser);
router.patch("/:matchId/unlock-dark-side", protect, unlockDarkSide);

export default router;
```

---

## Register Routes in `server.js`

```javascript
import matchRoutes from "./routes/matchRoutes.js";
app.use("/api/matches", matchRoutes);
```

---

## API Endpoints in This Phase

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/matches` | Private | Get all matched users |
| GET | `/api/matches/suggestions` | Private | Get ranked match suggestions |
| GET | `/api/matches/:matchId` | Private | Get a specific match |
| POST | `/api/matches/like/:userId` | Private | Like a user |
| POST | `/api/matches/reject/:userId` | Private | Reject a user |
| PATCH | `/api/matches/:matchId/unlock-dark-side` | Private | Unlock dark side profile |

---

## Compatibility Score Reference

| Score | Label Examples | Archetype Pair Example |
|---|---|---|
| 75–100 | "Ancient Bond", "Fated Connection" | Vampire + Witch |
| 50–74 | "Kindred Spirits", "Magnetic Pull" | Werewolf + Witch |
| 25–49 | "Curious Strangers", "Potential Spark" | Hybrid + Hybrid |
| 0–24 | "Distant Echoes" | Rarely occurs |

---

## Testing Checklist (Postman)

- [ ] `GET /api/matches/suggestions` — returns sorted list, excludes already interacted users
- [ ] `POST /api/matches/like/:userId` — saves to likedUsers, returns `isMatch: false`
- [ ] Like User A from User B (who already liked User B) — returns `isMatch: true`, creates Match + Chat
- [ ] `GET /api/matches` — returns only `status: "matched"` matches with other user populated
- [ ] `GET /api/matches/:matchId` — returns full match details
- [ ] `GET /api/matches/:matchId` from a non-participant — returns 403
- [ ] `POST /api/matches/reject/:userId` — adds to rejectedUsers, won't appear in suggestions
- [ ] `PATCH /api/matches/:matchId/unlock-dark-side` — sets darkSideUnlocked true, returns dark profile
- [ ] Compatibility score is between 0 and 100 for every match
- [ ] Both users' activityScore increments by 5 on mutual match

---

## ✅ Phase 4 Complete When

- Compatibility algorithm produces correct scores for all archetype pairs
- Like / reject system works correctly
- Mutual like creates a Match document and a Chat document
- Match suggestions exclude already-interacted users
- Only matched users can see each other's full match details
- Dark side unlock works correctly
- All test cases above pass