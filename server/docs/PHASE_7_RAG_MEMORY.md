# Phase 7 — RAG-Powered Mystic Falls Memory System

## Overview

This phase transforms MysticMatch from a standard AI-integrated app into a
genuinely intelligent, memory-aware experience. Every quiz answer, story
decision, and diary entry (chat message) a user sends gets embedded into a
vector database (Pinecone). Before every Groq AI call, relevant memories are
retrieved and injected as context — making every AI response deeply personal
and grounded in what the user has actually said and done.

**Before RAG:**
> "As a Vampire with high emotional depth and loyalty, you are intense and
> devoted in your connections..."

**After RAG:**
> "The oracle remembers — in Chapter 2 you chose to expose your secret to
> gain cooperation rather than use force. In your diary you once wrote 'I'd
> wait as long as it takes.' These are not the acts of someone who loves
> lightly. Your devotion is not a trait — it is a choice you make again and
> again, even when it costs you."

That is the difference RAG makes. Real memory. Real personalization.

---

## What Changes vs Previous Phases

| What | Before Phase 7 | After Phase 7 |
|---|---|---|
| Personality Insight | Based on 6 trait numbers | Based on trait numbers + actual quiz answers + story decisions |
| Match Explanation | Based on two trait vectors | Based on traits + diary entries + shared story patterns |
| Battle Result | Based on two text answers | Based on answers + full history of each user's past choices |
| Chat | No AI involvement | Optional: AI can surface "memory moments" in chat |

**No frontend changes needed.** Existing AI endpoints return richer responses.
The frontend components display them identically.

---

## Architecture Overview

```
User Action (quiz / story / chat message)
         ↓
  Embed the text → float vector [0.021, -0.043, ...]
         ↓
  Store in Pinecone with metadata
  { userId, type, content, timestamp }
         ↓
         ↓  (later, on AI call)
         ↓
  Query Pinecone → retrieve top-K relevant memories
         ↓
  Inject memories into Groq system prompt as context
         ↓
  Groq generates grounded, personalized response
```

---

## Folder Structure Added in This Phase

```
server/
├── config/
│   └── pinecone.js                 ← NEW
├── utils/
│   ├── embedder.js                 ← NEW (text → vector)
│   └── memoryRetriever.js          ← NEW (query Pinecone, format context)
├── services/
│   └── memoryService.js            ← NEW (store memories, called from controllers)
```

**Modified files:**
```
server/
├── controllers/
│   ├── quizController.js           ← embed quiz answers after submission
│   ├── storyController.js          ← embed decisions after submission
│   ├── chatController.js           ← embed messages after send
│   └── aiController.js             ← retrieve memories before Groq calls
├── socket/
│   └── socketHandler.js            ← embed messages sent via socket
```

---

## Dependencies

```bash
npm install @pinecone-database/pinecone @xenova/transformers
```

- `@pinecone-database/pinecone` — official Pinecone client (v3+)
- `@xenova/transformers` — runs embedding model locally, no extra API key needed

> **Why local embeddings instead of an API?**
> `@xenova/transformers` runs the `all-MiniLM-L6-v2` model locally inside
> Node.js. It's fast, free, produces 384-dimension vectors, and removes a
> dependency on a paid embedding API. Perfect for a portfolio project.

---

## Environment Variables (Add to `.env`)

```env
# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=mysticmatch-memories

# Embedding model (local — no API key needed)
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
```

Get your free Pinecone API key at: https://app.pinecone.io
Free tier gives you 1 index, 100k vectors — more than enough.

---

## Pinecone Index Setup

Run this **once** to create the index. Add it as a setup script or run
manually before starting the server.

```javascript
// server/scripts/setupPinecone.js
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const setupIndex = async () => {
  const indexName = process.env.PINECONE_INDEX_NAME;

  const existingIndexes = await pc.listIndexes();
  const exists = existingIndexes.indexes?.some((i) => i.name === indexName);

  if (exists) {
    console.log(`✅ Pinecone index "${indexName}" already exists.`);
    return;
  }

  await pc.createIndex({
    name: indexName,
    dimension: parseInt(process.env.EMBEDDING_DIMENSIONS), // 384
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1", // Free tier region
      },
    },
  });

  console.log(`✅ Pinecone index "${indexName}" created successfully.`);
};

setupIndex().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "setup:pinecone": "node server/scripts/setupPinecone.js"
  }
}
```

