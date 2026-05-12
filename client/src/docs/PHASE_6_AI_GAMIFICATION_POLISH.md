# Frontend Phase 6 — AI Insights, Gamification & Final Polish

## Overview

This is the final frontend phase. It layers in the Groq AI-powered features,
the full gamification system, Battle Mode UI, profile photo uploads, and
comprehensive UI polish across the entire app.

By the end of this phase, MysticMatch is a complete, portfolio-ready product.

> ⚠️ All previous frontend phases (1–5) must be complete.
> This phase calls Backend Phase 6 endpoints (Groq AI, Gamification, Cloudinary).

---

## Folder Structure Added in This Phase

```
client/src/
├── components/
│   ├── ai/
│   │   ├── PersonalityInsightCard.jsx     ← NEW
│   │   ├── MatchExplanationCard.jsx       ← NEW
│   │   └── InsightSkeleton.jsx            ← NEW
│   ├── battle/
│   │   ├── BattleRoom.jsx                 ← NEW
│   │   ├── BattleScenario.jsx             ← NEW
│   │   ├── BattleAnswerInput.jsx          ← NEW
│   │   └── BattleResult.jsx               ← NEW
│   ├── gamification/
│   │   ├── AchievementCard.jsx            ← NEW
│   │   ├── AchievementGrid.jsx            ← NEW
│   │   ├── StreakWidget.jsx               ← NEW
│   │   └── NewAchievementToast.jsx        ← NEW
│   ├── profile/
│   │   ├── ProfilePhotoUpload.jsx         ← NEW
│   │   └── DarkSideEditor.jsx             ← NEW (user writes their own dark side)
│   └── ui/
│       ├── GlitchReveal.jsx               ← NEW (dark side unlock animation)
│       └── ChemistryMeter.jsx             ← NEW (Battle Mode score bar)
├── pages/
│   ├── AchievementsPage.jsx               ← NEW
│   └── BattleModePage.jsx                 ← NEW
├── services/
│   ├── aiService.js                       ← NEW
│   └── gamificationService.js             ← NEW
└── store/
    └── gamificationStore.js               ← NEW
```

---

## Dependencies

```bash
npm install react-hot-toast react-dropzone
```

- `react-hot-toast` — for achievement unlock toasts and notifications
- `react-dropzone` — for drag-and-drop profile photo upload

---

## New Zustand Store

---

### `store/gamificationStore.js`

```javascript
import { create } from "zustand";
import { getAchievements, getStreak, updateStreak } from "../services/gamificationService";

const useGamificationStore = create((set, get) => ({
  achievements: {
    earned: [],
    locked: [],
    total: 0,
    earnedCount: 0,
  },
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: null,
  },
  newAchievements: [], // Achievements unlocked in current session
  loading: false,

  fetchAchievements: async (userId) => {
    set({ loading: true });
    try {
      const data = await getAchievements(userId);
      set({ achievements: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStreak: async (userId) => {
    try {
      const data = await getStreak(userId);
      set({ streak: data.streak });
    } catch (err) {
      console.error("Streak fetch failed:", err);
    }
  },

  updateDailyStreak: async () => {
    try {
      const data = await updateStreak();
      set({ streak: data.streak });

      if (data.newAchievements?.length > 0) {
        set({ newAchievements: data.newAchievements });
      }

      return data;
    } catch (err) {
      console.error("Streak update failed:", err);
    }
  },

  clearNewAchievements: () => set({ newAchievements: [] }),
}));

export default useGamificationStore;
```

---

## Services

---

### `services/aiService.js`

```javascript
import api from "./api"; // Your existing Axios instance

export const getPersonalityInsight = async (userId) => {
  const { data } = await api.get(`/ai/insights/${userId}`);
  return data.insight;
};

export const getMatchExplanation = async (matchId) => {
  const { data } = await api.post("/ai/match-explanation", { matchId });
  return data.explanation;
};

export const getBattleResult = async (payload) => {
  // payload: { matchId, scenario, answer1, answer2, user1Id, user2Id }
  const { data } = await api.post("/ai/battle-result", payload);
  return data.result;
};
```

---

### `services/gamificationService.js`

