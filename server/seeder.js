/**
 * MysticMatch Database Seeder
 *
 * Seeds the database with realistic test data including:
 * - 8 Vampire Diaries-themed users with unique archetypes
 * - Personality traits and quiz completion
 * - Story progress and decisions
 * - Matches between compatible users
 * - Chat records for matched pairs
 * - Activity scores
 *
 * Usage:
 *   npm run seed     - Clear and reseed database
 *   npm run destroy  - Clear all data without reseeding
 */

import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Import models
import User from "./models/User.js";
import Match from "./models/Match.js";
import Chat from "./models/Chat.js";
import StoryDecision from "./models/StoryDecision.js";
import Achievement from "./models/Achievement.js";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${colors.green}✅ Connected to MongoDB${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ MongoDB Connection Error:${colors.reset}`, error.message);
    process.exit(1);
  }
};

/**
 * Clear all data from collections
 */
const clearDatabase = async () => {
  try {
    console.log(`\n${colors.yellow}🗑️  Clearing database...${colors.reset}`);

    await User.deleteMany({});
    await Match.deleteMany({});
    await Chat.deleteMany({});
    await StoryDecision.deleteMany({});
    await Achievement.deleteMany({});

    console.log(`${colors.green}Database cleared${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red} Error clearing database:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Hash a password
 */
const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
};

/**
 * Create dummy users
 */