Run once:
```bash
npm run setup:pinecone
```

---

## `config/pinecone.js` — Pinecone Client

```javascript
import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient = null;

export const getPineconeClient = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

export const getPineconeIndex = () => {
  const pc = getPineconeClient();
  return pc.index(process.env.PINECONE_INDEX_NAME);
};
```

---

## `utils/embedder.js` — Text to Vector

```javascript
import { pipeline } from "@xenova/transformers";

// Singleton pipeline — load model once, reuse across requests
let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("🔮 Loading embedding model...");
    embedder = await pipeline(
      "feature-extraction",
      process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model loaded");
  }
  return embedder;
};

// Convert text to a float32 vector
export const embedText = async (text) => {
  if (!text || !text.trim()) {
    throw new Error("Cannot embed empty text");
  }

  const model = await getEmbedder();

  // Truncate to 512 tokens (model limit)
  const truncated = text.slice(0, 2000);

  const output = await model(truncated, {
    pooling: "mean",
    normalize: true,
  });

  // Convert to plain array
  return Array.from(output.data);
};

// Embed multiple texts in batch
export const embedBatch = async (texts) => {
  const model = await getEmbedder();
  const results = [];

  for (const text of texts) {
    const output = await model(text.slice(0, 2000), {
      pooling: "mean",
      normalize: true,
    });
    results.push(Array.from(output.data));
  }

  return results;
};
```

---

## `services/memoryService.js` — Store and Retrieve Memories

This is the core service. Every other file calls into this.

```javascript
import { getPineconeIndex } from "../config/pinecone.js";
import { embedText } from "../utils/embedder.js";
import { v4 as uuidv4 } from "uuid";

// Memory types — what kind of memory is being stored
export const MEMORY_TYPES = {
  QUIZ_ANSWER: "quiz_answer",
  STORY_DECISION: "story_decision",
  DIARY_ENTRY: "diary_entry",        // Chat message
  MATCH_EVENT: "match_event",
};

// ─── STORE A MEMORY ──────────────────────────────────────────────────────────

/**
 * Store a piece of user memory in Pinecone
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} type - One of MEMORY_TYPES
 * @param {string} content - The raw text to embed and store
 * @param {Object} metadata - Extra data to store alongside the vector
 */
export const storeMemory = async (userId, type, content, metadata = {}) => {
  try {
    const index = getPineconeIndex();
    const vector = await embedText(content);

    const record = {
      id: `${userId}-${type}-${uuidv4()}`,
      values: vector,
      metadata: {
        userId: userId.toString(),
        type,
        content: content.slice(0, 1000), // Pinecone metadata limit
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    await index.upsert([record]);
    console.log(`🧠 Memory stored: [${type}] for user ${userId}`);
  } catch (err) {
    // Memory storage is non-critical — log and continue, never throw
    console.error(`Memory storage failed for user ${userId}:`, err.message);
  }
};

// ─── STORE MULTIPLE MEMORIES ─────────────────────────────────────────────────

export const storeMemories = async (userId, type, items) => {
  // items = [{ content, metadata }]
  for (const item of items) {
    await storeMemory(userId, type, item.content, item.metadata);
  }
};

// ─── RETRIEVE RELEVANT MEMORIES ──────────────────────────────────────────────

/**
 * Retrieve top-K memories most relevant to a query, for a specific user
 *
 * @param {string} userId
 * @param {string} query - The question or context to search against
 * @param {Object} options - { topK, types, minScore }
 * @returns {Array} Array of memory objects with content and metadata
 */
export const retrieveMemories = async (userId, query, options = {}) => {
  const {
    topK = 5,
    types = null,         // Filter by memory type(s) e.g. ['diary_entry']
    minScore = 0.5,       // Minimum cosine similarity threshold
  } = options;

  try {
    const index = getPineconeIndex();
    const queryVector = await embedText(query);

    // Build filter
    const filter = { userId: { $eq: userId.toString() } };
    if (types && types.length > 0) {
      filter.type = { $in: types };
    }

    const results = await index.query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata: true,
    });

    // Filter by minimum score and format
    return results.matches
      .filter((match) => match.score >= minScore)
      .map((match) => ({
        content: match.metadata.content,
        type: match.metadata.type,
        timestamp: match.metadata.timestamp,
        score: match.score,
        metadata: match.metadata,
      }));
  } catch (err) {
    console.error(`Memory retrieval failed for user ${userId}:`, err.message);
    return []; // Return empty array — AI call continues without memories
  }
};

// ─── RETRIEVE MEMORIES FOR TWO USERS (for match context) ─────────────────────

export const retrieveSharedMemories = async (userId1, userId2, query, topK = 4) => {
  const [memories1, memories2] = await Promise.all([
    retrieveMemories(userId1, query, { topK }),
    retrieveMemories(userId2, query, { topK }),
  ]);

  return { memories1, memories2 };
};

// ─── DELETE ALL MEMORIES FOR A USER ──────────────────────────────────────────

export const deleteUserMemories = async (userId) => {
  try {
    const index = getPineconeIndex();
    await index.deleteMany({ userId: { $eq: userId.toString() } });
    console.log(`🗑️ All memories deleted for user ${userId}`);
  } catch (err) {
    console.error(`Memory deletion failed:`, err.message);
  }
};
```

