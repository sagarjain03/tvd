# Phase 2 — Personality Quiz & Archetype Classification Engine

## Overview

This phase builds the personality engine — the brain of MysticMatch.
Users answer 15 questions. Their answers are scored across 6 trait axes.
Those trait scores are then fed into the archetype classifier which assigns
them a supernatural identity: Vampire, Werewolf, Witch, or Hybrid.

This phase touches: static data files, scoring algorithm, classifier logic,
and saving results back to the User document.

---

## Folder Structure Added in This Phase

```
server/
├── controllers/
│   └── quizController.js          ← NEW
├── data/
│   └── questions.json             ← NEW (static quiz data)
├── routes/
│   └── quizRoutes.js              ← NEW
├── utils/
│   └── archetypeClassifier.js     ← NEW
```

---

## Dependencies

No new dependencies needed. Everything uses existing packages from Phase 1.

---

## The 6 Trait Axes

Every question maps answers to one or more of these traits (score range 0–10):

| Trait | What It Measures |
|---|---|
| `loyalty` | Commitment, faithfulness, trust in relationships |
| `aggression` | Impulsiveness, confrontation, reaction to threats |
| `empathy` | Emotional understanding, compassion, reading others |
| `strategy` | Planning, intelligence, thinking before acting |
| `dominance` | Need for control, leadership, assertiveness |
| `emotionalDepth` | Intensity of feelings, vulnerability, inner life |

---

## Supernatural Archetype Classification Logic

```
Vampire  → high emotionalDepth + high loyalty + high dominance
Werewolf → high aggression + high loyalty + low strategy
Witch    → high strategy + high empathy + high emotionalDepth
Hybrid   → high dominance + high aggression + mixed everything else
```

Each archetype has a **weight profile** — the classifier scores the user's
traits against each archetype's profile and picks the closest match.

---

## `data/questions.json` — Full Question Bank

