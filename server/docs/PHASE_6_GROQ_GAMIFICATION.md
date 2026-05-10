# Phase 6 — Groq AI Insights, Gamification & Cloudinary

## Overview

This is the final backend phase. It adds three major systems:

1. **Groq AI Integration** — personality insights, match explanations, and Battle Mode
2. **Gamification** — achievements/badges, daily streak tracking
3. **Cloudinary** — profile image upload and management

> ⚠️ All previous phases must be complete before Phase 6.
> Groq uses user personality traits and archetype from Phase 2.
> Match explanation uses the Match document from Phase 4.
> Battle Mode uses a chat context from Phase 5.

---

## Folder Structure Added in This Phase

```
server/
├── config/
│   └── cloudinary.js               ← NEW
├── controllers/
│   ├── aiController.js             ← NEW
│   └── gamificationController.js   ← NEW
├── middleware/
│   └── uploadMiddleware.js         ← NEW
├── models/
│   └── Achievement.js              ← NEW
├── routes/
│   ├── aiRoutes.js                 ← NEW
│   ├── gamificationRoutes.js       ← NEW
│   └── uploadRoutes.js             ← NEW
├── utils/
│   └── groqClient.js               ← NEW
```

---

## Dependencies

```bash
npm install groq-sdk cloudinary multer multer-storage-cloudinary
```

---

## Environment Variables (Add to `.env`)

```env
# Groq API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Get your Groq API key at: https://console.groq.com (free tier available)

---

## PART A — GROQ AI INTEGRATION

---

## `utils/groqClient.js` — Groq API Wrapper

```javascript
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama3-70b-8192";

