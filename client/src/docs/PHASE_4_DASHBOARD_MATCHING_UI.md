# Frontend Phase 4 — Dashboard, Profiles & Matching UI

## Overview

This phase builds the main app experience post-onboarding. It includes the
dashboard home, the swipe-style match suggestion feed, like/reject actions,
the match explosion screen on mutual match, the matches list, individual
profile views, compatibility display, and the dark side unlock flow.

> ⚠️ Phases 1–3 must be complete. This phase consumes `/api/matches/*`
> endpoints from Backend Phase 4.

---

## Folder Structure Added in This Phase

```
client/src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              ← Persistent navigation
│   │   └── AppLayout.jsx           ← Wrapper with navbar
│   ├── matching/
│   │   ├── SuggestionCard.jsx      ← Single match card
│   │   ├── SuggestionFeed.jsx      ← Swipe-style feed
│   │   ├── MatchExplosion.jsx      ← Mutual match celebration
│   │   ├── MatchCard.jsx           ← Card in matches list
│   │   ├── CompatibilityBar.jsx    ← Score visualizer
│   │   └── DarkSideReveal.jsx      ← Animated veil lift
│   └── profile/
│       ├── ProfileHeader.jsx
│       ├── TraitRadar.jsx          ← Trait visualization
│       └── ArchetypeBadge.jsx
├── pages/
│   ├── Dashboard.jsx               ← Replaces placeholder
│   ├── Matches.jsx                 ← All matches list
│   ├── Discover.jsx                ← Match suggestion feed
│   └── Profile.jsx                 ← User profile detail
├── store/
│   └── matchStore.js
├── services/
│   └── matchService.js
```

---

## `src/store/matchStore.js`

```javascript
import { create } from "zustand";

export const useMatchStore = create((set, get) => ({
  suggestions: [],
  matches: [],
  currentSuggestionIndex: 0,
  newMatch: null,           // Set when a mutual match happens
  isLoading: false,
  error: null,

  setSuggestions: (suggestions) =>
    set({ suggestions, currentSuggestionIndex: 0 }),

  setMatches: (matches) => set({ matches }),

  setNewMatch: (match) => set({ newMatch: match }),

  clearNewMatch: () => set({ newMatch: null }),

  removeSuggestion: (userId) =>
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.user._id !== userId),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
```

---

## `src/services/matchService.js`

```javascript
import api from "./api";

export const fetchSuggestions = async () => {
  const { data } = await api.get("/matches/suggestions");
  return data.suggestions;
};

export const fetchMatches = async () => {
  const { data } = await api.get("/matches");
  return data.matches;
};

export const fetchMatchById = async (matchId) => {
  const { data } = await api.get(`/matches/${matchId}`);
  return data.match;
};

export const likeUser = async (userId) => {
  const { data } = await api.post(`/matches/like/${userId}`);
  return data; // { isMatch, match? }
};

export const rejectUser = async (userId) => {
  await api.post(`/matches/reject/${userId}`);
};

export const unlockDarkSide = async (matchId) => {
  const { data } = await api.patch(`/matches/${matchId}/unlock-dark-side`);
  return data.darkSideProfile;
};
```

---

## `src/components/layout/AppLayout.jsx`

```jsx
import Navbar from "./Navbar";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const AppLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AppLayout;
```

---

## `src/components/layout/Navbar.jsx`

```jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const NAV_LINKS = [
  { to: "/dashboard", label: "Home", icon: "◆" },
  { to: "/discover", label: "Discover", icon: "✦" },
  { to: "/matches", label: "Matches", icon: "❤" },
  { to: "/profile/me", label: "Profile", icon: "◉" },
];

const Navbar = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="border-b border-border-subtle bg-bg-secondary px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <span className="font-display text-lg text-text-primary">
        Mystic<span className="text-accent">Match</span>
      </span>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "text-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="font-mono text-xs text-text-muted hover:text-accent tracking-widest uppercase transition-colors"
      >
        Leave
      </button>
    </nav>
  );
};

export default Navbar;
```

---

