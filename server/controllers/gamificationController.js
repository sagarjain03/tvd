import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Achievement from "../models/Achievement.js";
import Match from "../models/Match.js";
import Message from "../models/Message.js";
import { ACHIEVEMENTS } from "../data/achievements.js";

// ─── CORE ACHIEVEMENT LOGIC ──────────────────────────────────────────────────

// Award an achievement if not already earned
// Silently returns null if already earned (unique index prevents duplicates)
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
    // Duplicate achievement (unique index enforced) — already earned
    if (err.code === 11000) return null;
    throw err;
  }
};

// Check and award all applicable achievements for a user based on current state
export const checkAndAwardAchievements = async (userId) => {
  const user = await User.findById(userId).populate("achievements");
  const newAchievements = [];

  try {
    // FIRST_BLOOD — first match
    const matchCount = await Match.countDocuments({
      $or: [{ user1: userId }, { user2: userId }],
      status: "matched",
    });
    if (matchCount >= 1) {
      const a = await awardAchievement(userId, "first_blood");
      if (a) newAchievements.push(a);
    }

    // ORIGINAL_VAMPIRE — story completed
    if (user.storyProgress?.completed) {
      const a = await awardAchievement(userId, "original_vampire");
      if (a) newAchievements.push(a);
    }

    // LOYAL_WITCH — 7-day streak
    if (user.streak?.current >= 7) {
      const a = await awardAchievement(userId, "loyal_witch");
      if (a) newAchievements.push(a);
    }

    // ETERNAL_BOND — 30-day streak
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
  } catch (err) {
    console.error("Error checking achievements:", err);
    return [];
  }
};

// ─── ENDPOINT HANDLERS ────────────────────────────────────────────────────────

// @desc    Get all achievements for a user (earned + locked)
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

  res.json({
    success: true,
    streak: user.streak,
  });
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
      // Streak broken (more than 1 day gap)
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
    message: `Streak updated to ${newStreak}!`,
  });
});

// @desc    Manually trigger achievement check (after significant events like story completion)
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
