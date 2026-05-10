# Frontend Phase 2 — Onboarding Quiz & Archetype Reveal UI

## Overview

This phase builds the personality quiz experience — 15 questions presented
one at a time with a progress bar and smooth animations. After submission,
the user sees a dramatic archetype reveal screen that assigns their
supernatural identity. This is the emotional core of onboarding.

> ⚠️ Phase 1 must be complete. The quiz reads from `/api/quiz/questions`
> and submits to `/api/quiz/submit`. The result is stored in the auth store.

---

## Folder Structure Added in This Phase

```
client/src/
├── components/
│   └── quiz/
│       ├── QuizQuestion.jsx        ← Single question display
│       ├── QuizProgress.jsx        ← Progress bar
│       ├── QuizOption.jsx          ← Individual answer option
│       └── ArchetypeReveal.jsx     ← Dramatic reveal screen
├── pages/
│   └── onboarding/
│       ├── Quiz.jsx                ← Main quiz page (orchestrator)
│       └── ArchetypeResult.jsx     ← Post-reveal page
├── store/
│   └── quizStore.js               ← Zustand quiz state
├── services/
│   └── quizService.js             ← API calls
```

---

## `src/store/quizStore.js`

```javascript
import { create } from "zustand";

export const useQuizStore = create((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: [],           // [{ questionId, optionIndex }]
  isLoading: false,
  isSubmitting: false,
  result: null,          // { supernaturalType, personalityTraits }
  error: null,

  setQuestions: (questions) => set({ questions }),

  selectAnswer: (questionId, optionIndex) => {
    const { answers, questions, currentIndex } = get();
    const existing = answers.findIndex((a) => a.questionId === questionId);
    const updated =
      existing >= 0
        ? answers.map((a, i) => (i === existing ? { questionId, optionIndex } : a))
        : [...answers, { questionId, optionIndex }];

    set({ answers: updated });

    // Auto-advance after short delay
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        set((state) => ({ currentIndex: state.currentIndex + 1 }));
      }, 400);
    }
  },

  goBack: () =>
    set((state) => ({
      currentIndex: Math.max(0, state.currentIndex - 1),
    })),

  setResult: (result) => set({ result }),
  setLoading: (isLoading) => set({ isLoading }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentIndex: 0,
      answers: [],
      result: null,
      error: null,
    }),
}));
```

---

## `src/services/quizService.js`

```javascript
import api from "./api";

export const fetchQuestions = async () => {
  const { data } = await api.get("/quiz/questions");
  return data.questions;
};

export const submitQuiz = async (answers) => {
  const { data } = await api.post("/quiz/submit", { answers });
  return data.result;
};
```

---

## Archetype Config (Used in Multiple Components)

Create `src/utils/archetypeConfig.js`:

```javascript
export const ARCHETYPES = {
  Vampire: {
    title: "The Vampire",
    tagline: "Eternal. Intense. Unforgettable.",
    description:
      "You love with a ferocity that consumes. Your loyalty is absolute, your presence magnetic. You have walked through centuries of emotion and emerged more powerful for it.",
    color: "vampire",
    colorHex: "#8b0000",
    lightHex: "#c41e3a",
    icon: "🧛",
    traits: ["Intense", "Loyal", "Dominant", "Emotionally Deep"],
  },
  Werewolf: {
    title: "The Werewolf",
    tagline: "Fierce. Protective. Untameable.",
    description:
      "You are raw instinct made flesh. When you love, you defend with everything you have. You feel the pull of the pack — and the call of something wilder.",
    color: "werewolf",
    colorHex: "#c45e00",
    lightHex: "#e07820",
    icon: "🐺",
    traits: ["Protective", "Impulsive", "Loyal", "Fierce"],
  },
  Witch: {
    title: "The Witch",
    tagline: "Strategic. Perceptive. Ancient.",
    description:
      "You see what others miss. Your mind is your most powerful weapon, and your empathy cuts deeper than any blade. You know that knowledge is the oldest form of power.",
    color: "witch",
    colorHex: "#5c0a8a",
    lightHex: "#8b2fc9",
    icon: "🔮",
    traits: ["Intelligent", "Strategic", "Empathic", "Perceptive"],
  },
  Hybrid: {
    title: "The Hybrid",
    tagline: "Dominant. Complex. Unstoppable.",
    description:
      "You contain multitudes. You are neither one thing nor another — you are everything at once. Unpredictable, dominant, and impossible to define. You are the rarest kind.",
    color: "hybrid",
    colorHex: "#8a7000",
    lightHex: "#c4a800",
    icon: "⚡",
    traits: ["Dominant", "Unpredictable", "Complex", "Powerful"],
  },
};
```

---

## `src/pages/onboarding/Quiz.jsx` — Main Orchestrator