```javascript
import api from "./api";

export const getAchievements = async (userId) => {
  const { data } = await api.get(`/gamification/achievements/${userId}`);
  return data;
};

export const getStreak = async (userId) => {
  const { data } = await api.get(`/gamification/streak/${userId}`);
  return data;
};

export const updateStreak = async () => {
  const { data } = await api.post("/gamification/streak/update");
  return data;
};

export const checkAchievements = async () => {
  const { data } = await api.post("/gamification/check-achievements");
  return data;
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append("profilePhoto", file);
  const { data } = await api.post("/upload/profile-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
```

---

## Components

---

### `components/ai/InsightSkeleton.jsx`
> Shown while Groq API loads

```jsx
const InsightSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6 rounded-xl bg-surface border border-border">
    <div className="h-4 bg-border rounded w-3/4" />
    <div className="h-4 bg-border rounded w-full" />
    <div className="h-4 bg-border rounded w-5/6" />
    <div className="flex gap-2 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 bg-border rounded-full w-24" />
      ))}
    </div>
  </div>
);

export default InsightSkeleton;
```

---

### `components/ai/PersonalityInsightCard.jsx`

```jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPersonalityInsight } from "../../services/aiService";
import InsightSkeleton from "./InsightSkeleton";

const ARCHETYPE_COLOURS = {
  Vampire: "text-vampire border-vampire",
  Werewolf: "text-werewolf border-werewolf",
  Witch: "text-witch border-witch",
  Hybrid: "text-hybrid border-hybrid",
};

const PersonalityInsightCard = ({ userId, supernaturalType }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const data = await getPersonalityInsight(userId);
        setInsight(data);
      } catch (err) {
        setError("The oracle is silent. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsight();
  }, [userId]);

  const colourClass = ARCHETYPE_COLOURS[supernaturalType] || "text-text-primary border-border";

  if (loading) return <InsightSkeleton />;

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-surface border border-border text-text-secondary text-sm italic">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl bg-surface border ${colourClass} space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-text-primary">
          Oracle's Reading
        </h3>
        <span className={`text-xs px-3 py-1 rounded-full border ${colourClass} font-mono`}>
          {supernaturalType}
        </span>
      </div>

      {/* Power phrase */}
      {insight.powerPhrase && (
        <p className={`font-display text-sm italic ${colourClass.split(" ")[0]}`}>
          "{insight.powerPhrase}"
        </p>
      )}

      {/* Summary */}
      <p className="text-text-secondary text-sm leading-relaxed">
        {insight.summary}
      </p>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs text-accent hover:text-text-primary transition-colors"
      >
        {expanded ? "Conceal the truth ↑" : "Reveal more ↓"}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Strengths */}
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">
                Strengths
              </p>
              <ul className="space-y-1">
                {insight.strengths?.map((s, i) => (
                  <li key={i} className="text-sm text-text-primary flex gap-2">
                    <span className="text-accent">✦</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">
                Vulnerabilities
              </p>
              <ul className="space-y-1">
                {insight.weaknesses?.map((w, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-border">◆</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ideal partner */}
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">
                Ideal Match
              </p>
              <p className="text-sm text-text-primary italic">
                {insight.idealPartner}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PersonalityInsightCard;
```

---

### `components/ai/MatchExplanationCard.jsx`

```jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getMatchExplanation } from "../../services/aiService";
import InsightSkeleton from "./InsightSkeleton";

const MatchExplanationCard = ({ matchId, compatibilityScore, compatibilityLabel }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMatchExplanation(matchId);
        setExplanation(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [matchId]);

  if (loading) return <InsightSkeleton />;
  if (!explanation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl bg-surface border border-accent/30 space-y-4"
    >
      {/* Score header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-text-primary">Why You Match</h3>
        <div className="text-center">
          <span className="text-3xl font-display text-accent">
            {compatibilityScore}%
          </span>
          <p className="text-xs text-text-secondary">{compatibilityLabel}</p>
        </div>
      </div>

      {/* Oracle explanation */}
      <p className="text-text-secondary text-sm leading-relaxed italic">
        {explanation.explanation}
      </p>

      {/* Tension */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">
          The Tension
        </p>
        <p className="text-sm text-text-primary">{explanation.tension}</p>
      </div>

      {/* Potential */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">
          The Potential
        </p>
        <p className="text-sm text-accent italic">{explanation.potential}</p>
      </div>
    </motion.div>
  );
};

export default MatchExplanationCard;
```