```json
[
  {
    "id": "q_001",
    "chapter": 1,
    "question": "Someone you deeply trust betrays you. What is your first instinct?",
    "options": [
      {
        "text": "Cut them off completely. Silence is the sharpest weapon.",
        "traits": { "dominance": 2, "loyalty": -1, "emotionalDepth": 1 }
      },
      {
        "text": "Confront them immediately. You need answers now.",
        "traits": { "aggression": 2, "emotionalDepth": 1 }
      },
      {
        "text": "Study the situation first. There's always a deeper motive.",
        "traits": { "strategy": 3, "aggression": -1 }
      },
      {
        "text": "Forgive them. Everyone is fighting a battle you know nothing about.",
        "traits": { "empathy": 3, "loyalty": 1 }
      }
    ]
  },
  {
    "id": "q_002",
    "chapter": 1,
    "question": "You walk into a party where you know nobody. What do you do?",
    "options": [
      {
        "text": "Own the room. You were born for moments like this.",
        "traits": { "dominance": 3, "aggression": 1 }
      },
      {
        "text": "Find one interesting person and have a real conversation.",
        "traits": { "emotionalDepth": 2, "empathy": 1 }
      },
      {
        "text": "Observe quietly. You learn more by watching than talking.",
        "traits": { "strategy": 3, "aggression": -1 }
      },
      {
        "text": "Stay close to whoever you came with. Loyalty over everything.",
        "traits": { "loyalty": 3, "dominance": -1 }
      }
    ]
  },
  {
    "id": "q_003",
    "chapter": 1,
    "question": "What does love mean to you?",
    "options": [
      {
        "text": "An all-consuming force. When you love, it devours everything else.",
        "traits": { "emotionalDepth": 3, "loyalty": 2 }
      },
      {
        "text": "Protection. You'd burn the world down for the people you love.",
        "traits": { "aggression": 2, "loyalty": 2 }
      },
      {
        "text": "A partnership of equals. Balanced, strategic, mutual.",
        "traits": { "strategy": 2, "empathy": 2 }
      },
      {
        "text": "Power. Love is the strongest leverage there is.",
        "traits": { "dominance": 3, "strategy": 1 }
      }
    ]
  },
  {
    "id": "q_004",
    "chapter": 1,
    "question": "You discover a close friend has been lying to you for months. You:",
    "options": [
      {
        "text": "Disappear from their life without explanation.",
        "traits": { "dominance": 2, "emotionalDepth": 2 }
      },
      {
        "text": "Explode. You feel everything at full volume.",
        "traits": { "aggression": 3, "emotionalDepth": 1 }
      },
      {
        "text": "Ask yourself what you missed. What were the signs?",
        "traits": { "strategy": 3, "empathy": 1 }
      },
      {
        "text": "Try to understand why they felt they had to lie.",
        "traits": { "empathy": 3, "loyalty": 1 }
      }
    ]
  },
  {
    "id": "q_005",
    "chapter": 1,
    "question": "What is your greatest strength?",
    "options": [
      {
        "text": "Intensity. When you care, there is nothing half-hearted about it.",
        "traits": { "emotionalDepth": 3, "loyalty": 1 }
      },
      {
        "text": "Instinct. Your gut is almost never wrong.",
        "traits": { "aggression": 2, "empathy": 1 }
      },
      {
        "text": "Intelligence. You are always three steps ahead.",
        "traits": { "strategy": 3, "dominance": 1 }
      },
      {
        "text": "Resilience. You have survived things that would break others.",
        "traits": { "loyalty": 2, "dominance": 2 }
      }
    ]
  },
  {
    "id": "q_006",
    "chapter": 2,
    "question": "Someone challenges your authority in public. You:",
    "options": [
      {
        "text": "Smile coldly. They've just made a very serious mistake.",
        "traits": { "dominance": 3, "strategy": 1 }
      },
      {
        "text": "Fire back immediately. Nobody disrespects you and walks away clean.",
        "traits": { "aggression": 3, "dominance": 1 }
      },
      {
        "text": "Stay calm. Reacting is losing. You'll handle it privately.",
        "traits": { "strategy": 3, "emotionalDepth": 1 }
      },
      {
        "text": "Genuinely try to hear them out. Maybe they have a point.",
        "traits": { "empathy": 3, "dominance": -1 }
      }
    ]
  },
  {
    "id": "q_007",
    "chapter": 2,
    "question": "Your ideal Saturday night looks like:",
    "options": [
      {
        "text": "Alone, deep in your thoughts, reading or creating something.",
        "traits": { "emotionalDepth": 2, "strategy": 1 }
      },
      {
        "text": "Out with your people, fully present, fully alive.",
        "traits": { "loyalty": 2, "aggression": 1 }
      },
      {
        "text": "At an event where you can network, observe, and strategize.",
        "traits": { "strategy": 2, "dominance": 1 }
      },
      {
        "text": "Deep, uninterrupted one-on-one time with someone who matters.",
        "traits": { "emotionalDepth": 2, "empathy": 2 }
      }
    ]
  },
  {
    "id": "q_008",
    "chapter": 2,
    "question": "When you're in pain, you:",
    "options": [
      {
        "text": "Disappear. Nobody gets to see you fall apart.",
        "traits": { "dominance": 2, "emotionalDepth": 2 }
      },
      {
        "text": "Lash out. Pain turns to anger before you can stop it.",
        "traits": { "aggression": 3, "emotionalDepth": 1 }
      },
      {
        "text": "Analyse it. If you understand the pain, you can neutralise it.",
        "traits": { "strategy": 3 }
      },
      {
        "text": "Reach out. You believe in letting people in.",
        "traits": { "empathy": 2, "loyalty": 2 }
      }
    ]
  },
  {
    "id": "q_009",
    "chapter": 2,
    "question": "The most dangerous thing about you is:",
    "options": [
      {
        "text": "Your patience. You will wait as long as it takes.",
        "traits": { "strategy": 2, "dominance": 2 }
      },
      {
        "text": "Your anger. Once triggered, there's no off switch.",
        "traits": { "aggression": 3, "loyalty": 1 }
      },
      {
        "text": "Your mind. You see things others can't and use it.",
        "traits": { "strategy": 3, "empathy": 1 }
      },
      {
        "text": "Your love. You destroy yourself for the people you choose.",
        "traits": { "emotionalDepth": 3, "loyalty": 2 }
      }
    ]
  },
  {
    "id": "q_010",
    "chapter": 2,
    "question": "In a group, you naturally become:",
    "options": [
      {
        "text": "The one everyone follows without knowing why.",
        "traits": { "dominance": 3, "emotionalDepth": 1 }
      },
      {
        "text": "The protector. You keep your people safe no matter the cost.",
        "traits": { "aggression": 2, "loyalty": 2 }
      },
      {
        "text": "The strategist. The one with the plan when everything falls apart.",
        "traits": { "strategy": 3, "empathy": 1 }
      },
      {
        "text": "The heart. The emotional core that holds everyone together.",
        "traits": { "empathy": 3, "loyalty": 1 }
      }
    ]
  },
  {
    "id": "q_011",
    "chapter": 3,
    "question": "What do you want most from a relationship?",
    "options": [
      {
        "text": "Complete devotion. All or nothing.",
        "traits": { "emotionalDepth": 3, "dominance": 1 }
      },
      {
        "text": "Someone who can keep up with your fire.",
        "traits": { "aggression": 2, "loyalty": 2 }
      },
      {
        "text": "An intellectual equal. Someone who challenges your mind.",
        "traits": { "strategy": 3, "empathy": 1 }
      },
      {
        "text": "Stability and honesty. Someone real.",
        "traits": { "loyalty": 3, "empathy": 2 }
      }
    ]
  },
  {
    "id": "q_012",
    "chapter": 3,
    "question": "Your dark side is:",
    "options": [
      {
        "text": "Obsessive. When you fixate on something, nothing else exists.",
        "traits": { "emotionalDepth": 3, "dominance": 1 }
      },
      {
        "text": "Destructive. You burn bridges before they burn you.",
        "traits": { "aggression": 3, "loyalty": -1 }
      },
      {
        "text": "Manipulative. You know exactly which buttons to press.",
        "traits": { "strategy": 3, "empathy": -1 }
      },
      {
        "text": "Self-sacrificing to a fault. You hurt yourself to protect others.",
        "traits": { "loyalty": 3, "dominance": -1 }
      }
    ]
  },
  {
    "id": "q_013",
    "chapter": 3,
    "question": "If you could have one supernatural power, you'd choose:",
    "options": [
      {
        "text": "Compulsion — the ability to make anyone do what you want.",
        "traits": { "dominance": 3, "strategy": 1 }
      },
      {
        "text": "Enhanced strength and speed — pure, raw power.",
        "traits": { "aggression": 3, "dominance": 1 }
      },
      {
        "text": "Premonition — the ability to see what's coming.",
        "traits": { "strategy": 3, "emotionalDepth": 1 }
      },
      {
        "text": "Empathic healing — the ability to feel and remove others' pain.",
        "traits": { "empathy": 3, "loyalty": 1 }
      }
    ]
  },
  {
    "id": "q_014",
    "chapter": 3,
    "question": "Your biggest fear in a relationship is:",
    "options": [
      {
        "text": "Losing the one person who truly sees you.",
        "traits": { "emotionalDepth": 3, "loyalty": 2 }
      },
      {
        "text": "Not being able to protect the ones you love.",
        "traits": { "aggression": 1, "loyalty": 3 }
      },
      {
        "text": "Being outplayed by someone who knows you too well.",
        "traits": { "strategy": 2, "dominance": 2 }
      },
      {
        "text": "Being abandoned by the person you trusted most.",
        "traits": { "loyalty": 3, "empathy": 1 }
      }
    ]
  },
  {
    "id": "q_015",
    "chapter": 3,
    "question": "When making a hard decision, you trust:",
    "options": [
      {
        "text": "Your heart. It has never truly been wrong.",
        "traits": { "emotionalDepth": 3, "empathy": 1 }
      },
      {
        "text": "Your instincts. The body knows before the mind does.",
        "traits": { "aggression": 2, "loyalty": 1 }
      },
      {
        "text": "The data. Emotion is the enemy of good decisions.",
        "traits": { "strategy": 3, "empathy": -1 }
      },
      {
        "text": "The people around you. Wisdom lives in community.",
        "traits": { "loyalty": 2, "empathy": 2 }
      }
    ]
  }
]
```