```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuizStore } from "../../store/quizStore";
import { useAuthStore } from "../../store/authStore";
import { fetchQuestions, submitQuiz } from "../../services/quizService";
import QuizQuestion from "../../components/quiz/QuizQuestion";
import QuizProgress from "../../components/quiz/QuizProgress";
import ArchetypeReveal from "../../components/quiz/ArchetypeReveal";
import Spinner from "../../components/ui/Spinner";

const Quiz = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const {
    questions,
    currentIndex,
    answers,
    isLoading,
    isSubmitting,
    result,
    setQuestions,
    setLoading,
    setSubmitting,
    setResult,
    setError,
    goBack,
  } = useQuizStore();

  const [showReveal, setShowReveal] = useState(false);

  // Load questions on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = await fetchQuestions();
        setQuestions(qs);
      } catch (err) {
        setError("Failed to load the quiz. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-submit when all 15 answered
  useEffect(() => {
    if (answers.length === 15 && !isSubmitting && !result) {
      handleSubmit();
    }
  }, [answers]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitQuiz(answers);
      setResult(res);
      updateUser({
        supernaturalType: res.supernaturalType,
        personalityTraits: res.personalityTraits,
        quizCompleted: true,
      });
      // Small pause before reveal
      setTimeout(() => setShowReveal(true), 600);
    } catch (err) {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-text-secondary font-body italic mt-4">
            The oracle prepares your fate…
          </p>
        </div>
      </div>
    );
  }

  if (showReveal && result) {
    return (
      <ArchetypeReveal
        archetype={result.supernaturalType}
        onContinue={() => navigate("/onboarding/story")}
      />
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="font-display text-2xl text-text-primary mb-4">
            The oracle reads your soul…
          </p>
          <Spinner size="lg" />
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  );

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Progress */}
      <QuizProgress
        current={currentIndex + 1}
        total={questions.length}
        answered={answers.length}
      />

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-2xl"
            >
              <QuizQuestion
                question={currentQuestion}
                selectedIndex={currentAnswer?.optionIndex ?? null}
                questionNumber={currentIndex + 1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center px-6 pb-8 max-w-2xl mx-auto w-full">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className="text-text-muted hover:text-text-secondary font-mono text-xs tracking-widest uppercase transition-colors disabled:opacity-30"
        >
          ← Previous
        </button>
        <p className="text-text-muted font-mono text-xs">
          {currentIndex + 1} / {questions.length}
        </p>
        <div className="w-20" /> {/* Spacer */}
      </div>
    </div>
  );
};

export default Quiz;
```

---

## `src/components/quiz/QuizProgress.jsx`

```jsx
import { motion } from "framer-motion";

const QuizProgress = ({ current, total, answered }) => {
  const percent = (answered / total) * 100;

  return (
    <div className="px-6 pt-8 pb-4 max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-center mb-3">
        <p className="font-mono text-xs text-text-muted tracking-widest uppercase">
          The Oracle Speaks
        </p>
        <p className="font-mono text-xs text-text-secondary">
          <span className="text-accent">{answered}</span> / {total} answered
        </p>
      </div>
      <div className="h-px bg-border-subtle w-full overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default QuizProgress;
```

---

## `src/components/quiz/QuizQuestion.jsx`

```jsx
import { useQuizStore } from "../../store/quizStore";
import QuizOption from "./QuizOption";

const QuizQuestion = ({ question, selectedIndex, questionNumber }) => {
  const { selectAnswer } = useQuizStore();

  return (
    <div>
      {/* Chapter label */}
      <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-4">
        ◆ Chapter {question.chapter} · Question {questionNumber}
      </p>

      {/* Question text */}
      <h2 className="font-body text-2xl md:text-3xl text-text-primary leading-relaxed mb-10 italic">
        "{question.question}"
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <QuizOption
            key={index}
            text={option.text}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={() => selectAnswer(question.id, index)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
```

---

## `src/components/quiz/QuizOption.jsx`

```jsx
import { motion } from "framer-motion";

const QuizOption = ({ text, index, isSelected, onSelect }) => {
  const letters = ["A", "B", "C", "D"];

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ x: 6 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 border transition-all duration-200 flex items-start gap-4 group ${
        isSelected
          ? "border-accent bg-accent/10 text-text-primary"
          : "border-border-subtle bg-bg-surface hover:border-border-default text-text-secondary hover:text-text-primary"
      }`}
    >
      {/* Letter badge */}
      <span
        className={`font-mono text-xs w-6 h-6 flex-shrink-0 flex items-center justify-center border mt-0.5 transition-colors ${
          isSelected
            ? "border-accent text-accent"
            : "border-border-default text-text-muted group-hover:border-text-secondary group-hover:text-text-secondary"
        }`}
      >
        {letters[index]}
      </span>

      {/* Option text */}
      <span className="font-body text-base leading-relaxed">{text}</span>

      {/* Selected indicator */}
      {isSelected && (
        <motion.span
          className="ml-auto text-accent text-lg flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          ◆
        </motion.span>
      )}
    </motion.button>
  );
};