---

## `utils/memoryRetriever.js` — Format Context for Groq

This formats retrieved memories into clean prompt context strings.

```javascript
import { retrieveMemories, retrieveSharedMemories, MEMORY_TYPES } from "../services/memoryService.js";

// Format a list of memories into a readable context block for Groq
const formatMemories = (memories, label) => {
  if (!memories || memories.length === 0) return "";

  const lines = memories.map((m) => {
    const date = new Date(m.timestamp).toLocaleDateString();
    const typeLabel = {
      quiz_answer: "Quiz",
      story_decision: "Story Choice",
      diary_entry: "Diary Entry",
      match_event: "Match Event",
    }[m.type] || m.type;

    return `[${typeLabel} — ${date}]: "${m.content}"`;
  });

  return `\n${label}:\n${lines.join("\n")}`;
};

// ─── PERSONALITY INSIGHT CONTEXT ─────────────────────────────────────────────

export const getInsightContext = async (userId, supernaturalType) => {
  const query = `who am I, my personality, my values, what I feel deeply about as a ${supernaturalType}`;

  const memories = await retrieveMemories(userId, query, {
    topK: 6,
    types: [
      MEMORY_TYPES.QUIZ_ANSWER,
      MEMORY_TYPES.STORY_DECISION,
      MEMORY_TYPES.DIARY_ENTRY,
    ],
    minScore: 0.45,
  });

  return formatMemories(memories, "Memories the Oracle draws upon");
};

// ─── MATCH EXPLANATION CONTEXT ───────────────────────────────────────────────

export const getMatchContext = async (userId1, userId2) => {
  const query = "connection, love, loyalty, relationship, trust, emotion";

  const { memories1, memories2 } = await retrieveSharedMemories(
    userId1,
    userId2,
    query,
    4
  );

  const context1 = formatMemories(memories1, "Being 1's Memories");
  const context2 = formatMemories(memories2, "Being 2's Memories");

  return `${context1}\n${context2}`;
};

// ─── BATTLE RESULT CONTEXT ───────────────────────────────────────────────────

export const getBattleContext = async (userId1, userId2, scenario) => {
  const { memories1, memories2 } = await retrieveSharedMemories(
    userId1,
    userId2,
    scenario,
    3
  );

  const context1 = formatMemories(memories1, "Being 1's Past Choices");
  const context2 = formatMemories(memories2, "Being 2's Past Choices");

  return `${context1}\n${context2}`;
};
```

---

## Modified: `controllers/quizController.js`

Add memory storage after quiz submission. Find the `submitQuiz` handler and
add the following **after** `user.save()`:

```javascript
// ADD THIS import at the top of quizController.js
import { storeMemories, MEMORY_TYPES } from "../services/memoryService.js";

// ADD THIS after user.save() inside submitQuiz:

// Store each quiz answer as a memory (fire-and-forget)
const memoriesToStore = answers.map((answer) => {
  const question = questions.find((q) => q.id === answer.questionId);
  if (!question) return null;

  const selectedOption = question.options[answer.optionIndex];
  if (!selectedOption) return null;

  return {
    content: `Question: "${question.question}" — I chose: "${selectedOption.text}"`,
    metadata: {
      questionId: answer.questionId,
      optionIndex: answer.optionIndex,
      archetype,
    },
  };
}).filter(Boolean);

// Non-blocking — don't await, let it run in background
storeMemories(user._id, MEMORY_TYPES.QUIZ_ANSWER, memoriesToStore).catch(
  (err) => console.error("Quiz memory storage failed:", err)
);
```