---

### `components/ui/ChemistryMeter.jsx`

```jsx
import { motion } from "framer-motion";

const LABEL_COLOURS = {
  Transcendent: "#ffd700",
  Magnetic: "#c20045",
  Kindred: "#5c0a8a",
  Volatile: "#c45e00",
  Neutral: "#a07090",
};

const ChemistryMeter = ({ score, label }) => {
  const colour = LABEL_COLOURS[label] || "#c20045";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-secondary uppercase tracking-widest">
          Chemistry
        </span>
        <span className="font-display text-lg" style={{ color: colour }}>
          {label}
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-surface rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: colour }}
        />
      </div>

      <div className="flex justify-between text-xs text-text-secondary">
        <span>0</span>
        <span className="font-mono">{score}/100</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default ChemistryMeter;
```

---

### `components/battle/BattleRoom.jsx`

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BattleScenario from "./BattleScenario";
import BattleAnswerInput from "./BattleAnswerInput";
import BattleResult from "./BattleResult";
import { getBattleResult } from "../../services/aiService";

// Predefined battle scenarios
const SCENARIOS = [
  "Your coven is threatened. What is your first move?",
  "You discover your partner has been keeping a secret from you for months. How do you respond?",
  "You must choose between power and love. Which do you choose, and why?",
  "Someone from your past returns to Mystic Falls. What does that stir in you?",
  "You have one night left before everything changes. How do you spend it?",
];