---

## `utils/archetypeClassifier.js` — Classification Logic

```javascript
// Archetype trait weight profiles
// Each archetype has ideal scores for each trait (0–10 scale)
const ARCHETYPE_PROFILES = {
  Vampire: {
    loyalty: 8,
    aggression: 4,
    empathy: 5,
    strategy: 6,
    dominance: 8,
    emotionalDepth: 9,
  },
  Werewolf: {
    loyalty: 9,
    aggression: 8,
    empathy: 4,
    strategy: 3,
    dominance: 6,
    emotionalDepth: 5,
  },
  Witch: {
    loyalty: 6,
    aggression: 2,
    empathy: 8,
    strategy: 9,
    dominance: 5,
    emotionalDepth: 7,
  },
  Hybrid: {
    loyalty: 5,
    aggression: 7,
    empathy: 4,
    strategy: 6,
    dominance: 9,
    emotionalDepth: 6,
  },
};

// Euclidean distance between user traits and archetype profile
const calculateDistance = (userTraits, archetypeProfile) => {
  let sumSquares = 0;
  for (const trait in archetypeProfile) {
    const diff = (userTraits[trait] || 0) - archetypeProfile[trait];
    sumSquares += diff * diff;
  }
  return Math.sqrt(sumSquares);
};

// Classify user into supernatural archetype
export const classifyArchetype = (rawTraits) => {
  // Normalize traits to 0–10 scale
  const normalizedTraits = normalizeTraits(rawTraits);

  let closestArchetype = null;
  let minDistance = Infinity;

  for (const [archetype, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const distance = calculateDistance(normalizedTraits, profile);
    if (distance < minDistance) {
      minDistance = distance;
      closestArchetype = archetype;
    }
  }

  return {
    archetype: closestArchetype,
    traits: normalizedTraits,
  };
};

// Normalize raw trait scores to 0–10
const normalizeTraits = (rawTraits) => {
  const maxPossible = 30; // 15 questions × max +2 per question
  const normalized = {};
  for (const trait in rawTraits) {
    normalized[trait] = Math.min(
      10,
      Math.max(0, (rawTraits[trait] / maxPossible) * 10)
    );
  }
  return normalized;
};
```