---

## Modified: `controllers/storyController.js`

Add memory storage after each story decision. Find the `submitDecision`
handler and add the following **after** `await user.save()`:

```javascript
// ADD THIS import at the top of storyController.js
import { storeMemory, MEMORY_TYPES } from "../services/memoryService.js";

// ADD THIS after user.save() inside submitDecision:

// Store decision as a memory (fire-and-forget)
const memoryContent = `Story prompt: "${foundDecision.prompt}" — I chose: "${selectedChoice.text}". What followed: "${selectedChoice.consequence}"`;

storeMemory(user._id, MEMORY_TYPES.STORY_DECISION, memoryContent, {
  chapter: chapterNumber,
  decisionId,
  choiceIndex,
}).catch((err) => console.error("Story memory storage failed:", err));
```

---

## Modified: `controllers/chatController.js`

Add memory storage when a message is sent via REST. Find the `sendMessage`
handler and add after the message is created:

```javascript
// ADD THIS import at the top of chatController.js
import { storeMemory, MEMORY_TYPES } from "../services/memoryService.js";

// ADD THIS after const populated = await message.populate(...)

// Store diary entry as a memory (fire-and-forget)
storeMemory(
  req.user._id,
  MEMORY_TYPES.DIARY_ENTRY,
  content.trim(),
  { chatId: chatId.toString() }
).catch((err) => console.error("Diary memory storage failed:", err));
```

---

## Modified: `socket/socketHandler.js`

Add memory storage when a message is sent via socket. Find the
`send_message` handler and add after `io.to(chatId).emit("receive_message", populated)`:

```javascript
// ADD THIS import at the top of socketHandler.js
import { storeMemory, MEMORY_TYPES } from "../services/memoryService.js";

// ADD THIS after the io.to(chatId).emit inside send_message handler:

// Store diary entry as memory (fire-and-forget)
storeMemory(
  socket.user._id,
  MEMORY_TYPES.DIARY_ENTRY,
  content.trim(),
  { chatId }
).catch((err) => console.error("Socket diary memory storage failed:", err));
```

---

## Modified: `controllers/aiController.js`

This is the most important change. Retrieve memories before every Groq call
and inject them as context. Replace the full `aiController.js` with:

```javascript
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Match from "../models/Match.js";
import {
  generatePersonalityInsight,
  generateMatchExplanation,
  generateBattleResult,
} from "../utils/groqClient.js";
import {
  getInsightContext,
  getMatchContext,
  getBattleContext,
} from "../utils/memoryRetriever.js";

// @desc    Generate personality insight with RAG context
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

  // ✨ RAG: Retrieve relevant memories before calling Groq
  const memoryContext = await getInsightContext(
    user._id,
    user.supernaturalType
  );

  // Pass memory context to Groq
  const insight = await generatePersonalityInsight(user, memoryContext);

  res.json({ success: true, insight });
});

// @desc    Generate match explanation with RAG context
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

  const isParticipant =
    match.user1._id.toString() === req.user._id.toString() ||
    match.user2._id.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorised");
  }

  // Return cached if exists
  if (match.matchExplanation) {
    return res.json({
      success: true,
      explanation: JSON.parse(match.matchExplanation),
      cached: true,
    });
  }

  // ✨ RAG: Retrieve memories for both users
  const memoryContext = await getMatchContext(
    match.user1._id,
    match.user2._id
  );

  const explanation = await generateMatchExplanation(
    match.user1,
    match.user2,
    match.compatibilityScore,
    match.compatibilityLabel,
    memoryContext  // ← injected
  );

  match.matchExplanation = JSON.stringify(explanation);
  await match.save();

  res.json({ success: true, explanation, cached: false });
});

// @desc    Generate Battle Mode result with RAG context
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

  // ✨ RAG: Retrieve past choices relevant to this scenario
  const memoryContext = await getBattleContext(user1Id, user2Id, scenario);

  const result = await generateBattleResult(
    user1,
    user2,
    scenario,
    answer1,
    answer2,
    memoryContext  // ← injected
  );

  res.json({ success: true, result });
});
```

