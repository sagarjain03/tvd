# Frontend Phase 3 — Story Mode UI (Interactive Narrative)

## Overview

This phase builds the immersive story experience. Users navigate 3 chapters
of branching narrative set in Mystic Falls. Each decision is presented
dramatically with atmospheric text, animated transitions, and a consequence
reveal after each choice. Chapter progress is tracked and saved via API.

> ⚠️ Phase 2 must be complete. The story page is only reachable after
> quiz completion. Story decisions are submitted to `/api/story/decision`.

---

## Folder Structure Added in This Phase

```
client/src/
├── components/
│   └── story/
│       ├── ChapterIntro.jsx        ← Full-screen chapter opening
│       ├── DecisionCard.jsx        ← Decision prompt + choices
│       ├── ChoiceButton.jsx        ← Individual choice button
│       ├── ConsequenceReveal.jsx   ← Post-decision consequence screen
│       └── StoryProgress.jsx       ← Chapter/decision tracker
├── pages/
│   └── onboarding/
│       ├── Story.jsx               ← Main story orchestrator
│       └── StoryComplete.jsx       ← Completion screen → dashboard
├── store/
│   └── storyStore.js
├── services/
│   └── storyService.js
```

---

## `src/store/storyStore.js`

```javascript
import { create } from "zustand";

export const useStoryStore = create((set, get) => ({
  chapter: null,           // Current chapter data from API
  currentDecisionIndex: 0, // Which decision in the chapter we're on
  completedDecisions: [],  // [{ decisionId, choiceIndex, consequence }]
  storyProgress: null,     // { currentChapter, completed }
  isLoading: false,
  isSubmitting: false,
  showConsequence: false,
  lastConsequence: null,
  error: null,

  setChapter: (chapter) => set({ chapter, currentDecisionIndex: 0 }),
  setStoryProgress: (progress) => set({ storyProgress: progress }),
  setLoading: (isLoading) => set({ isLoading }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  recordDecision: (decisionId, choiceIndex, consequence) => {
    set((state) => ({
      completedDecisions: [
        ...state.completedDecisions,
        { decisionId, choiceIndex, consequence },
      ],
      showConsequence: true,
      lastConsequence: consequence,
    }));
  },

  advanceDecision: () => {
    set((state) => ({
      showConsequence: false,
      lastConsequence: null,
      currentDecisionIndex: state.currentDecisionIndex + 1,
    }));
  },

  setError: (error) => set({ error }),
}));
```

---

## `src/services/storyService.js`

```javascript
import api from "./api";

export const fetchChapter = async (chapterId) => {
  const { data } = await api.get(`/story/chapter/${chapterId}`);
  return data.chapter;
};

export const submitDecision = async (decisionId, choiceIndex) => {
  const { data } = await api.post("/story/decision", { decisionId, choiceIndex });
  return data; // { decision, consequence, storyProgress }
};

export const fetchStoryProgress = async (userId) => {
  const { data } = await api.get(`/story/progress/${userId}`);
  return data;
};
```

---

## `src/pages/onboarding/Story.jsx` — Main Orchestrator

```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStoryStore } from "../../store/storyStore";
import { useAuthStore } from "../../store/authStore";
import { fetchChapter, submitDecision } from "../../services/storyService";
import ChapterIntro from "../../components/story/ChapterIntro";
import DecisionCard from "../../components/story/DecisionCard";
import ConsequenceReveal from "../../components/story/ConsequenceReveal";
import StoryProgress from "../../components/story/StoryProgress";
import Spinner from "../../components/ui/Spinner";

const Story = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const {
    chapter,
    currentDecisionIndex,
    storyProgress,
    isLoading,
    isSubmitting,
    showConsequence,
    lastConsequence,
    setChapter,
    setStoryProgress,
    setLoading,
    setSubmitting,
    recordDecision,
    advanceDecision,
  } = useStoryStore();

  const [showIntro, setShowIntro] = useState(true);
  const [chapterNum, setChapterNum] = useState(
    user?.storyProgress?.currentChapter || 1
  );

  // Load chapter
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ch = await fetchChapter(chapterNum);
        setChapter(ch);
        setShowIntro(true);
      } catch (err) {
        console.error("Failed to load chapter", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterNum]);

  const handleChoice = async (decision, choiceIndex) => {
    setSubmitting(true);
    try {
      const result = await submitDecision(decision.id, choiceIndex);
      recordDecision(decision.id, choiceIndex, result.consequence);
      setStoryProgress(result.storyProgress);

      if (result.storyProgress.completed) {
        updateUser({ storyProgress: { completed: true, currentChapter: 3 } });
      }
    } catch (err) {
      console.error("Failed to submit decision", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConsequenceContinue = () => {
    if (!chapter) return;
    const isLastDecision = currentDecisionIndex >= chapter.decisions.length - 1;

    if (isLastDecision) {
      if (chapterNum < 3) {
        // Advance to next chapter
        setChapterNum((n) => n + 1);
      } else {
        // Story complete
        navigate("/onboarding/complete");
      }
    } else {
      advanceDecision();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-text-secondary font-body italic mt-4">
            Mystic Falls awaits…
          </p>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  const currentDecision = chapter.decisions[currentDecisionIndex];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Story progress indicator */}
      {!showIntro && (
        <StoryProgress
          chapterNum={chapterNum}
          decisionIndex={currentDecisionIndex}
          totalDecisions={chapter.decisions.length}
        />
      )}

      <AnimatePresence mode="wait">
        {/* Chapter intro screen */}
        {showIntro && (
          <ChapterIntro
            key={`intro-${chapterNum}`}
            chapter={chapter}
            onBegin={() => setShowIntro(false)}
          />
        )}

        {/* Consequence reveal */}
        {!showIntro && showConsequence && (
          <ConsequenceReveal
            key="consequence"
            text={lastConsequence}
            onContinue={handleConsequenceContinue}
          />
        )}

        {/* Decision card */}
        {!showIntro && !showConsequence && currentDecision && (
          <DecisionCard
            key={currentDecision.id}
            decision={currentDecision}
            decisionNumber={currentDecisionIndex + 1}
            chapterNum={chapterNum}
            onChoose={handleChoice}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Story;
```