// Parse AI response safely — handles both JSON and plain text
const safeParseJSON = (text) => {
  try {
    // Remove markdown code fences if present
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

// ─── PERSONALITY INSIGHT ────────────────────────────────────────────────────
export const generatePersonalityInsight = async (user) => {
  const { supernaturalType, personalityTraits, name } = user;

  const prompt = `
You are an ancient oracle in the world of The Vampire Diaries.
Analyze this supernatural being and return ONLY a JSON object with no extra text.

Name: ${name}
Supernatural Type: ${supernaturalType}
Trait Scores (0-10 scale):
- Loyalty: ${personalityTraits.loyalty.toFixed(1)}
- Aggression: ${personalityTraits.aggression.toFixed(1)}
- Empathy: ${personalityTraits.empathy.toFixed(1)}
- Strategy: ${personalityTraits.strategy.toFixed(1)}
- Dominance: ${personalityTraits.dominance.toFixed(1)}
- Emotional Depth: ${personalityTraits.emotionalDepth.toFixed(1)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence poetic description of this being's essence as a ${supernaturalType}",
  "strengths": ["strength 1 in the vampire diaries world", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "idealPartner": "1-2 sentence description of who would balance or complete this supernatural being",
  "powerPhrase": "One iconic line that captures their essence (under 15 words)"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle in the world of The Vampire Diaries. Speak poetically but concisely. Always respond with valid JSON only — no markdown, no preamble.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 600,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse AI insight response");
  }

  return parsed;
};

// ─── MATCH EXPLANATION ───────────────────────────────────────────────────────
export const generateMatchExplanation = async (user1, user2, compatibilityScore, compatibilityLabel) => {
  const prompt = `
You are an ancient oracle in the world of The Vampire Diaries.
Explain the supernatural connection between two beings. Return ONLY a JSON object.

Being 1: ${user1.name} (${user1.supernaturalType})
Traits: Loyalty ${user1.personalityTraits.loyalty.toFixed(1)}, Empathy ${user1.personalityTraits.empathy.toFixed(1)}, Dominance ${user1.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user1.personalityTraits.emotionalDepth.toFixed(1)}

Being 2: ${user2.name} (${user2.supernaturalType})
Traits: Loyalty ${user2.personalityTraits.loyalty.toFixed(1)}, Empathy ${user2.personalityTraits.empathy.toFixed(1)}, Dominance ${user2.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user2.personalityTraits.emotionalDepth.toFixed(1)}

Compatibility: ${compatibilityScore}% — "${compatibilityLabel}"

Return this exact JSON:
{
  "explanation": "2-3 sentences describing why these two supernatural beings are drawn to each other",
  "tension": "1 sentence about the conflict or challenge in their connection",
  "potential": "1 sentence about what they could become together"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle in the world of The Vampire Diaries. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 400,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse match explanation response");
  }

  return parsed;
};

// ─── BATTLE MODE RESULT ───────────────────────────────────────────────────────
export const generateBattleResult = async (user1, user2, scenario, answer1, answer2) => {
  const prompt = `
You are an oracle in the world of The Vampire Diaries analyzing supernatural chemistry.
Two beings answered the same scenario. Compare their responses and reveal their chemistry.
Return ONLY a JSON object.

Scenario: "${scenario}"

${user1.name} (${user1.supernaturalType}) answered: "${answer1}"
${user2.name} (${user2.supernaturalType}) answered: "${answer2}"

Return this exact JSON:
{
  "chemistryScore": <number 0-100>,
  "chemistryLabel": "<one of: 'Magnetic', 'Kindred', 'Volatile', 'Neutral', 'Transcendent'>",
  "analysis": "2-3 sentences comparing their responses and what it reveals about their dynamic",
  "agreementAreas": ["area of alignment 1", "area of alignment 2"],
  "tensionAreas": ["potential clash 1"],
  "verdict": "One sentence dramatic verdict about their connection based on these answers"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle analyzing supernatural chemistry. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse battle result response");
  }

  return parsed;
};
```

---

## `controllers/aiController.js`

```javascript
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Match from "../models/Match.js";
import {
  generatePersonalityInsight,
  generateMatchExplanation,
  generateBattleResult,
} from "../utils/groqClient.js";

// Cache insights on the user document to avoid repeated Groq calls
// (re-generate only if traits change significantly)

// @desc    Generate or retrieve personality insight for a user
// @route   GET /api/ai/insights/:userId
// @access  Private
export const getPersonalityInsight = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.quizCompleted || !user.supernaturalType) {
    res.status(400);
    throw new Error("User must complete the quiz before insights can be generated");
  }

  // Generate fresh insight from Groq
  const insight = await generatePersonalityInsight(user);

  res.json({ success: true, insight });
});

// @desc    Generate match explanation for two matched users
// @route   POST /api/ai/match-explanation
// @access  Private
export const getMatchExplanation = asyncHandler(async (req, res) => {
  const { matchId } = req.body;

  const match = await Match.findById(matchId)
    .populate("user1", "name supernaturalType personalityTraits")
    .populate("user2", "name supernaturalType personalityTraits");

  if (!match || match.status !== "matched") {
    res.status(404);
    throw new Error("Match not found");
  }

  // Check requesting user is part of this match
  const isParticipant =
    match.user1._id.toString() === req.user._id.toString() ||
    match.user2._id.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorised");
  }

  // Return cached explanation if it exists
  if (match.matchExplanation) {
    return res.json({
      success: true,
      explanation: JSON.parse(match.matchExplanation),
      cached: true,
    });
  }

  // Generate and cache
  const explanation = await generateMatchExplanation(
    match.user1,
    match.user2,
    match.compatibilityScore,
    match.compatibilityLabel
  );

  match.matchExplanation = JSON.stringify(explanation);
  await match.save();

  res.json({ success: true, explanation, cached: false });
});

// @desc    Generate Battle Mode chemistry result
// @route   POST /api/ai/battle-result
// @access  Private
export const getBattleResult = asyncHandler(async (req, res) => {
  const { matchId, scenario, answer1, answer2, user1Id, user2Id } = req.body;

  if (!scenario || !answer1 || !answer2) {
    res.status(400);
    throw new Error("Scenario and both answers are required");
  }

  const user1 = await User.findById(user1Id).select("name supernaturalType");
  const user2 = await User.findById(user2Id).select("name supernaturalType");

  if (!user1 || !user2) {
    res.status(404);
    throw new Error("Users not found");
  }

  const result = await generateBattleResult(user1, user2, scenario, answer1, answer2);

  res.json({ success: true, result });
});
```

---

## `routes/aiRoutes.js`

```javascript
import express from "express";
import {
  getPersonalityInsight,
  getMatchExplanation,
  getBattleResult,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/insights/:userId", protect, getPersonalityInsight);
router.post("/match-explanation", protect, getMatchExplanation);
router.post("/battle-result", protect, getBattleResult);

export default router;
```

---

## PART B — GAMIFICATION

---

## Achievement Definitions

```javascript
// server/data/achievements.js
export const ACHIEVEMENTS = [
  {
    id: "original_vampire",
    name: "Original Vampire",
    description: "Complete all 3 story chapters",
    icon: "🧛",
    trigger: "story_completed",
  },
  {
    id: "ripper_mode",
    name: "Ripper Mode",
    description: "Send 50 diary entries in a single day",
    icon: "🩸",
    trigger: "messages_50_in_day",
  },
  {
    id: "loyal_witch",
    name: "Loyal Witch",
    description: "Maintain a 7-day activity streak",
    icon: "🔮",
    trigger: "streak_7",
  },
  {
    id: "hybrid_awakening",
    name: "Hybrid Awakening",
    description: "Match with all 4 supernatural archetypes",
    icon: "⚡",
    trigger: "all_archetypes_matched",
  },
  {
    id: "keeper_of_secrets",
    name: "Keeper of Secrets",
    description: "Unlock 5 dark side profiles",
    icon: "📖",
    trigger: "dark_sides_5",
  },
  {
    id: "first_blood",
    name: "First Blood",
    description: "Get your first mutual match",
    icon: "❤️",
    trigger: "first_match",
  },
  {
    id: "eternal_bond",
    name: "Eternal Bond",
    description: "Maintain a 30-day activity streak",
    icon: "♾️",
    trigger: "streak_30",
  },
  {
    id: "compulsion_master",
    name: "Compulsion Master",
    description: "Pin 10 diary entries across all chats",
    icon: "🌀",
    trigger: "pins_10",
  },
];
```

---

## `models/Achievement.js`

```javascript
import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    achievementId: {
      type: String,
      required: true,
    },
    name: String,
    description: String,
    icon: String,
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;
```

---

## `controllers/gamificationController.js`

```javascript
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Achievement from "../models/Achievement.js";
import Match from "../models/Match.js";
import Message from "../models/Message.js";
import { ACHIEVEMENTS } from "../data/achievements.js";

// Core function: award an achievement if not already earned
export const awardAchievement = async (userId, achievementId) => {
  const definition = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!definition) return null;

  try {
    const achievement = await Achievement.create({
      userId,
      achievementId,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { achievements: achievement._id },
    });

    return achievement;
  } catch (err) {
    // Duplicate — already earned. That's fine.
    if (err.code === 11000) return null;
    throw err;
  }
};

// Check and award all applicable achievements for a user
export const checkAndAwardAchievements = async (userId) => {
  const user = await User.findById(userId).populate("achievements");
  const newAchievements = [];

  // FIRST_BLOOD — first match
  const matchCount = await Match.countDocuments({
    $or: [{ user1: userId }, { user2: userId }],
    status: "matched",
  });
  if (matchCount >= 1) {
    const a = await awardAchievement(userId, "first_blood");
    if (a) newAchievements.push(a);
  }

  // STORY COMPLETED
  if (user.storyProgress?.completed) {
    const a = await awardAchievement(userId, "original_vampire");
    if (a) newAchievements.push(a);
  }

  // STREAK_7
  if (user.streak?.current >= 7) {
    const a = await awardAchievement(userId, "loyal_witch");
    if (a) newAchievements.push(a);
  }

  // STREAK_30
  if (user.streak?.current >= 30) {
    const a = await awardAchievement(userId, "eternal_bond");
    if (a) newAchievements.push(a);
  }

  // HYBRID_AWAKENING — matched with all 4 archetypes
  const matches = await Match.find({
    $or: [{ user1: userId }, { user2: userId }],
    status: "matched",
  }).populate("user1 user2", "supernaturalType");

  const matchedArchetypes = new Set();
  for (const match of matches) {
    const other =
      match.user1._id.toString() === userId.toString()
        ? match.user2
        : match.user1;
    if (other.supernaturalType) matchedArchetypes.add(other.supernaturalType);
  }

  if (matchedArchetypes.size >= 4) {
    const a = await awardAchievement(userId, "hybrid_awakening");
    if (a) newAchievements.push(a);
  }

  // KEEPER_OF_SECRETS — unlocked 5 dark side profiles
  const darkSideCount = await Match.countDocuments({
    $or: [{ user1: userId }, { user2: userId }],
    darkSideUnlocked: true,
  });
  if (darkSideCount >= 5) {
    const a = await awardAchievement(userId, "keeper_of_secrets");
    if (a) newAchievements.push(a);
  }

  return newAchievements;
};

// @desc    Get all achievements for a user
// @route   GET /api/gamification/achievements/:userId
// @access  Private
export const getAchievements = asyncHandler(async (req, res) => {
  const earned = await Achievement.find({ userId: req.params.userId }).sort({
    unlockedAt: -1,
  });

  // Also return unearned achievements (locked)
  const earnedIds = earned.map((a) => a.achievementId);
  const locked = ACHIEVEMENTS.filter((a) => !earnedIds.includes(a.id)).map(
    (a) => ({ ...a, locked: true })
  );

  res.json({
    success: true,
    earned,
    locked,
    total: ACHIEVEMENTS.length,
    earnedCount: earned.length,
  });
});

// @desc    Get streak info for a user
// @route   GET /api/gamification/streak/:userId
// @access  Private
export const getStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("streak");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ success: true, streak: user.streak });
});

// @desc    Update streak on daily login/activity
// @route   POST /api/gamification/streak/update
// @access  Private
export const updateStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastActive = user.streak.lastActiveDate
    ? new Date(user.streak.lastActiveDate)
    : null;

  let newStreak = user.streak.current;
  let newAchievements = [];

  if (!lastActive) {
    // First ever activity
    newStreak = 1;
  } else {
    const lastActiveDay = new Date(
      lastActive.getFullYear(),
      lastActive.getMonth(),
      lastActive.getDate()
    );
    const dayDiff = Math.floor(
      (today - lastActiveDay) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 0) {
      // Already updated today — no change
      return res.json({
        success: true,
        streak: user.streak,
        message: "Streak already updated today",
      });
    } else if (dayDiff === 1) {
      // Consecutive day — increment
      newStreak = user.streak.current + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  user.streak.current = newStreak;
  user.streak.longest = Math.max(newStreak, user.streak.longest);
  user.streak.lastActiveDate = now;
  user.activityScore = Math.min(100, user.activityScore + 2);
  await user.save();

  // Check for streak-based achievements
  newAchievements = await checkAndAwardAchievements(user._id);

  res.json({
    success: true,
    streak: user.streak,
    newAchievements,
  });
});

// @desc    Manually trigger achievement check (after significant events)
// @route   POST /api/gamification/check-achievements
// @access  Private
export const triggerAchievementCheck = asyncHandler(async (req, res) => {
  const newAchievements = await checkAndAwardAchievements(req.user._id);

  res.json({
    success: true,
    newAchievements,
    count: newAchievements.length,
  });
});
```

---

## `routes/gamificationRoutes.js`

```javascript
import express from "express";
import {
  getAchievements,
  getStreak,
  updateStreak,
  triggerAchievementCheck,
} from "../controllers/gamificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/achievements/:userId", protect, getAchievements);
router.get("/streak/:userId", protect, getStreak);
router.post("/streak/update", protect, updateStreak);
router.post("/check-achievements", protect, triggerAchievementCheck);

export default router;
```

---

## PART C — CLOUDINARY IMAGE UPLOADS

---

## `config/cloudinary.js`

```javascript
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mysticmatch/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto" },
    ],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export default cloudinary;
```

---

## `middleware/uploadMiddleware.js`

```javascript
import { upload } from "../config/cloudinary.js";

// Single profile photo upload
export const uploadProfilePhoto = upload.single("profilePhoto");

// Error handler for multer
export const handleUploadError = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }
  if (err.message === "Invalid file type") {
    return res.status(400).json({
      success: false,
      message: "Only jpg, jpeg, png, and webp images are allowed.",
    });
  }
  next(err);
};
```

---

## Upload Route — Add to `authRoutes.js` or create `uploadRoutes.js`

```javascript
import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfilePhoto, handleUploadError } from "../middleware/uploadMiddleware.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// @desc    Upload profile photo
// @route   POST /api/upload/profile-photo
// @access  Private
router.post(
  "/profile-photo",
  protect,
  uploadProfilePhoto,
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const user = await User.findById(req.user._id);

    // Delete old photo from Cloudinary if exists
    if (user.profilePhoto) {
      try {
        const publicId = user.profilePhoto.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`mysticmatch/profiles/${publicId}`);
      } catch (err) {
        console.warn("Could not delete old profile photo:", err.message);
      }
    }

    // Update user with new photo URL
    user.profilePhoto = req.file.path;
    await user.save();

    res.json({
      success: true,
      profilePhoto: req.file.path,
    });
  })
);

export default router;
```

---

## Register All Phase 6 Routes in `server.js`

```javascript
import aiRoutes from "./routes/aiRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

app.use("/api/ai", aiRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/upload", uploadRoutes);
```

---

## API Endpoints in This Phase

### AI Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/ai/insights/:userId` | Get Groq personality insight |
| POST | `/api/ai/match-explanation` | Generate match chemistry explanation |
| POST | `/api/ai/battle-result` | Generate Battle Mode result |

### Gamification Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/gamification/achievements/:userId` | Get earned + locked achievements |
| GET | `/api/gamification/streak/:userId` | Get streak data |
| POST | `/api/gamification/streak/update` | Update daily streak |
| POST | `/api/gamification/check-achievements` | Check and award new achievements |

### Upload Endpoints
| Method | Route | Description |
|---|---|---|
| POST | `/api/upload/profile-photo` | Upload profile photo to Cloudinary |

---

## Groq API Notes for Cursor

- **Model:** Always use `llama3-70b-8192` (or from `GROQ_MODEL` env variable)
- **Never use `openai` package** — only `groq-sdk`
- **Rate limits:** Groq free tier has generous limits but always add try/catch around API calls
- **Response parsing:** Always use `safeParseJSON()` — never assume the model returns clean JSON
- **Caching:** Match explanations are cached in the Match document to avoid repeated API calls
- **Temperature:** 0.8–0.9 for creative/narrative content, lower for structured outputs

---

## Testing Checklist

### Groq AI Tests
- [ ] `GET /api/ai/insights/:userId` — returns valid insight object with all fields
- [ ] `GET /api/ai/insights/:userId` for user without quiz — returns 400
- [ ] `POST /api/ai/match-explanation` — returns explanation with all 3 fields
- [ ] `POST /api/ai/match-explanation` second call — returns cached version
- [ ] `POST /api/ai/battle-result` — returns chemistry score 0–100

### Gamification Tests
- [ ] `POST /api/gamification/streak/update` first time — sets streak to 1
- [ ] `POST /api/gamification/streak/update` same day — returns "already updated" message
- [ ] `POST /api/gamification/streak/update` after 2 days gap — resets streak to 1
- [ ] `GET /api/gamification/achievements/:userId` — returns earned + locked split
- [ ] After completing story — `original_vampire` badge awarded
- [ ] After 7-day streak — `loyal_witch` badge awarded
- [ ] After first match — `first_blood` badge awarded
- [ ] Duplicate badge award — no duplicate created (unique index enforced)

### Cloudinary Tests
- [ ] `POST /api/upload/profile-photo` with image — returns Cloudinary URL
- [ ] `POST /api/upload/profile-photo` with file > 5MB — returns 400
- [ ] Uploading new photo — old photo deleted from Cloudinary
- [ ] `User.profilePhoto` updated in DB with new URL

---

## ✅ Phase 6 Complete When

- Groq API returns valid structured insights for all 3 AI endpoint types
- Match explanations are generated and cached correctly
- Battle Mode returns a chemistry score + analysis
- Streaks track correctly across days
- Achievements award automatically on trigger events
- No duplicate achievements possible
- Profile photos upload to Cloudinary and update User document
- Old photos are cleaned up from Cloudinary on re-upload

---

## 🎉 Backend Complete

All 6 phases done means the MysticMatch backend is fully functional:

- ✅ Phase 1 — Auth (JWT + Google OAuth)
- ✅ Phase 2 — Quiz + Archetype Classifier
- ✅ Phase 3 — Story Mode + Decision Engine
- ✅ Phase 4 — Compatibility Matching Engine
- ✅ Phase 5 — Real-Time Chat (Socket.io)
- ✅ Phase 6 — Groq AI + Gamification + Cloudinary

**Next step: Frontend phases.**