---

## Modified: `utils/groqClient.js`

Update all three Groq functions to accept and use `memoryContext`.

### `generatePersonalityInsight` — add `memoryContext` param

```javascript
export const generatePersonalityInsight = async (user, memoryContext = "") => {
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
${memoryContext ? `\n${memoryContext}\n` : ""}
Use the memories above (if any) to make your reading specific and personal.
Reference actual things they said or chose — not generic archetype descriptions.

Return this exact JSON structure:
{
  "summary": "2-3 sentence poetic description referencing their actual memories if available",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "idealPartner": "1-2 sentences referencing patterns from their actual choices",
  "powerPhrase": "One iconic line that captures their essence (under 15 words)"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle in The Vampire Diaries. You have access to this being's actual memories and past choices. Use them. Speak specifically, not generically. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 700,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  if (!parsed) throw new Error("Failed to parse AI insight response");
  return parsed;
};
```

### `generateMatchExplanation` — add `memoryContext` param

```javascript
export const generateMatchExplanation = async (
  user1,
  user2,
  compatibilityScore,
  compatibilityLabel,
  memoryContext = ""
) => {
  const prompt = `
You are an ancient oracle in the world of The Vampire Diaries.
Explain the supernatural connection between two beings. Return ONLY a JSON object.

Being 1: ${user1.name} (${user1.supernaturalType})
Traits: Loyalty ${user1.personalityTraits.loyalty.toFixed(1)}, Empathy ${user1.personalityTraits.empathy.toFixed(1)}, Dominance ${user1.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user1.personalityTraits.emotionalDepth.toFixed(1)}

Being 2: ${user2.name} (${user2.supernaturalType})
Traits: Loyalty ${user2.personalityTraits.loyalty.toFixed(1)}, Empathy ${user2.personalityTraits.empathy.toFixed(1)}, Dominance ${user2.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user2.personalityTraits.emotionalDepth.toFixed(1)}

Compatibility: ${compatibilityScore}% — "${compatibilityLabel}"
${memoryContext ? `\nMemories from both beings:\n${memoryContext}\n` : ""}
Use these memories to find specific echoes — moments where they made similar
or complementary choices without knowing it. Reference real things they said.