## `src/pages/Dashboard.jsx` — Full Version

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useMatchStore } from "../store/matchStore";
import { fetchMatches } from "../services/matchService";
import AppLayout from "../components/layout/AppLayout";
import { ARCHETYPES } from "../utils/archetypeConfig";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { matches, setMatches } = useMatchStore();

  const archetype = user?.supernaturalType
    ? ARCHETYPES[user.supernaturalType]
    : null;

  useEffect(() => {
    fetchMatches().then(setMatches).catch(console.error);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-2">
            Welcome back
          </p>
          <h1 className="font-display text-4xl text-text-primary mb-3">
            {user?.name}
          </h1>
          {archetype && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{archetype.icon}</span>
              <span
                className="font-mono text-sm tracking-widest uppercase"
                style={{
                  color:
                    archetype.colorHex,
                }}
              >
                {archetype.title}
              </span>
            </div>
          )}
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Matches", value: matches.length },
            { label: "Story", value: user?.storyProgress?.completed ? "Complete" : "In Progress" },
            { label: "Streak", value: `${user?.streak?.current || 0} days` },
            { label: "Type", value: user?.supernaturalType || "?" },
          ].map(({ label, value }) => (
            <motion.div
              key={label}
              className="bg-bg-surface border border-border-subtle p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-1">
                {label}
              </p>
              <p className="font-display text-lg text-text-primary">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/discover")}
            className="flex-1 py-4 bg-accent hover:bg-accent-hover text-white font-display text-sm tracking-widest uppercase transition-all duration-300 glow-accent border border-accent/50"
          >
            Discover Matches
          </button>
          <button
            onClick={() => navigate("/matches")}
            className="flex-1 py-4 border border-border-default hover:border-accent text-text-primary hover:text-accent font-display text-sm tracking-widest uppercase transition-all duration-300"
          >
            View Matches ({matches.length})
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
```

---

## `src/pages/Discover.jsx` — Suggestion Feed

```jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchStore } from "../store/matchStore";
import { fetchSuggestions, likeUser, rejectUser } from "../services/matchService";
import SuggestionCard from "../components/matching/SuggestionCard";
import MatchExplosion from "../components/matching/MatchExplosion";
import AppLayout from "../components/layout/AppLayout";
import Spinner from "../components/ui/Spinner";

const Discover = () => {
  const { suggestions, setSuggestions, removeSuggestion, newMatch, setNewMatch, clearNewMatch } =
    useMatchStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    fetchSuggestions()
      .then(setSuggestions)
      .finally(() => setIsLoading(false));
  }, []);

  const currentSuggestion = suggestions[0];

  const handleLike = async () => {
    if (!currentSuggestion || isActing) return;
    setIsActing(true);
    try {
      const result = await likeUser(currentSuggestion.user._id);
      removeSuggestion(currentSuggestion.user._id);
      if (result.isMatch) {
        setNewMatch({ ...result.match, user: currentSuggestion.user });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!currentSuggestion || isActing) return;
    setIsActing(true);
    try {
      await rejectUser(currentSuggestion.user._id);
      removeSuggestion(currentSuggestion.user._id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  if (newMatch) {
    return (
      <MatchExplosion
        match={newMatch}
        onContinue={clearNewMatch}
      />
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-6 py-12">
        <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-8 text-center">
          ◆ Who Calls to You ◆
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !currentSuggestion ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-text-primary mb-4">
              No More Souls Tonight
            </p>
            <p className="font-body text-text-secondary italic">
              The night is still young. Come back when the moon rises again.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <SuggestionCard
              key={currentSuggestion.user._id}
              suggestion={currentSuggestion}
              onLike={handleLike}
              onReject={handleReject}
              disabled={isActing}
            />
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
};

export default Discover;
```

---

## `src/components/matching/SuggestionCard.jsx`

```jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ARCHETYPES } from "../../utils/archetypeConfig";
import CompatibilityBar from "./CompatibilityBar";

const SuggestionCard = ({ suggestion, onLike, onReject, disabled }) => {
  const { user, compatibilityScore, compatibilityLabel } = suggestion;
  const navigate = useNavigate();
  const archetype = ARCHETYPES[user.supernaturalType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.94 }}
      transition={{ duration: 0.4 }}
      className="bg-bg-surface border border-border-subtle overflow-hidden"
    >
      {/* Profile photo */}
      <div className="relative h-80 bg-bg-elevated flex items-center justify-center">
        {user.profilePhoto ? (
          <img
            src={user.profilePhoto}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl opacity-30">{archetype?.icon}</span>
        )}
        {/* Archetype overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-surface to-transparent p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{archetype?.icon}</span>
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: archetype?.colorHex }}
            >
              {user.supernaturalType}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-6">
        <h2 className="font-display text-2xl text-text-primary mb-4">
          {user.name}
        </h2>

        {/* Compatibility */}
        <CompatibilityBar score={compatibilityScore} label={compatibilityLabel} />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onReject}
            disabled={disabled}
            className="flex-1 py-3 border border-border-default hover:border-text-muted text-text-muted hover:text-text-secondary font-display text-xs tracking-widest uppercase transition-all disabled:opacity-50"
          >
            Pass
          </button>
          <button
            onClick={() => navigate(`/profile/${user._id}`)}
            disabled={disabled}
            className="flex-1 py-3 border border-border-default hover:border-accent text-text-secondary hover:text-accent font-display text-xs tracking-widest uppercase transition-all disabled:opacity-50"
          >
            View
          </button>
          <button
            onClick={onLike}
            disabled={disabled}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover text-white font-display text-xs tracking-widest uppercase transition-all glow-accent border border-accent/50 disabled:opacity-50"
          >
            Connect
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestionCard;
```

---

## `src/components/matching/CompatibilityBar.jsx`

```jsx
import { motion } from "framer-motion";

const getScoreColor = (score) => {
  if (score >= 75) return "#c20045";
  if (score >= 50) return "#8b2fc9";
  return "#5c0030";
};

const CompatibilityBar = ({ score, label }) => {
  const color = getScoreColor(score);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="font-mono text-xs text-text-muted tracking-widest uppercase">
          Compatibility
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-secondary">{label}</span>
          <span className="font-display text-sm" style={{ color }}>
            {score}%
          </span>
        </div>
      </div>
      <div className="h-px bg-border-subtle overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
};

export default CompatibilityBar;
```

---

## `src/components/matching/MatchExplosion.jsx`

```jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ARCHETYPES } from "../../utils/archetypeConfig";
import { useAuthStore } from "../../store/authStore";

const MatchExplosion = ({ match, onContinue }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const theirArchetype = ARCHETYPES[match.user?.supernaturalType];
  const myArchetype = ARCHETYPES[user?.supernaturalType];

  return (
    <motion.div
      className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center z-50 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Pulse background */}
      <motion.div
        className="absolute inset-0 bg-accent/10"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: 2 }}
      />

      {/* Archetype icons */}
      <div className="flex items-center gap-8 mb-8 z-10">
        <motion.span
          className="text-6xl"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {myArchetype?.icon}
        </motion.span>

        <motion.span
          className="text-accent text-4xl font-display"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.6 }}
        >
          ◆
        </motion.span>

        <motion.span
          className="text-6xl"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
        >
          {theirArchetype?.icon}
        </motion.span>
      </div>

      {/* Match text */}
      <motion.p
        className="font-mono text-xs text-text-muted tracking-[0.4em] uppercase mb-4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        ◆ A Bond Has Formed ◆
      </motion.p>

      <motion.h1
        className="font-display text-5xl text-accent mb-4 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 150 }}
      >
        It's a Match
      </motion.h1>

      <motion.p
        className="font-body text-text-secondary italic text-lg mb-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        You and <span className="text-text-primary">{match.user?.name}</span>{" "}
        have connected.
      </motion.p>

      <motion.p
        className="font-mono text-xs text-accent tracking-widest mb-12 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        {match.compatibilityLabel} · {match.compatibilityScore}%
      </motion.p>

      {/* Actions */}
      <motion.div
        className="flex gap-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <button
          onClick={() => {
            onContinue();
            navigate(`/chat/${match.chatId}`);
          }}
          className="px-10 py-4 bg-accent hover:bg-accent-hover text-white font-display text-sm tracking-widest uppercase transition-all duration-300 glow-accent border border-accent/50"
        >
          Write First Entry
        </button>
        <button
          onClick={onContinue}
          className="px-8 py-4 border border-border-default hover:border-accent text-text-secondary hover:text-accent font-display text-sm tracking-widest uppercase transition-all duration-300"
        >
          Keep Discovering
        </button>
      </motion.div>
    </motion.div>
  );
};