const seedUsers = async () => {
  try {
    console.log(`\n${colors.blue}👥 Creating 8 users...${colors.reset}`);

    const usersData = [
      {
        name: "Damon",
        email: "damon@mysticmatch.com",
        password: await hashPassword("Damon123!"),
        supernaturalType: "Vampire",
        personalityTraits: {
          loyalty: 5,
          aggression: 9,
          empathy: 3,
          strategy: 7,
          dominance: 9,
          emotionalDepth: 6,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Damon",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 2,
          completionPercentage: 66,
        },
        activityScore: 45,
      },
      {
        name: "Elena",
        email: "elena@mysticmatch.com",
        password: await hashPassword("Elena123!"),
        supernaturalType: "Witch",
        personalityTraits: {
          loyalty: 8,
          aggression: 4,
          empathy: 8,
          strategy: 8,
          dominance: 5,
          emotionalDepth: 9,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Elena",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 3,
          completionPercentage: 100,
        },
        activityScore: 62,
      },
      {
        name: "Klaus",
        email: "klaus@mysticmatch.com",
        password: await hashPassword("Klaus123!"),
        supernaturalType: "Vampire",
        personalityTraits: {
          loyalty: 6,
          aggression: 8,
          empathy: 2,
          strategy: 9,
          dominance: 10,
          emotionalDepth: 7,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Klaus",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 2,
          completionPercentage: 50,
        },
        activityScore: 38,
      },
      {
        name: "Bonnie",
        email: "bonnie@mysticmatch.com",
        password: await hashPassword("Bonnie123!"),
        supernaturalType: "Witch",
        personalityTraits: {
          loyalty: 9,
          aggression: 3,
          empathy: 9,
          strategy: 7,
          dominance: 3,
          emotionalDepth: 8,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Bonnie",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 1,
          completionPercentage: 25,
        },
        activityScore: 28,
      },
      {
        name: "Caroline",
        email: "caroline@mysticmatch.com",
        password: await hashPassword("Caroline123!"),
        supernaturalType: "Werewolf",
        personalityTraits: {
          loyalty: 9,
          aggression: 7,
          empathy: 7,
          strategy: 6,
          dominance: 7,
          emotionalDepth: 6,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Caroline",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 2,
          completionPercentage: 75,
        },
        activityScore: 55,
      },
      {
        name: "Stefan",
        email: "stefan@mysticmatch.com",
        password: await hashPassword("Stefan123!"),
        supernaturalType: "Vampire",
        personalityTraits: {
          loyalty: 10,
          aggression: 5,
          empathy: 7,
          strategy: 8,
          dominance: 6,
          emotionalDepth: 8,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Stefan",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 3,
          completionPercentage: 100,
        },
        activityScore: 72,
      },
      {
        name: "Rebekah",
        email: "rebekah@mysticmatch.com",
        password: await hashPassword("Rebekah123!"),
        supernaturalType: "Hybrid",
        personalityTraits: {
          loyalty: 7,
          aggression: 8,
          empathy: 5,
          strategy: 7,
          dominance: 8,
          emotionalDepth: 7,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Rebekah",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 2,
          completionPercentage: 60,
        },
        activityScore: 41,
      },
      {
        name: "Kai",
        email: "kai@mysticmatch.com",
        password: await hashPassword("Kai123!"),
        supernaturalType: "Hybrid",
        personalityTraits: {
          loyalty: 2,
          aggression: 9,
          empathy: 1,
          strategy: 8,
          dominance: 9,
          emotionalDepth: 4,
        },
        profilePhoto: "https://via.placeholder.com/300?text=Kai",
        quizCompleted: true,
        storyProgress: {
          currentChapter: 1,
          completionPercentage: 40,
        },
        activityScore: 19,
      },
    ];

    const createdUsers = await User.insertMany(usersData);

    console.log(`${colors.green}✅ Created ${createdUsers.length} users:${colors.reset}`);
    createdUsers.forEach((user) => {
      console.log(`   - ${colors.cyan}${user.name}${colors.reset} (${user.supernaturalType})`);
    });

    return createdUsers;
  } catch (error) {
    console.error(`${colors.red}❌ Error creating users:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Create dummy story decisions
 */
const seedStoryDecisions = async (users) => {
  try {
    console.log(`\n${colors.blue}📖 Creating story decisions...${colors.reset}`);

    const decisions = [
      // Damon's decisions
      {
        userId: users[0]._id,
        chapter: 1,
        decisionId: "dec-1-1",
        choiceIndex: 2,
        selectedText: "Confront the stranger",
        traitImpact: { dominance: 2, aggression: 1, empathy: -1 },
        consequence: "You assert your dominance",
        nextScene: "scene-1-2",
      },
      {
        userId: users[0]._id,
        chapter: 1,
        decisionId: "dec-1-2",
        choiceIndex: 1,
        selectedText: "Tell your best friend",
        traitImpact: { loyalty: 1, emotionalDepth: 1 },
        consequence: "Your friend is shocked",
        nextScene: "scene-1-3",
      },

      // Elena's decisions
      {
        userId: users[1]._id,
        chapter: 1,
        decisionId: "dec-1-1",
        choiceIndex: 0,
        selectedText: "Investigate carefully",
        traitImpact: { strategy: 2, empathy: 1 },
        consequence: "You gather information",
        nextScene: "scene-1-2",
      },
      {
        userId: users[1]._id,
        chapter: 1,
        decisionId: "dec-1-2",
        choiceIndex: 0,
        selectedText: "Keep it secret",
        traitImpact: { strategy: 1, emotionalDepth: -1 },
        consequence: "The burden weighs on you",
        nextScene: "scene-1-3",
      },
      {
        userId: users[1]._id,
        chapter: 2,
        decisionId: "dec-2-1",
        choiceIndex: 0,
        selectedText: "Join the witches",
        traitImpact: { loyalty: 2, strategy: 1 },
        consequence: "You find your people",
        nextScene: "scene-2-2",
      },

      // Stefan's decisions
      {
        userId: users[5]._id,
        chapter: 1,
        decisionId: "dec-1-1",
        choiceIndex: 1,
        selectedText: "Show restraint",
        traitImpact: { loyalty: 1, empathy: 1, aggression: -1 },
        consequence: "You maintain control",
        nextScene: "scene-1-2",
      },
      {
        userId: users[5]._id,
        chapter: 1,
        decisionId: "dec-1-2",
        choiceIndex: 0,
        selectedText: "Keep it secret",
        traitImpact: { loyalty: 2, emotionalDepth: 1 },
        consequence: "A burden shared is a burden doubled",
        nextScene: "scene-1-3",
      },
      {
        userId: users[5]._id,
        chapter: 2,
        decisionId: "dec-2-1",
        choiceIndex: 1,
        selectedText: "Stand alone",
        traitImpact: { independence: 2, dominance: 1 },
        consequence: "You forge your own path",
        nextScene: "scene-2-2",
      },
      {
        userId: users[5]._id,
        chapter: 3,
        decisionId: "dec-3-1",
        choiceIndex: 0,
        selectedText: "Accept the power",
        traitImpact: { dominance: 2, emotionalDepth: -1 },
        consequence: "You transcend your former limits",
        nextScene: "scene-3-2",
      },
    ];

    const createdDecisions = await StoryDecision.insertMany(decisions);

    console.log(`${colors.green}✅ Created ${createdDecisions.length} story decisions${colors.reset}`);

    return createdDecisions;
  } catch (error) {
    console.error(`${colors.red}❌ Error creating story decisions:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Create dummy matches with compatibility scores
 */
const seedMatches = async (users) => {
  try {
    console.log(`\n${colors.blue}💕 Creating matches...${colors.reset}`);

    // Match combinations with realistic compatibility
    const matchesData = [
      // Elena (Witch) & Stefan (Vampire) - High compatibility (0.90 from matrix)
      {
        user1: users[1]._id, // Elena
        user2: users[5]._id, // Stefan
        compatibilityScore: 87,
        compatibilityLabel: "Eternal Flame",
        scoreBreakdown: {
          similarityScore: 88,
          archetypeScore: 90,
          complementaryScore: 82,
          storyAlignmentScore: 91,
          activityScore: 67,
        },
        status: "matched",
        initiatedBy: users[1]._id,
      },

      // Bonnie (Witch) & Caroline (Werewolf) - Medium-high compatibility (0.75 from matrix)
      {
        user1: users[3]._id, // Bonnie
        user2: users[4]._id, // Caroline
        compatibilityScore: 78,
        compatibilityLabel: "Rising Chemistry",
        scoreBreakdown: {
          similarityScore: 75,
          archetypeScore: 75,
          complementaryScore: 81,
          storyAlignmentScore: 70,
          activityScore: 42,
        },
        status: "matched",
        initiatedBy: users[3]._id,
      },

      // Damon (Vampire) & Rebekah (Hybrid) - Medium compatibility (0.60 from matrix)
      {
        user1: users[0]._id, // Damon
        user2: users[6]._id, // Rebekah
        compatibilityScore: 62,
        compatibilityLabel: "Magnetic Pull",
        scoreBreakdown: {
          similarityScore: 65,
          archetypeScore: 60,
          complementaryScore: 58,
          storyAlignmentScore: 55,
          activityScore: 43,
        },
        status: "pending",
        initiatedBy: users[0]._id,
      },

      // Klaus (Vampire) & Elena (Witch) - High compatibility (0.90 from matrix)
      {
        user1: users[2]._id, // Klaus
        user2: users[1]._id, // Elena
        compatibilityScore: 81,
        compatibilityLabel: "Ancient Bond",
        scoreBreakdown: {
          similarityScore: 79,
          archetypeScore: 90,
          complementaryScore: 75,
          storyAlignmentScore: 68,
          activityScore: 50,
        },
        status: "pending",
        initiatedBy: users[2]._id,
      },

      // Kai (Hybrid) & Damon (Vampire) - Low compatibility (0.50 from matrix)
      {
        user1: users[7]._id, // Kai
        user2: users[0]._id, // Damon
        compatibilityScore: 45,
        compatibilityLabel: "Stormy Skies",
        scoreBreakdown: {
          similarityScore: 42,
          archetypeScore: 50,
          complementaryScore: 48,
          storyAlignmentScore: 35,
          activityScore: 32,
        },
        status: "rejected",
        initiatedBy: users[7]._id,
      },
    ];

    const createdMatches = await Match.insertMany(matchesData);

    console.log(`${colors.green}✅ Created ${createdMatches.length} matches${colors.reset}`);
    createdMatches.forEach((match, index) => {
      const user1Name = users.find((u) => u._id.equals(match.user1))?.name;
      const user2Name = users.find((u) => u._id.equals(match.user2))?.name;
      console.log(
        `   ${index + 1}. ${colors.cyan}${user1Name}${colors.reset} ❤️  ${colors.cyan}${user2Name}${colors.reset} (${match.compatibilityScore}/100)`
      );
    });

    return createdMatches;
  } catch (error) {
    console.error(`${colors.red}❌ Error creating matches:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Create chat records for matched pairs
 */
const seedChats = async (matches) => {
  try {
    console.log(`\n${colors.blue}💬 Creating chat records...${colors.reset}`);

    const chats = [];
    for (const match of matches) {
      if (match.status === "matched") {
        chats.push({
          matchId: match._id,
          participants: [match.user1, match.user2],
          lastMessage: "Match created! Start the conversation.",
          lastMessageAt: new Date(),
        });
      }
    }

    if (chats.length > 0) {
      const createdChats = await Chat.insertMany(chats);

      // Update matches with chatId
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].status === "matched") {
          const chatIndex = chats.findIndex((c) => c.matchId.equals(matches[i]._id));
          if (chatIndex >= 0) {
            matches[i].chatId = createdChats[chatIndex]._id;
            await matches[i].save();
          }
        }
      }

      console.log(`${colors.green}✅ Created ${createdChats.length} chat records${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  No matched pairs to create chats for${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error creating chats:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Update user liked/rejected lists
 */
const seedUserInteractions = async (users, matches) => {
  try {
    console.log(`\n${colors.blue}💭 Setting up user interactions...${colors.reset}`);

    // Add liked users based on matches
    for (const match of matches) {
      if (match.status === "pending" || match.status === "matched") {
        // Both users liked each other
        await User.findByIdAndUpdate(match.user1, {
          $addToSet: { likedUsers: match.user2 },
        });
        await User.findByIdAndUpdate(match.user2, {
          $addToSet: { likedUsers: match.user1 },
        });
      }

      if (match.status === "rejected") {
        // Rejecting user rejected the other
        await User.findByIdAndUpdate(match.initiatedBy, {
          $addToSet: { rejectedUsers: match.user1.equals(match.initiatedBy) ? match.user2 : match.user1 },
        });
      }
    }

    // Add some additional random rejections
    await User.findByIdAndUpdate(users[4]._id, {
      $addToSet: { rejectedUsers: users[2]._id },
    });

    console.log(`${colors.green}✅ User interaction data created${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error setting up interactions:${colors.reset}`, error.message);
    throw error;
  }
};

/**
 * Main seed function
 */
const seed = async () => {
  try {
    await connectDB();
    await clearDatabase();

    const users = await seedUsers();
    const decisions = await seedStoryDecisions(users);
    const matches = await seedMatches(users);
    await seedChats(matches);
    await seedUserInteractions(users, matches);

    console.log(`\n${colors.bright}${colors.green}✨ Database Seeded Successfully ✨${colors.reset}\n`);

    console.log(`${colors.cyan}📊 Summary:${colors.reset}`);
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Story Decisions: ${decisions.length}`);
    console.log(`   • Matches: ${matches.length}`);
    console.log(`   • Matched Pairs: ${matches.filter((m) => m.status === "matched").length}`);
    console.log(`   • Pending Matches: ${matches.filter((m) => m.status === "pending").length}`);
    console.log(`   • Rejected: ${matches.filter((m) => m.status === "rejected").length}\n`);

    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ Seeding failed:${colors.reset}`, error.message);
    process.exit(1);
  }
};

/**
 * Destroy function - clears database without reseeding
 */
const destroy = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log(`\n${colors.bright}${colors.green}✅ Database destroyed${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ Destroy failed:${colors.reset}`, error.message);
    process.exit(1);
  }
};

// Determine which function to run based on command line argument
const command = process.argv[2];

if (command === "destroy") {
  destroy();
} else {
  seed();
}