const BattleRoom = ({ match, currentUser }) => {
  const [phase, setPhase] = useState("scenario"); // scenario | answering | waiting | result
  const [scenario, setScenario] = useState(() => {
    const idx = Math.floor(Math.random() * SCENARIOS.length);
    return SCENARIOS[idx];
  });
  const [myAnswer, setMyAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const otherUser =
    match.user1._id === currentUser._id ? match.user2 : match.user1;

  // In a real app, both answers would sync via socket.
  // For this implementation, we simulate with a single submit.
  const handleSubmitAnswers = async (answer1, answer2) => {
    setLoading(true);
    try {
      const data = await getBattleResult({
        matchId: match._id,
        scenario,
        answer1,
        answer2,
        user1Id: match.user1._id,
        user2Id: match.user2._id,
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      console.error("Battle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl text-text-primary">
          ⚔️ Compatibility Battle
        </h2>
        <p className="text-text-secondary text-sm">
          {currentUser.name} vs {otherUser.name}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "scenario" && (
          <BattleScenario
            key="scenario"
            scenario={scenario}
            onReady={() => setPhase("answering")}
          />
        )}

        {phase === "answering" && (
          <BattleAnswerInput
            key="answering"
            scenario={scenario}
            currentUser={currentUser}
            otherUser={otherUser}
            onSubmit={handleSubmitAnswers}
            loading={loading}
          />
        )}

        {phase === "result" && result && (
          <BattleResult
            key="result"
            result={result}
            scenario={scenario}
            user1={match.user1}
            user2={match.user2}
            onPlayAgain={() => {
              const idx = Math.floor(Math.random() * SCENARIOS.length);
              setScenario(SCENARIOS[idx]);
              setMyAnswer("");
              setResult(null);
              setPhase("scenario");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleRoom;
```

---

### `components/battle/BattleScenario.jsx`

```jsx
import { motion } from "framer-motion";

const BattleScenario = ({ scenario, onReady }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="text-center space-y-8 p-8 rounded-xl bg-surface border border-border"
  >
    <p className="text-xs text-text-secondary uppercase tracking-widest">
      The Scenario
    </p>
    <p className="font-display text-xl text-text-primary leading-relaxed">
      "{scenario}"
    </p>
    <p className="text-text-secondary text-sm">
      Both of you will answer this independently. The oracle will compare your responses.
    </p>
    <button
      onClick={onReady}
      className="px-8 py-3 bg-accent text-white font-display rounded-full hover:bg-accent/80 transition-colors"
    >
      I'm Ready
    </button>
  </motion.div>
);

export default BattleScenario;
```

---

### `components/battle/BattleAnswerInput.jsx`

```jsx
import { useState } from "react";
import { motion } from "framer-motion";

const BattleAnswerInput = ({ scenario, currentUser, otherUser, onSubmit, loading }) => {
  const [myAnswer, setMyAnswer] = useState("");
  // In a real-time version, otherAnswer would come via socket.
  // For MVP, we simulate the other user's answer.
  const [otherAnswer, setOtherAnswer] = useState("");
  const [mySubmitted, setMySubmitted] = useState(false);

  const handleMySubmit = () => {
    if (myAnswer.trim().length < 10) return;
    setMySubmitted(true);
  };

  const handleReveal = () => {
    if (!otherAnswer.trim()) return;
    onSubmit(myAnswer, otherAnswer);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Scenario reminder */}
      <p className="text-text-secondary text-sm italic text-center">
        "{scenario}"
      </p>

      {/* My answer */}
      <div className="space-y-2">
        <label className="text-xs text-text-secondary uppercase tracking-widest">
          Your Response — {currentUser.name}
        </label>
        <textarea
          value={myAnswer}
          onChange={(e) => setMyAnswer(e.target.value)}
          disabled={mySubmitted}
          placeholder="Speak your truth..."
          rows={4}
          className="w-full bg-bg-secondary border border-border rounded-xl p-4 text-text-primary text-sm resize-none focus:border-accent outline-none transition-colors disabled:opacity-60"
        />
        {!mySubmitted && (
          <button
            onClick={handleMySubmit}
            disabled={myAnswer.trim().length < 10}
            className="w-full py-2 bg-accent/20 border border-accent text-accent rounded-xl text-sm hover:bg-accent hover:text-white transition-all disabled:opacity-40"
          >
            Lock In My Answer
          </button>
        )}
        {mySubmitted && (
          <p className="text-xs text-accent text-center">
            ✓ Your answer is sealed
          </p>
        )}
      </div>

      {/* Other user's answer (MVP: manual input; prod: socket) */}
      {mySubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <label className="text-xs text-text-secondary uppercase tracking-widest">
            {otherUser.name}'s Response
          </label>
          <textarea
            value={otherAnswer}
            onChange={(e) => setOtherAnswer(e.target.value)}
            placeholder={`Enter ${otherUser.name}'s answer...`}
            rows={4}
            className="w-full bg-bg-secondary border border-border rounded-xl p-4 text-text-primary text-sm resize-none focus:border-accent outline-none transition-colors"
          />
          <button
            onClick={handleReveal}
            disabled={loading || otherAnswer.trim().length < 10}
            className="w-full py-3 bg-accent text-white font-display rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-40"
          >
            {loading ? "The oracle speaks..." : "Reveal Chemistry ⚡"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BattleAnswerInput;
```

---

### `components/battle/BattleResult.jsx`

```jsx
import { motion } from "framer-motion";
import ChemistryMeter from "../ui/ChemistryMeter";

const BattleResult = ({ result, scenario, user1, user2, onPlayAgain }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="space-y-6 p-6 rounded-xl bg-surface border border-accent/40"
  >
    {/* Chemistry meter */}
    <ChemistryMeter score={result.chemistryScore} label={result.chemistryLabel} />

    {/* Oracle analysis */}
    <div className="space-y-2">
      <p className="text-xs text-text-secondary uppercase tracking-widest">
        The Oracle's Reading
      </p>
      <p className="text-text-primary text-sm leading-relaxed italic">
        {result.analysis}
      </p>
    </div>

    {/* Agreement areas */}
    {result.agreementAreas?.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs text-text-secondary uppercase tracking-widest">
          Where You Align
        </p>
        <ul className="space-y-1">
          {result.agreementAreas.map((area, i) => (
            <li key={i} className="text-sm text-text-primary flex gap-2">
              <span className="text-accent">✦</span> {area}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Tension areas */}
    {result.tensionAreas?.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs text-text-secondary uppercase tracking-widest">
          Where You Clash
        </p>
        <ul className="space-y-1">
          {result.tensionAreas.map((area, i) => (
            <li key={i} className="text-sm text-text-secondary flex gap-2">
              <span className="text-border">◆</span> {area}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Verdict */}
    <div className="border-t border-border pt-4">
      <p className="text-accent font-display text-center text-sm italic">
        "{result.verdict}"
      </p>
    </div>

    {/* Play again */}
    <button
      onClick={onPlayAgain}
      className="w-full py-2 border border-border text-text-secondary rounded-xl text-sm hover:border-accent hover:text-accent transition-colors"
    >
      New Scenario ↺
    </button>
  </motion.div>
);

export default BattleResult;
```

---

### `components/gamification/NewAchievementToast.jsx`

```jsx
import toast from "react-hot-toast";
import { motion } from "framer-motion";

// Call this function whenever new achievements are detected
export const showAchievementToasts = (achievements) => {
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : 50, scale: t.visible ? 1 : 0.9 }}
            className="flex items-center gap-4 bg-surface border border-accent/50 rounded-xl px-5 py-4 shadow-2xl max-w-sm"
          >
            <span className="text-3xl">{achievement.icon}</span>
            <div>
              <p className="text-xs text-accent uppercase tracking-widest">
                Achievement Unlocked
              </p>
              <p className="text-text-primary font-display text-sm">
                {achievement.name}
              </p>
              <p className="text-text-secondary text-xs">{achievement.description}</p>
            </div>
          </motion.div>
        ),
        { duration: 5000, position: "bottom-right" }
      );
    }, index * 1000);
  });
};
```

---

### `components/gamification/StreakWidget.jsx`

```jsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import useGamificationStore from "../../store/gamificationStore";
import useAuthStore from "../../store/authStore";
import { showAchievementToasts } from "./NewAchievementToast";

const StreakWidget = () => {
  const { user } = useAuthStore();
  const { streak, fetchStreak, updateDailyStreak, newAchievements, clearNewAchievements } =
    useGamificationStore();

  useEffect(() => {
    if (user?._id) {
      fetchStreak(user._id);
      // Update streak on mount (daily login)
      updateDailyStreak();
    }
  }, [user?._id]);

  // Show achievement toasts when new ones unlock
  useEffect(() => {
    if (newAchievements.length > 0) {
      showAchievementToasts(newAchievements);
      clearNewAchievements();
    }
  }, [newAchievements]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl"
    >
      {/* Flame icon */}
      <div className="text-2xl">🔥</div>

      {/* Streak info */}
      <div>
        <p className="text-text-primary font-display text-lg leading-none">
          {streak.current}
          <span className="text-text-secondary text-sm font-body ml-1">
            day{streak.current !== 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-text-secondary text-xs">
          Longest: {streak.longest} days
        </p>
      </div>

      {/* Streak label */}
      {streak.current >= 7 && (
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/30">
          {streak.current >= 30 ? "Eternal 🧛" : streak.current >= 7 ? "Loyal 🔮" : ""}
        </span>
      )}
    </motion.div>
  );
};

export default StreakWidget;
```

---

### `components/gamification/AchievementCard.jsx`

```jsx
import { motion } from "framer-motion";

const AchievementCard = ({ achievement, locked = false, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`p-4 rounded-xl border transition-all ${
      locked
        ? "bg-bg-secondary border-border opacity-40 grayscale"
        : "bg-surface border-accent/30 hover:border-accent"
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-3xl">{achievement.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-display truncate">
          {achievement.name}
        </p>
        <p className="text-text-secondary text-xs leading-snug mt-0.5">
          {achievement.description}
        </p>
        {!locked && achievement.unlockedAt && (
          <p className="text-accent text-xs mt-1">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
        {locked && (
          <p className="text-text-secondary text-xs mt-1 italic">Locked</p>
        )}
      </div>
    </div>
  </motion.div>
);

export default AchievementCard;
```

---

### `components/gamification/AchievementGrid.jsx`

```jsx
import { useEffect } from "react";
import useGamificationStore from "../../store/gamificationStore";
import useAuthStore from "../../store/authStore";
import AchievementCard from "./AchievementCard";

const AchievementGrid = () => {
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, loading } = useGamificationStore();

  useEffect(() => {
    if (user?._id) fetchAchievements(user._id);
  }, [user?._id]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          {achievements.earnedCount} / {achievements.total} unlocked
        </p>
        <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{
              width: `${(achievements.earnedCount / achievements.total) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Earned */}
      {achievements.earned?.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">
            Earned
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.earned.map((a, i) => (
              <AchievementCard key={a._id} achievement={a} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {achievements.locked?.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-3">
            Locked
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.locked.map((a, i) => (
              <AchievementCard key={a.id} achievement={a} locked index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementGrid;
```

---

### `components/ui/GlitchReveal.jsx`
> Dark side unlock animation

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GlitchReveal = ({ onReveal, children }) => {
  const [phase, setPhase] = useState("locked"); // locked | glitching | revealed

  const handleUnlock = () => {
    setPhase("glitching");
    setTimeout(() => {
      setPhase("revealed");
      onReveal?.();
    }, 1200);
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {phase === "locked" && (
          <motion.div
            key="locked"
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-bg-primary/90 rounded-xl backdrop-blur-sm z-10"
          >
            <div className="text-center space-y-3">
              <p className="text-4xl">🔒</p>
              <p className="font-display text-text-primary text-sm">
                Dark Side Hidden
              </p>
              <button
                onClick={handleUnlock}
                className="px-6 py-2 bg-accent text-white text-sm rounded-full hover:bg-accent/80 transition-colors"
              >
                Lift the Veil
              </button>
            </div>
          </motion.div>
        )}

        {phase === "glitching" && (
          <motion.div
            key="glitch"
            initial={{ opacity: 1 }}
            animate={{
              opacity: [1, 0.3, 1, 0.5, 1],
              x: [0, -4, 4, -2, 0],
              filter: [
                "hue-rotate(0deg)",
                "hue-rotate(90deg)",
                "hue-rotate(180deg)",
                "hue-rotate(270deg)",
                "hue-rotate(0deg)",
              ],
            }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-accent/20 rounded-xl z-10 flex items-center justify-center"
          >
            <p className="font-display text-accent text-lg animate-pulse">
              Unveiling...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual content beneath */}
      <motion.div
        animate={{
          filter: phase === "revealed" ? "blur(0px)" : "blur(8px)",
          opacity: phase === "revealed" ? 1 : 0.3,
        }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default GlitchReveal;
```

---

### `components/profile/ProfilePhotoUpload.jsx`

```jsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { uploadProfilePhoto } from "../../services/gamificationService";
import useAuthStore from "../../store/authStore";

const ProfilePhotoUpload = ({ currentPhoto }) => {
  const { setUser } = useAuthStore();
  const [preview, setPreview] = useState(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError(null);
    setUploading(true);

    try {
      const data = await uploadProfilePhoto(file);
      // Update auth store with new photo URL
      setUser((prev) => ({ ...prev, profilePhoto: data.profilePhoto }));
    } catch (err) {
      setError("Upload failed. Please try again.");
      setPreview(currentPhoto);
    } finally {
      setUploading(false);
    }
  }, [currentPhoto]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative w-32 h-32 rounded-full overflow-hidden border-2 cursor-pointer transition-all mx-auto ${
          isDragActive ? "border-accent" : "border-border hover:border-accent/50"
        }`}
      >
        <input {...getInputProps()} />

        {/* Current photo */}
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center">
            <span className="text-text-secondary text-4xl">👤</span>
          </div>
        )}

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {uploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
            />
          ) : (
            <span className="text-white text-xs text-center">
              {isDragActive ? "Drop it" : "Change"}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-accent text-xs text-center">{error}</p>
      )}

      <p className="text-text-secondary text-xs text-center">
        JPG, PNG or WebP · Max 5MB
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;
```

---

### `components/profile/DarkSideEditor.jsx`
> User writes their own dark side profile during setup

```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";

const DarkSideEditor = ({ initialData, onSave }) => {
  const [secret, setSecret] = useState(initialData?.secret || "");
  const [originStory, setOriginStory] = useState(initialData?.originStory || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me/dark-side", { secret, originStory });
      setSaved(true);
      onSave?.({ secret, originStory });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save dark side profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 p-6 rounded-xl bg-surface border border-border"
    >
      <div className="space-y-1">
        <h3 className="font-display text-text-primary">Your Dark Side</h3>
        <p className="text-text-secondary text-xs">
          Revealed only after a mutual match. Be honest. Be dark.
        </p>
      </div>

      {/* Secret */}
      <div className="space-y-2">
        <label className="text-xs text-text-secondary uppercase tracking-widest">
          Your Darkest Secret
        </label>
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Something you've never told anyone..."
          rows={3}
          maxLength={300}
          className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-text-primary text-sm resize-none focus:border-accent outline-none transition-colors"
        />
        <p className="text-right text-xs text-text-secondary">
          {secret.length}/300
        </p>
      </div>

      {/* Origin story */}
      <div className="space-y-2">
        <label className="text-xs text-text-secondary uppercase tracking-widest">
          Your Origin Story
        </label>
        <textarea
          value={originStory}
          onChange={(e) => setOriginStory(e.target.value)}
          placeholder="What made you who you are in this world..."
          rows={4}
          maxLength={500}
          className="w-full bg-bg-secondary border border-border rounded-xl p-3 text-text-primary text-sm resize-none focus:border-accent outline-none transition-colors"
        />
        <p className="text-right text-xs text-text-secondary">
          {originStory.length}/500
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !secret.trim() || !originStory.trim()}
        className="w-full py-3 bg-accent text-white font-display rounded-xl hover:bg-accent/80 transition-colors disabled:opacity-40"
      >
        {saving ? "Sealing..." : saved ? "✓ Sealed in darkness" : "Seal My Dark Side"}
      </button>
    </motion.div>
  );
};

export default DarkSideEditor;
```

---

## Pages

---

### `pages/AchievementsPage.jsx`

```jsx
import { motion } from "framer-motion";
import AchievementGrid from "../components/gamification/AchievementGrid";
import StreakWidget from "../components/gamification/StreakWidget";

const AchievementsPage = () => (
  <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
    {/* Header */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      <h1 className="font-display text-3xl text-text-primary">Legacy</h1>
      <p className="text-text-secondary text-sm">
        The marks you leave on Mystic Falls
      </p>
    </motion.div>

    {/* Streak */}
    <div className="space-y-2">
      <p className="text-xs text-text-secondary uppercase tracking-widest">
        Current Streak
      </p>
      <StreakWidget />
    </div>

    {/* Achievements */}
    <div className="space-y-2">
      <p className="text-xs text-text-secondary uppercase tracking-widest">
        Achievements
      </p>
      <AchievementGrid />
    </div>
  </div>
);

export default AchievementsPage;
```

---

### `pages/BattleModePage.jsx`

```jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import BattleRoom from "../components/battle/BattleRoom";
import useAuthStore from "../store/authStore";
import api from "../services/api";

const BattleModePage = () => {
  const { matchId } = useParams();
  const { user } = useAuthStore();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const { data } = await api.get(`/matches/${matchId}`);
        setMatch(data.match);
      } catch (err) {
        console.error("Match not found:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-display text-text-secondary animate-pulse">
          Summoning the arena...
        </p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Match not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <BattleRoom match={match} currentUser={user} />
    </div>
  );
};

export default BattleModePage;
```

---

## Integration Points — Where Phase 6 Components Slot In

### On `ProfilePage.jsx` (Phase 4)
```jsx
// Add these inside the profile page:
import PersonalityInsightCard from "../components/ai/PersonalityInsightCard";
import ProfilePhotoUpload from "../components/profile/ProfilePhotoUpload";
import DarkSideEditor from "../components/profile/DarkSideEditor";

// Inside JSX:
<ProfilePhotoUpload currentPhoto={user.profilePhoto} />
<PersonalityInsightCard userId={user._id} supernaturalType={user.supernaturalType} />
<DarkSideEditor initialData={user.darkSideProfile} />
```

### On Match Detail Page (Phase 4)
```jsx
import MatchExplanationCard from "../components/ai/MatchExplanationCard";
import { Link } from "react-router-dom";

// Inside JSX:
<MatchExplanationCard
  matchId={match._id}
  compatibilityScore={match.compatibilityScore}
  compatibilityLabel={match.compatibilityLabel}
/>
<Link to={`/battle/${match._id}`}>
  <button className="w-full py-3 border border-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-colors">
    ⚔️ Start Compatibility Battle
  </button>
</Link>
```

### On `Dashboard.jsx` (Phase 4)
```jsx
import StreakWidget from "../components/gamification/StreakWidget";

// Add to dashboard sidebar or top bar:
<StreakWidget />
```

---

## Add Routes in `App.jsx`

```jsx
import AchievementsPage from "./pages/AchievementsPage";
import BattleModePage from "./pages/BattleModePage";

// Inside your router:
<Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
<Route path="/battle/:matchId" element={<ProtectedRoute><BattleModePage /></ProtectedRoute>} />
```

---

## Add to Navigation

```jsx
// In your main nav component:
{ path: "/achievements", label: "Legacy", icon: "🏆" }
```

---

## Setup `react-hot-toast` in `App.jsx`

```jsx
import { Toaster } from "react-hot-toast";

// Inside your App return:
<Toaster
  position="bottom-right"
  toastOptions={{
    style: {
      background: "transparent",
      boxShadow: "none",
      padding: 0,
    },
  }}
/>
```

---

## Backend Endpoint Added — Dark Side Save

Add this to `server/controllers/authController.js`:

```javascript
// @desc    Update dark side profile
// @route   PATCH /api/auth/me/dark-side
// @access  Private
export const updateDarkSide = asyncHandler(async (req, res) => {
  const { secret, originStory } = req.body;
  const user = await User.findById(req.user._id);
  user.darkSideProfile = { secret, originStory };
  await user.save();
  res.json({ success: true, darkSideProfile: user.darkSideProfile });
});
```

And in `authRoutes.js`:
```javascript
router.patch("/me/dark-side", protect, updateDarkSide);
```

---

## Tailwind Custom Classes Needed

Add to your `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      "bg-primary": "#0a0005",
      "bg-secondary": "#12000a",
      surface: "#1a0010",
      border: "#3d0020",
      vampire: "#8b0000",
      werewolf: "#c45e00",
      witch: "#5c0a8a",
      hybrid: "#8a7000",
      "text-primary": "#f0dce8",
      "text-secondary": "#a07090",
      accent: "#c20045",
    },
    fontFamily: {
      display: ["Cinzel Decorative", "serif"],
      body: ["EB Garamond", "serif"],
      mono: ["Courier Prime", "monospace"],
    },
  },
},
```

---

## Testing Checklist

### AI Features
- [ ] Personality insight loads on profile page with all fields (summary, strengths, weaknesses, idealPartner, powerPhrase)
- [ ] Loading skeleton shows while Groq API responds
- [ ] Expand/collapse toggle works on insight card
- [ ] Match explanation loads on match detail page
- [ ] Cached explanation loads instantly on second visit
- [ ] Battle Mode cycles through scenarios correctly
- [ ] Battle result shows chemistry score, analysis, verdict
- [ ] ChemistryMeter bar animates to correct width

### Gamification
- [ ] Streak widget shows current streak and longest streak
- [ ] Streak increments on daily visit
- [ ] Streak does NOT double-increment on same day
- [ ] Streak resets to 1 after 2+ day gap
- [ ] Achievement grid shows earned vs locked correctly
- [ ] Progress bar fills based on earned/total ratio
- [ ] Toast notification appears when new achievement unlocked
- [ ] Toast shows correct icon, name, and description

### Profile & Upload
- [ ] Profile photo upload via dropzone works
- [ ] Drag-and-drop onto the avatar circle works
- [ ] Preview updates immediately after file selected
- [ ] Cloudinary URL saved and shown on refresh
- [ ] Files over 5MB rejected with error message
- [ ] Dark side editor saves secret + origin story
- [ ] GlitchReveal animation plays on dark side unlock
- [ ] Content reveals after animation completes

### Routing
- [ ] `/achievements` page loads and is protected
- [ ] `/battle/:matchId` page loads with correct match data
- [ ] Battle Mode link on match detail page navigates correctly

---

## ✅ Phase 6 Complete When

- AI insight card renders on profile with full Groq response
- Match explanation renders on match detail page (with cache)
- Battle Mode full flow works: scenario → answers → chemistry result
- Achievements page shows earned and locked badges correctly
- Streak updates daily and triggers badge toasts
- Profile photo uploads to Cloudinary and persists
- Dark side editor saves and GlitchReveal animation works
- react-hot-toast configured and achievement toasts fire
- All new routes are protected and accessible via navigation

---

## 🎉 Frontend Complete

All 6 frontend phases done means MysticMatch is fully built:

- ✅ Phase 1 — Setup + Auth UI
- ✅ Phase 2 — Quiz + Archetype Reveal
- ✅ Phase 3 — Story Mode UI
- ✅ Phase 4 — Dashboard + Matching
- ✅ Phase 5 — Chat UI + Sockets
- ✅ Phase 6 — AI Insights + Gamification + Polish

**MysticMatch is ready. Welcome to Mystic Falls. 🧛**