---

## `controllers/quizController.js`

```javascript
import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import { classifyArchetype } from "../utils/archetypeClassifier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load questions from static file
const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/questions.json"), "utf-8")
);

// @desc    Get all quiz questions
// @route   GET /api/quiz/questions
// @access  Private
export const getQuestions = asyncHandler(async (req, res) => {
  // Return questions without trait weights (frontend doesn't need them)
  const sanitized = questions.map((q) => ({
    id: q.id,
    chapter: q.chapter,
    question: q.question,
    options: q.options.map((o) => ({ text: o.text })),
  }));

  res.json({ success: true, questions: sanitized });
});

// @desc    Submit quiz answers and classify archetype
// @route   POST /api/quiz/submit
// @access  Private
export const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  // answers = [{ questionId: "q_001", optionIndex: 2 }, ...]

  if (!answers || !Array.isArray(answers) || answers.length !== 15) {
    res.status(400);
    throw new Error("All 15 questions must be answered");
  }

  // Already completed check
  const user = await User.findById(req.user._id);
  if (user.quizCompleted) {
    res.status(400);
    throw new Error("Quiz already completed");
  }

  // Calculate raw trait scores
  const rawTraits = {
    loyalty: 0,
    aggression: 0,
    empathy: 0,
    strategy: 0,
    dominance: 0,
    emotionalDepth: 0,
  };

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const selectedOption = question.options[answer.optionIndex];
    if (!selectedOption) continue;

    for (const [trait, value] of Object.entries(selectedOption.traits)) {
      if (rawTraits.hasOwnProperty(trait)) {
        rawTraits[trait] += value;
      }
    }
  }

  // Classify archetype
  const { archetype, traits: normalizedTraits } = classifyArchetype(rawTraits);

  // Save to user
  user.supernaturalType = archetype;
  user.personalityTraits = normalizedTraits;
  user.quizCompleted = true;
  user.activityScore += 10; // Reward for completing quiz
  await user.save();

  res.json({
    success: true,
    result: {
      supernaturalType: archetype,
      personalityTraits: normalizedTraits,
    },
  });
});

// @desc    Get quiz result for a user
// @route   GET /api/quiz/result/:userId
// @access  Private
export const getQuizResult = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "supernaturalType personalityTraits quizCompleted"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ success: true, result: user });
});
```

---

## `routes/quizRoutes.js`

```javascript
import express from "express";
import {
  getQuestions,
  submitQuiz,
  getQuizResult,
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/questions", protect, getQuestions);
router.post("/submit", protect, submitQuiz);
router.get("/result/:userId", protect, getQuizResult);

export default router;
```

---

## Register Routes in `server.js`

Add to `server.js`:

```javascript
import quizRoutes from "./routes/quizRoutes.js";
app.use("/api/quiz", quizRoutes);
```

---

## API Endpoints in This Phase

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/quiz/questions` | Private | Get all 15 questions (no trait weights) |
| POST | `/api/quiz/submit` | Private | Submit answers, get archetype result |
| GET | `/api/quiz/result/:userId` | Private | Get a user's quiz result |

---

## Request / Response Examples

### POST `/api/quiz/submit`

**Request body:**
```json
{
  "answers": [
    { "questionId": "q_001", "optionIndex": 2 },
    { "questionId": "q_002", "optionIndex": 0 },
    { "questionId": "q_003", "optionIndex": 3 },
    ...15 total
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "supernaturalType": "Vampire",
    "personalityTraits": {
      "loyalty": 7.2,
      "aggression": 3.1,
      "empathy": 4.8,
      "strategy": 5.5,
      "dominance": 8.0,
      "emotionalDepth": 8.6
    }
  }
}
```

---

## Testing Checklist (Postman)

- [ ] `GET /api/quiz/questions` — returns 15 questions, no trait weights exposed
- [ ] `POST /api/quiz/submit` with all 15 answers — returns archetype + traits
- [ ] `POST /api/quiz/submit` twice — second attempt returns 400 (already completed)
- [ ] `POST /api/quiz/submit` with fewer than 15 answers — returns 400
- [ ] `GET /api/quiz/result/:userId` — returns stored archetype and traits
- [ ] User `activityScore` increments by 10 after quiz completion
- [ ] `supernaturalType` field on User document is updated correctly

---

## ✅ Phase 2 Complete When

- Questions load from static JSON file
- Quiz submission scores answers correctly
- Archetype classifier assigns one of the four types
- Normalized traits saved to User document
- No trait weight data exposed to the client
- All test cases above pass