export default MatchExplosion;
```

---

## `src/pages/Matches.jsx`

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMatchStore } from "../store/matchStore";
import { fetchMatches } from "../services/matchService";
import { ARCHETYPES } from "../utils/archetypeConfig";
import CompatibilityBar from "../components/matching/CompatibilityBar";
import AppLayout from "../components/layout/AppLayout";
import Spinner from "../components/ui/Spinner";

const Matches = () => {
  const navigate = useNavigate();
  const { matches, setMatches, isLoading, setLoading } = useMatchStore();

  useEffect(() => {
    setLoading(true);
    fetchMatches().then(setMatches).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-2">
          Your Connections
        </p>
        <h1 className="font-display text-3xl text-text-primary mb-10">
          Matches
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 border border-border-subtle bg-bg-surface">
            <p className="font-display text-xl text-text-primary mb-3">
              No Matches Yet
            </p>
            <p className="font-body text-text-secondary italic">
              The right souls find each other eventually.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => {
              const archetype = ARCHETYPES[match.user.supernaturalType];
              return (
                <motion.div
                  key={match.matchId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-border-subtle bg-bg-surface p-5 cursor-pointer hover:border-border-default transition-colors"
                  onClick={() => navigate(`/profile/${match.user._id}?matchId=${match.matchId}`)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
                      {match.user.profilePhoto ? (
                        <img
                          src={match.user.profilePhoto}
                          alt={match.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{archetype?.icon}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg text-text-primary truncate">
                        {match.user.name}
                      </h3>
                      <p
                        className="font-mono text-xs tracking-widest uppercase"
                        style={{ color: archetype?.colorHex }}
                      >
                        {match.user.supernaturalType}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat/${match.chatId}`);
                      }}
                      className="px-4 py-2 border border-border-default hover:border-accent text-text-muted hover:text-accent font-mono text-xs tracking-widest uppercase transition-all"
                    >
                      Chat
                    </button>
                  </div>

                  <CompatibilityBar
                    score={match.compatibilityScore}
                    label={match.compatibilityLabel}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Matches;