Return this exact JSON:
{
  "explanation": "2-3 sentences referencing actual memories or choices they share",
  "tension": "1 sentence about a real difference or conflict point from their histories",
  "potential": "1 sentence about what they could become based on who they've shown themselves to be"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle who reads the histories of supernatural beings. Reference specific memories when available. Speak in patterns and echoes — what did they each choose when tested? Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  if (!parsed) throw new Error("Failed to parse match explanation response");
  return parsed;
};
```

### `generateBattleResult` — add `memoryContext` param

```javascript
export const generateBattleResult = async (
  user1,
  user2,
  scenario,
  answer1,
  answer2,
  memoryContext = ""
) => {
  const prompt = `
You are an oracle analyzing supernatural chemistry.
Two beings answered the same scenario. Compare their responses — and their histories.
Return ONLY a JSON object.

Scenario: "${scenario}"

${user1.name} (${user1.supernaturalType}) answered: "${answer1}"
${user2.name} (${user2.supernaturalType}) answered: "${answer2}"
${memoryContext ? `\nTheir histories:\n${memoryContext}\n` : ""}
Consider not just what they said now, but what they've chosen before.
Are these answers consistent with their past? Do they surprise you?

Return this exact JSON:
{
  "chemistryScore": <number 0-100>,
  "chemistryLabel": "<one of: Magnetic, Kindred, Volatile, Neutral, Transcendent>",
  "analysis": "2-3 sentences comparing answers AND patterns from their histories",
  "agreementAreas": ["area 1", "area 2"],
  "tensionAreas": ["tension 1"],
  "verdict": "One dramatic sentence referencing who they've shown themselves to be"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle with memory. You know what these beings have chosen before. Use that knowledge. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 600,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);
  if (!parsed) throw new Error("Failed to parse battle result response");
  return parsed;
};
```

---

## Memory Storage Trigger Map

This is the complete picture of when memories get stored:

| Trigger | Controller / File | Memory Type | Content Stored |
|---|---|---|---|
| Quiz submitted | `quizController.js` | `quiz_answer` | Question + chosen answer text |
| Story decision | `storyController.js` | `story_decision` | Prompt + chosen text + consequence |
| REST chat message | `chatController.js` | `diary_entry` | Message content |
| Socket chat message | `socketHandler.js` | `diary_entry` | Message content |

---

## Memory Retrieval Trigger Map

| Groq Call | Retriever Function | Memory Types Searched | Query Used |
|---|---|---|---|
| Personality Insight | `getInsightContext` | quiz, story, diary | User's archetype + personality |
| Match Explanation | `getMatchContext` | quiz, story, diary (both users) | Love, loyalty, connection |
| Battle Result | `getBattleContext` | quiz, story, diary (both users) | The battle scenario text |

---

## Important Implementation Notes for Cursor

1. **Memory storage is always fire-and-forget.** Never `await` a `storeMemory`
   call in a request handler. Always use `.catch()` to swallow errors silently.
   Memory storage failing must never break the main user flow.

2. **Memory retrieval can fail gracefully.** If Pinecone is unreachable,
   `retrieveMemories` returns `[]`. Groq calls still proceed — just without
   memory context. The app degrades gracefully, not catastrophically.

3. **Embedder loads once.** The `@xenova/transformers` model is loaded once
   into memory when the server starts (first request triggers it). Subsequent
   calls reuse the same pipeline instance. This means the first embedding
   request after server start will be slow (~2-3s). All subsequent ones are
   fast (~100ms).

4. **Pinecone free tier limits.** 100k vectors total. Each user generates
   roughly 15 (quiz) + 15 (story) + N (chat) vectors. For a portfolio project
   this is far more than enough. Implement a simple cleanup if needed.

5. **Never expose raw vector data to the client.** The frontend never knows
   Pinecone exists. It calls the same `/api/ai/*` endpoints as before. The
   richer responses are the only visible change.

6. **UUID dependency.** `memoryService.js` uses `uuidv4` for generating
   unique Pinecone record IDs. Install if not already present:
   ```bash
   npm install uuid
   ```

7. **Model download.** First run of `@xenova/transformers` downloads the
   `all-MiniLM-L6-v2` model (~90MB) to a local cache. This happens once.
   Add the cache directory to `.gitignore`:
   ```
   .cache/
   ```

---

## Testing Checklist

### Setup
- [ ] `npm run setup:pinecone` runs without error
- [ ] Pinecone dashboard shows index `mysticmatch-memories` created
- [ ] Server starts and embedding model loads on first request (check logs)

### Memory Storage
- [ ] Submit quiz → Pinecone dashboard shows 15 new vectors for that userId
- [ ] Submit story decision → new vector appears in Pinecone
- [ ] Send chat message via REST → new vector appears
- [ ] Send chat message via socket → new vector appears
- [ ] Memory storage failure (e.g. bad API key) does NOT crash the request

### Memory Retrieval
- [ ] `GET /api/ai/insights/:userId` after quiz+story → response references actual choices, not generic text
- [ ] `POST /api/ai/match-explanation` after both users have chat history → response references specific diary entries
- [ ] `POST /api/ai/battle-result` → verdict references past choices, not just current answers
- [ ] If Pinecone is unreachable → AI endpoints still return responses (without memory context)

### Quality Check (Manual)
- [ ] Personality insight for a user with no memories reads like Phase 6 (generic but correct)
- [ ] Personality insight for a user WITH memories reads specifically — references real things they said
- [ ] Match explanation references at least one specific shared pattern between two users

---

## ✅ Phase 7 Complete When

- Pinecone index created and accepting vectors
- All 4 memory triggers store vectors correctly
- All 3 Groq calls retrieve and inject memory context
- AI responses are visibly more personal and specific for users with history
- Memory failures degrade gracefully without breaking any user flow
- No frontend changes required — same endpoints, richer responses

---

## What This Means for Your Portfolio

Being able to say:

> *"I implemented a RAG pipeline using Pinecone and local sentence embeddings
> that gives the AI real episodic memory of each user's choices — so instead
> of generic personality summaries, the oracle references actual things the
> user said and decided throughout their journey in the app."*

...is a fundamentally different conversation than "I integrated the Groq API."

This is a production AI architecture pattern used at scale. You've built it
into a dating app. That's genuinely impressive. 🧛