---

## `src/components/story/ChapterIntro.jsx`

```jsx
import { motion } from "framer-motion";

const CHAPTER_ATMOSPHERES = {
  1: {
    subtitle: "Chapter One",
    mood: "The night is young. Mystic Falls is full of secrets.",
    accent: "#8b0000",
  },
  2: {
    subtitle: "Chapter Two",
    mood: "The truth begins to surface. Nothing is what it seemed.",
    accent: "#5c0a8a",
  },
  3: {
    subtitle: "Chapter Three",
    mood: "This is the moment. Who you truly are will be revealed.",
    accent: "#c20045",
  },
};

const ChapterIntro = ({ chapter, onBegin }) => {
  const atmos = CHAPTER_ATMOSPHERES[chapter.chapter] || CHAPTER_ATMOSPHERES[1];

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.8 }}
    >
      {/* Atmospheric background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${atmos.accent}15 0%, transparent 70%)`,
        }}
      />

      {/* Chapter number */}
      <motion.p
        className="font-mono text-xs text-text-muted tracking-[0.4em] uppercase mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        ◆ {atmos.subtitle} ◆
      </motion.p>

      {/* Chapter title */}
      <motion.h1
        className="font-display text-4xl md:text-6xl text-text-primary mb-6 leading-tight max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {chapter.title}
      </motion.h1>

      {/* Mood line */}
      <motion.p
        className="font-mono text-xs text-text-muted tracking-widest mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {atmos.mood}
      </motion.p>

      {/* Chapter intro text */}
      <motion.p
        className="font-body text-text-secondary text-lg italic leading-relaxed max-w-xl mb-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {chapter.intro}
      </motion.p>

      {/* Begin button */}
      <motion.button
        onClick={onBegin}
        className="px-12 py-4 border border-border-default text-text-primary font-display text-sm tracking-widest uppercase hover:border-accent hover:text-accent transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Begin
      </motion.button>
    </motion.div>
  );
};

export default ChapterIntro;
```

---

## `src/components/story/DecisionCard.jsx`

```jsx
import { motion } from "framer-motion";
import ChoiceButton from "./ChoiceButton";

const DecisionCard = ({
  decision,
  decisionNumber,
  chapterNum,
  onChoose,
  isSubmitting,
}) => {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-2xl mx-auto w-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decision label */}
      <p className="font-mono text-xs text-text-muted tracking-[0.3em] uppercase mb-8 self-start">
        Chapter {chapterNum} · Decision {decisionNumber}
      </p>

      {/* Decision prompt */}
      <motion.div
        className="mb-12 self-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="font-body text-2xl md:text-3xl text-text-primary leading-relaxed italic">
          {decision.prompt}
        </p>
      </motion.div>

      {/* Choices */}
      <div className="space-y-3 w-full">
        {decision.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            text={choice.text}
            index={index}
            disabled={isSubmitting}
            onSelect={() => onChoose(decision, index)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default DecisionCard;
```

---

## `src/components/story/ChoiceButton.jsx`

```jsx
import { motion } from "framer-motion";

const ROMAN = ["I", "II", "III", "IV"];

const ChoiceButton = ({ text, index, onSelect, disabled }) => {
  return (
    <motion.button
      onClick={onSelect}
      disabled={disabled}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.3 }}
      whileHover={{ x: 8, borderColor: "rgba(194, 0, 69, 0.6)" }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left p-5 border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-all duration-300 group flex items-start gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Roman numeral */}
      <span className="font-mono text-xs text-text-muted group-hover:text-accent transition-colors mt-1 w-4 flex-shrink-0">
        {ROMAN[index]}
      </span>

      {/* Choice text */}
      <span className="font-body text-base leading-relaxed italic">
        {text}
      </span>
    </motion.button>
  );
};