```

---

## `src/components/matching/DarkSideReveal.jsx`

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { unlockDarkSide } from "../../services/matchService";

const DarkSideReveal = ({ matchId, isUnlocked, existingProfile }) => {
  const [revealed, setRevealed] = useState(isUnlocked);
  const [profile, setProfile] = useState(existingProfile || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const darkProfile = await unlockDarkSide(matchId);
      setProfile(darkProfile);
      setRevealed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-border-subtle bg-bg-surface p-6">
      <p className="font-mono text-xs text-text-muted tracking-widest uppercase mb-4">
        ◆ Dark Side
      </p>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="locked"
            className="text-center py-8"
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <p className="font-body text-text-muted italic mb-6">
              Every soul has a shadow. Are you ready to see theirs?
            </p>
            <button
              onClick={handleUnlock}
              disabled={isLoading}
              className="px-8 py-3 bg-bg-elevated border border-border-default hover:border-accent text-text-secondary hover:text-accent font-display text-xs tracking-widest uppercase transition-all"
            >
              {isLoading ? "Unveiling…" : "Lift the Veil"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* Glitch flash effect */}
            <motion.div
              className="absolute inset-0 bg-accent/20 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />

            <div>
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-2">
                Their Secret
              </p>
              <p className="font-body text-text-primary italic leading-relaxed">
                "{profile?.secret || "Some secrets are too dark even for this."}"
              </p>
            </div>

            {profile?.originStory && (
              <div>
                <p className="font-mono text-xs text-accent tracking-widest uppercase mb-2">
                  Their Origin
                </p>
                <p className="font-body text-text-secondary italic leading-relaxed text-sm">
                  {profile.originStory}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DarkSideReveal;
```

---

## Add Routes to `App.jsx`

```jsx
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";

// Inside <Routes>:
<Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
<Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
<Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/profile/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
```

---

## Testing Checklist

- [ ] Dashboard shows user name, archetype, match count, streak
- [ ] "Discover Matches" button navigates to `/discover`
- [ ] Suggestion card shows name, archetype, compatibility bar
- [ ] "Pass" removes card and calls reject API
- [ ] "Connect" removes card and calls like API
- [ ] Mutual match triggers `MatchExplosion` overlay
- [ ] "Write First Entry" from explosion navigates to `/chat/:chatId`
- [ ] "Keep Discovering" closes explosion and shows next card
- [ ] No more suggestions shows empty state
- [ ] `/matches` page shows all matched users
- [ ] Clicking a match navigates to their profile
- [ ] "Chat" button navigates to `/chat/:chatId`
- [ ] Dark side "Lift the Veil" button calls unlock API
- [ ] Dark side reveals with animation after unlock
- [ ] Already-unlocked dark side shows immediately

---

## ✅ Phase 4 Complete When

- Dashboard loads with real user stats
- Suggestion feed loads, like/reject work, cards animate away
- Mutual match explosion triggers and dismisses cleanly
- Matches list shows all matches with compatibility scores
- Profile page renders correctly
- Dark side unlock flow works with animation
- Navbar routes to all correct pages