export default QuizOption;
```

---

## `src/components/quiz/ArchetypeReveal.jsx`

```jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ARCHETYPES } from "../../utils/archetypeConfig";

const ArchetypeReveal = ({ archetype, onContinue }) => {
  const [stage, setStage] = useState("dark"); // "dark" | "flash" | "reveal"
  const config = ARCHETYPES[archetype];

  useEffect(() => {
    // Dramatic reveal sequence
    const t1 = setTimeout(() => setStage("flash"), 800);
    const t2 = setTimeout(() => setStage("reveal"), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const colorMap = {
    vampire: "#8b0000",
    werewolf: "#c45e00",
    witch: "#5c0a8a",
    hybrid: "#8a7000",
  };

  const glowColor = colorMap[config.color] || "#c20045";

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center relative overflow-hidden px-4">
      <AnimatePresence mode="wait">
        {/* Stage 1: Dark with anticipation text */}
        {stage === "dark" && (
          <motion.div
            key="dark"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="font-display text-text-secondary text-sm tracking-widest uppercase"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              The oracle has spoken…
            </motion.p>
          </motion.div>
        )}

        {/* Stage 2: Flash */}
        {stage === "flash" && (
          <motion.div
            key="flash"
            className="absolute inset-0"
            style={{ backgroundColor: glowColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* Stage 3: Full reveal */}
        {stage === "reveal" && (
          <motion.div
            key="reveal"
            className="text-center max-w-xl z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Glow background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, ${glowColor}25 0%, transparent 70%)`,
              }}
            />

            {/* Icon */}
            <motion.div
              className="text-8xl mb-6"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              {config.icon}
            </motion.div>

            {/* You are */}
            <motion.p
              className="font-mono text-xs text-text-muted tracking-[0.4em] uppercase mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              You are
            </motion.p>

            {/* Archetype title */}
            <motion.h1
              className="font-display text-5xl md:text-6xl mb-4 leading-tight"
              style={{ color: colorMap[config.color] }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {config.title}
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="font-mono text-text-secondary text-sm tracking-widest mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {config.tagline}
            </motion.p>

            {/* Description */}
            <motion.p
              className="font-body text-text-primary text-lg italic leading-relaxed mb-10 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              "{config.description}"
            </motion.p>

            {/* Trait tags */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {config.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 border font-mono text-xs tracking-widest uppercase"
                  style={{
                    borderColor: `${glowColor}60`,
                    color: colorMap[config.color],
                    backgroundColor: `${glowColor}10`,
                  }}
                >
                  {trait}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.button
              onClick={onContinue}
              className="px-12 py-4 font-display text-sm tracking-widest uppercase text-white border transition-all duration-300"
              style={{
                backgroundColor: glowColor,
                borderColor: glowColor,
                boxShadow: `0 0 30px ${glowColor}50`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Enter Your Story →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArchetypeReveal;
```

---

## Add Routes to `App.jsx`

```jsx
import Quiz from "./pages/onboarding/Quiz";

// Inside <Routes>:
<Route
  path="/onboarding/quiz"
  element={
    <ProtectedRoute>
      <Quiz />
    </ProtectedRoute>
  }
/>
```

---

## Guard: Redirect if Quiz Already Complete

Add this to the top of `Quiz.jsx`:

```jsx
const { user } = useAuthStore();

// If quiz already done, skip to story
useEffect(() => {
  if (user?.quizCompleted) {
    navigate("/onboarding/story");
  }
}, [user]);
```

---

## Testing Checklist

- [ ] Quiz page loads and displays first question
- [ ] Selecting an option highlights it and auto-advances after 400ms
- [ ] Progress bar fills as answers are given
- [ ] Back button navigates to previous question
- [ ] Previously selected answer is shown when navigating back
- [ ] After question 15, "The oracle reads your soul…" loading screen appears
- [ ] Archetype reveal sequence: dark → flash → full reveal
- [ ] Archetype color, icon, title, description match the assigned type
- [ ] "Enter Your Story" button navigates to `/onboarding/story`
- [ ] `user.supernaturalType` in auth store matches reveal
- [ ] Visiting `/onboarding/quiz` when quiz is complete redirects to `/onboarding/story`
- [ ] Quiz state resets correctly on fresh visit

---

## ✅ Phase 2 Complete When

- All 15 questions load and display correctly
- Option selection, auto-advance, and back navigation all work
- Quiz submits on final answer and hits the backend correctly
- Archetype reveal animation plays in full sequence
- Auth store is updated with `supernaturalType` and `quizCompleted: true`
- Theming matches assigned archetype color on reveal screen