export default ChoiceButton;
```

---

## `src/components/story/ConsequenceReveal.jsx`

```jsx
import { motion } from "framer-motion";

const ConsequenceReveal = ({ text, onContinue }) => {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle red glow */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

      {/* Oracle label */}
      <motion.p
        className="font-mono text-xs text-text-muted tracking-[0.4em] uppercase mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        ◆ What Follows ◆
      </motion.p>

      {/* Consequence text */}
      <motion.p
        className="font-body text-2xl md:text-3xl text-text-primary italic leading-relaxed max-w-xl mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        "{text}"
      </motion.p>

      {/* Continue button */}
      <motion.button
        onClick={onContinue}
        className="font-mono text-xs text-text-muted hover:text-accent tracking-[0.3em] uppercase transition-colors border-b border-border-subtle hover:border-accent pb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Continue →
      </motion.button>
    </motion.div>
  );
};

export default ConsequenceReveal;
```

---

## `src/components/story/StoryProgress.jsx`

```jsx
const StoryProgress = ({ chapterNum, decisionIndex, totalDecisions }) => {
  const chapters = [1, 2, 3];

  return (
    <div className="px-6 pt-6 pb-2 flex items-center justify-between max-w-2xl mx-auto w-full">
      {/* Chapter dots */}
      <div className="flex items-center gap-2">
        {chapters.map((ch) => (
          <div key={ch} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                ch < chapterNum
                  ? "bg-accent"
                  : ch === chapterNum
                  ? "bg-accent animate-pulse"
                  : "bg-border-default"
              }`}
            />
            {ch < 3 && <div className="w-6 h-px bg-border-subtle" />}
          </div>
        ))}
      </div>

      {/* Decision counter */}
      <p className="font-mono text-xs text-text-muted">
        Decision{" "}
        <span className="text-accent">{decisionIndex + 1}</span> /{" "}
        {totalDecisions}
      </p>
    </div>
  );
};

export default StoryProgress;
```

---

## `src/pages/onboarding/StoryComplete.jsx`

```jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const StoryComplete = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <motion.div
      className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/10 via-transparent to-transparent pointer-events-none" />

      <motion.p
        className="font-mono text-xs text-text-muted tracking-[0.4em] uppercase mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        ◆ Your Story Has Been Written ◆
      </motion.p>

      <motion.h1
        className="font-display text-5xl text-text-primary mb-6 leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Mystic Falls
        <br />
        <span className="text-accent">Remembers You</span>
      </motion.h1>

      <motion.p
        className="font-body text-text-secondary text-lg italic leading-relaxed max-w-md mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        You are a <span className="text-text-primary">{user?.supernaturalType}</span>.
        The choices you made have shaped who you are in this world.
      </motion.p>

      <motion.p
        className="font-body text-text-muted text-base italic mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Now the real story begins — finding your match.
      </motion.p>

      <motion.button
        onClick={() => navigate("/dashboard")}
        className="px-14 py-4 bg-accent hover:bg-accent-hover text-white font-display text-sm tracking-widest uppercase transition-all duration-300 glow-accent border border-accent/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Find My Match
      </motion.button>
    </motion.div>
  );
};

export default StoryComplete;
```

---

## Add Routes to `App.jsx`

```jsx
import Story from "./pages/onboarding/Story";
import StoryComplete from "./pages/onboarding/StoryComplete";

// Inside <Routes>:
<Route path="/onboarding/story" element={<ProtectedRoute><Story /></ProtectedRoute>} />
<Route path="/onboarding/complete" element={<ProtectedRoute><StoryComplete /></ProtectedRoute>} />
```

---

## Guard: Skip If Story Already Complete

Add to `Story.jsx` `useEffect`:

```jsx
useEffect(() => {
  if (user?.storyProgress?.completed) {
    navigate("/dashboard");
  }
}, [user]);
```

---

## Testing Checklist

- [ ] Chapter 1 intro screen appears with correct title and intro text
- [ ] "Begin" button transitions to first decision
- [ ] Decision prompt and all choices render correctly
- [ ] Clicking a choice triggers consequence reveal screen
- [ ] "Continue →" advances to next decision
- [ ] After 5 decisions, chapter 2 intro appears
- [ ] After all 3 chapters, `StoryComplete` page renders
- [ ] "Find My Match" navigates to `/dashboard`
- [ ] Story progress bar/dots update correctly per chapter
- [ ] Back-end `storyProgress.completed` = true after all decisions
- [ ] User who completed story is redirected away from `/onboarding/story`
- [ ] Decisions are saved in the DB (verify via API)

---

## ✅ Phase 3 Complete When

- Full 3-chapter story plays through with no errors
- All animations (intro, decision, consequence) render smoothly
- Decisions are submitted and saved correctly to the backend
- Chapter advancement works after 5 decisions each
- Story completion redirects to the completion screen
- Completion screen shows correct archetype name
- Completed story redirects back to dashboard on revisit