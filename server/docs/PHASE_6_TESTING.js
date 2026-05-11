/**
 * PHASE 6 — Complete API Testing Guide
 * Groq AI Integration, Gamification & Cloudinary
 *
 * Use this guide to test all Phase 6 endpoints
 * Status: PRODUCTION READY
 */

// ═══════════════════════════════════════════════════════════════════════════
// SETUP REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════

/*
1. Environment Variables (.env)
   GROQ_API_KEY=gsk_xxxxx (from https://console.groq.com)
   GROQ_MODEL=llama3-70b-8192
   CLOUDINARY_CLOUD_NAME=xxxxx
   CLOUDINARY_API_KEY=xxxxx
   CLOUDINARY_API_SECRET=xxxxx

2. Install Dependencies
   npm install

3. MongoDB Connection
   User collection must have existing documents with supernaturalType & personalityTraits

4. Authentication
   All endpoints require JWT token in header: Authorization: Bearer {JWT_TOKEN}
*/

// ═══════════════════════════════════════════════════════════════════════════
// AI ENDPOINTS TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ✅ TEST 1: GET Personality Insight
 * Generates Groq AI personality analysis for a user
 */
const test_getPersonalityInsight = {
  name: "GET /api/ai/insights/:userId",
  method: "GET",
  url: "http://localhost:5000/api/ai/insights/64f7c2e1b8e2a4c6d9f3e8a1",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },

  // EXPECTED SUCCESS RESPONSE (200)
  expectedResponse: {
    success: true,
    insight: {
      summary: "You are a charismatic Vampire with ancient wisdom and modern charm. Your dark allure masks a deep capacity for loyalty and strategic thinking, making you both dangerous and trustworthy.",
      strengths: [
        "Magnetic presence draws others naturally",
        "Strategic mind sees several moves ahead",
        "Loyalty runs deeper than most supernatural beings"
      ],
      weaknesses: [
        "Tendency toward isolation when hurt",
        "Can be overly cautious in matters of the heart",
        "Pride sometimes prevents vulnerability"
      ],
      idealPartner: "Someone who balances your intensity with calm, who sees past your dark exterior to the protector within. A witch would complement your nature perfectly.",
      powerPhrase: "I've lived through centuries of darkness—I know what matters."
    }
  },

  // ERROR RESPONSES
  errorCases: [
    {
      scenario: "User not found",
      statusCode: 404,
      response: { success: false, message: "User not found" }
    },
    {
      scenario: "Quiz not completed",
      statusCode: 400,
      response: { success: false, message: "User must complete the quiz before insights can be generated" }
    },
    {
      scenario: "Groq API failure",
      statusCode: 500,
      response: { success: false, message: "Failed to generate personality insight: API error" }
    },
    {
      scenario: "No JWT token",
      statusCode: 401,
      response: { success: false, message: "Not authorized to access this route" }
    }
  ],

  // POSTMAN STEPS
  postmanSteps: [
    "Set method to GET",
    "URL: http://localhost:5000/api/ai/insights/{userId}",
    "Headers → Authorization: Bearer {JWT}",
    "Send request",
    "Verify response contains all 5 insight fields"
  ],

  // CURL COMMAND
  curl: `curl -X GET "http://localhost:5000/api/ai/insights/64f7c2e1b8e2a4c6d9f3e8a1" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"`
};

/**
 * ✅ TEST 2: POST Match Explanation (First Call - Fresh Generation)
 * Generates Groq AI analysis of compatibility between two matched users
 */
const test_getMatchExplanation_Fresh = {
  name: "POST /api/ai/match-explanation (First Call)",
  method: "POST",
  url: "http://localhost:5000/api/ai/match-explanation",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },

  requestBody: {
    matchId: "64f7c2e1b8e2a4c6d9f3e8b1"
  },

  // EXPECTED SUCCESS RESPONSE (200) - FIRST CALL
  expectedResponse_FirstCall: {
    success: true,
    cached: false,
    explanation: {
      explanation: "Elena and Stefan are bound by a supernatural understanding that transcends time. Her empathy awakens the humanity Stefan has spent centuries preserving, while his ancient wisdom provides the grounding she desperately needs.",
      tension: "Their opposing supernatural natures—witch vs vampire—create a fundamental conflict between balance and hunger that will test their connection constantly.",
      potential: "Together they could become a legendary bond, where witchcraft and vampirism merge into something neither kind has ever witnessed before."
    }
  },

  // EXPECTED SUCCESS RESPONSE (200) - SECOND CALL (CACHED)
  expectedResponse_Cached: {
    success: true,
    cached: true,
    explanation: {
      explanation: "Elena and Stefan are bound by a supernatural understanding...",
      tension: "Their opposing supernatural natures...",
      potential: "Together they could become a legendary bond..."
    }
  },

  errorCases: [
    {
      scenario: "matchId not provided",
      statusCode: 400,
      response: { success: false, message: "matchId is required" }
    },
    {
      scenario: "Match doesn't exist",
      statusCode: 404,
      response: { success: false, message: "Match not found or not yet matched" }
    },
    {
      scenario: "User not participant in match",
      statusCode: 403,
      response: { success: false, message: "Not authorised to view this match" }
    }
  ],

  postmanSteps: [
    "Set method to POST",
    "URL: http://localhost:5000/api/ai/match-explanation",
    "Headers → Authorization: Bearer {JWT}",
    "Body (raw JSON):",
    '{',
    '  "matchId": "64f7c2e1b8e2a4c6d9f3e8b1"',
    '}',
    "Send request (first: cached=false, generates & caches)",
    "Send again (second: cached=true, returns cached)"
  ],

  curl: `curl -X POST "http://localhost:5000/api/ai/match-explanation" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "matchId": "64f7c2e1b8e2a4c6d9f3e8b1"
  }'`
};

/**
 * ✅ TEST 3: POST Battle Mode Result
 * Generates Groq AI chemistry analysis from scenario responses
 */
const test_getBattleResult = {
  name: "POST /api/ai/battle-result",
  method: "POST",
  url: "http://localhost:5000/api/ai/battle-result",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },

  requestBody: {
    scenario: "A witch's coven is in danger. What do you do?",
    answer1: "I'd fight to the death. No one threatens my people.",
    answer2: "I'd use strategy and diplomacy to find a peaceful solution.",
    user1Id: "64f7c2e1b8e2a4c6d9f3e8a1",
    user2Id: "64f7c2e1b8e2a4c6d9f3e8a2"
  },

  expectedResponse: {
    success: true,
    result: {
      chemistryScore: 78,
      chemistryLabel: "Kindred",
      analysis: "Stefan's protective instinct complements Elena's strategic thinking. While they'd approach the crisis differently, their combined approach—raw power guided by wisdom—creates a formidable dynamic.",
      agreementAreas: [
        "Both prioritize protecting those they love",
        "Neither would abandon their allies"
      ],
      tensionAreas: [
        "Stefan acts first, Elena plans first—could clash in emergencies"
      ],
      verdict: "Their differences make them stronger together, but only if they learn to trust each other's methods."
    }
  },

  errorCases: [
    {
      scenario: "Missing scenario",
      statusCode: 400,
      response: { success: false, message: "Scenario and both answers are required" }
    },
    {
      scenario: "Missing user IDs",
      statusCode: 400,
      response: { success: false, message: "Scenario, both answers, and both user IDs are required" }
    },
    {
      scenario: "User not found",
      statusCode: 404,
      response: { success: false, message: "One or both users not found" }
    }
  ],

  postmanSteps: [
    "Set method to POST",
    "URL: http://localhost:5000/api/ai/battle-result",
    "Headers → Authorization: Bearer {JWT}",
    "Body (raw JSON):",
    '{',
    '  "scenario": "A witch\'s coven is in danger. What do you do?",',
    '  "answer1": "I\'d fight to the death. No one threatens my people.",',
    '  "answer2": "I\'d use strategy and diplomacy...",',
    '  "user1Id": "64f7c2e1b8e2a4c6d9f3e8a1",',
    '  "user2Id": "64f7c2e1b8e2a4c6d9f3e8a2"',
    '}',
    "Send request",
    "Verify chemistry score between 0-100",
    "Verify chemistryLabel is one of: Magnetic, Kindred, Volatile, Neutral, Transcendent"
  ],

  curl: `curl -X POST "http://localhost:5000/api/ai/battle-result" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "scenario": "A witch coven is in danger. What do you do?",
    "answer1": "Fight to the death",
    "answer2": "Use strategy and diplomacy",
    "user1Id": "64f7c2e1b8e2a4c6d9f3e8a1",
    "user2Id": "64f7c2e1b8e2a4c6d9f3e8a2"
  }'`
};

// ═══════════════════════════════════════════════════════════════════════════
// GAMIFICATION ENDPOINTS TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ✅ TEST 4: GET Achievements (Earned + Locked)
 * Retrieves user's achievements (both earned and locked)
 */
const test_getAchievements = {
  name: "GET /api/gamification/achievements/:userId",
  method: "GET",
  url: "http://localhost:5000/api/gamification/achievements/64f7c2e1b8e2a4c6d9f3e8a1",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },

  expectedResponse: {
    success: true,
    earnedCount: 3,
    total: 8,
    earned: [
      {
        _id: "64f7c2e1b8e2a4c6d9f3e9a1",
        userId: "64f7c2e1b8e2a4c6d9f3e8a1",
        achievementId: "first_blood",
        name: "First Blood",
        description: "Get your first mutual match",
        icon: "❤️",
        unlockedAt: "2025-05-11T10:30:00.000Z"
      },
      {
        _id: "64f7c2e1b8e2a4c6d9f3e9a2",
        userId: "64f7c2e1b8e2a4c6d9f3e8a1",
        achievementId: "original_vampire",
        name: "Original Vampire",
        description: "Complete all 3 story chapters",
        icon: "🧛",
        unlockedAt: "2025-05-09T15:45:00.000Z"
      },
      {
        _id: "64f7c2e1b8e2a4c6d9f3e9a3",
        userId: "64f7c2e1b8e2a4c6d9f3e8a1",
        achievementId: "loyal_witch",
        name: "Loyal Witch",
        description: "Maintain a 7-day activity streak",
        icon: "🔮",
        unlockedAt: "2025-05-10T09:00:00.000Z"
      }
    ],
    locked: [
      {
        id: "ripper_mode",
        name: "Ripper Mode",
        description: "Send 50 diary entries in a single day",
        icon: "🩸",
        trigger: "messages_50_in_day",
        locked: true
      },
      {
        id: "hybrid_awakening",
        name: "Hybrid Awakening",
        description: "Match with all 4 supernatural archetypes",
        icon: "⚡",
        trigger: "all_archetypes_matched",
        locked: true
      },
      // ... 3 more locked achievements
    ]
  },

  postmanSteps: [
    "Set method to GET",
    "URL: http://localhost:5000/api/gamification/achievements/{userId}",
    "Headers → Authorization: Bearer {JWT}",
    "Send request",
    "Verify response contains both earned and locked arrays",
    "Verify earned are sorted by unlockedAt (newest first)"
  ],

  curl: `curl -X GET "http://localhost:5000/api/gamification/achievements/64f7c2e1b8e2a4c6d9f3e8a1" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
};

/**
 * ✅ TEST 5: GET Streak Info
 * Retrieves user's streak data
 */
const test_getStreak = {
  name: "GET /api/gamification/streak/:userId",
  method: "GET",
  url: "http://localhost:5000/api/gamification/streak/64f7c2e1b8e2a4c6d9f3e8a1",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },

  expectedResponse: {
    success: true,
    streak: {
      current: 7,
      longest: 12,
      lastActiveDate: "2025-05-11T15:30:00.000Z"
    }
  },

  postmanSteps: [
    "Set method to GET",
    "URL: http://localhost:5000/api/gamification/streak/{userId}",
    "Headers → Authorization: Bearer {JWT}",
    "Send request",
    "Verify streak has current, longest, lastActiveDate"
  ],

  curl: `curl -X GET "http://localhost:5000/api/gamification/streak/64f7c2e1b8e2a4c6d9f3e8a1" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
};

/**
 * ✅ TEST 6: POST Update Streak (Day 1 of Streak)
 * First time updating streak - sets to 1
 */
const test_updateStreak_FirstTime = {
  name: "POST /api/gamification/streak/update (First Time)",
  method: "POST",
  url: "http://localhost:5000/api/gamification/streak/update",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },

  expectedResponse: {
    success: true,
    streak: {
      current: 1,
      longest: 1,
      lastActiveDate: "2025-05-11T15:30:00.000Z"
    },
    newAchievements: [],
    message: "Streak updated to 1!"
  },

  postmanSteps: [
    "Set method to POST",
    "URL: http://localhost:5000/api/gamification/streak/update",
    "Headers → Authorization: Bearer {JWT}",
    "Body: {} (empty, uses current user from JWT)",
    "Send request",
    "Verify streak.current = 1",
    "Verify streak.longest = 1"
  ],

  curl: `curl -X POST "http://localhost:5000/api/gamification/streak/update" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{}'`
};

/**
 * ✅ TEST 7: POST Update Streak (Same Day)
 * Calling update again same day - should return "already updated"
 */
const test_updateStreak_SameDay = {
  name: "POST /api/gamification/streak/update (Same Day)",
  expectedResponse: {
    success: true,
    streak: {
      current: 1,
      longest: 1,
      lastActiveDate: "2025-05-11T15:30:00.000Z"
    },
    message: "Streak already updated today"
  }
};

/**
 * ✅ TEST 8: POST Update Streak (Consecutive Day)
 * Calling update on next day - should increment to 2
 */
const test_updateStreak_ConsecutiveDay = {
  name: "POST /api/gamification/streak/update (Consecutive Day)",
  expectedResponse: {
    success: true,
    streak: {
      current: 2,
      longest: 2,
      lastActiveDate: "2025-05-12T15:30:00.000Z"
    },
    newAchievements: [],
    message: "Streak updated to 2!"
  }
};

/**
 * ✅ TEST 9: POST Update Streak (7-Day Achievement Unlock)
 * After 7 consecutive days - should unlock "loyal_witch" achievement
 */
const test_updateStreak_7DayUnlock = {
  name: "POST /api/gamification/streak/update (7-Day Unlock)",
  expectedResponse: {
    success: true,
    streak: {
      current: 7,
      longest: 7,
      lastActiveDate: "2025-05-18T15:30:00.000Z"
    },
    newAchievements: [
      {
        _id: "64f7c2e1b8e2a4c6d9f3e9a4",
        userId: "64f7c2e1b8e2a4c6d9f3e8a1",
        achievementId: "loyal_witch",
        name: "Loyal Witch",
        description: "Maintain a 7-day activity streak",
        icon: "🔮",
        unlockedAt: "2025-05-18T15:30:00.000Z"
      }
    ],
    message: "Streak updated to 7!"
  }
};

/**
 * ✅ TEST 10: POST Update Streak (Broken Streak)
 * If gap > 1 day between updates - resets to 1
 */
const test_updateStreak_Broken = {
  name: "POST /api/gamification/streak/update (Broken Streak)",
  scenario: "User had 7-day streak, but didn't activity for 2 days",
  expectedResponse: {
    success: true,
    streak: {
      current: 1,
      longest: 7,  // Longest preserved
      lastActiveDate: "2025-05-19T15:30:00.000Z"
    },
    newAchievements: [],
    message: "Streak updated to 1!"
  },
  note: "longest field preserves all-time record"
};

/**
 * ✅ TEST 11: POST Check Achievements (Manual Trigger)
 * Manually trigger achievement check (called after story completion, etc)
 */
const test_triggerAchievementCheck = {
  name: "POST /api/gamification/check-achievements",
  method: "POST",
  url: "http://localhost:5000/api/gamification/check-achievements",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
  },

  expectedResponse: {
    success: true,
    newAchievements: [
      {
        _id: "64f7c2e1b8e2a4c6d9f3e9a5",
        userId: "64f7c2e1b8e2a4c6d9f3e8a1",
        achievementId: "original_vampire",
        name: "Original Vampire",
        description: "Complete all 3 story chapters",
        icon: "🧛",
        unlockedAt: "2025-05-11T16:00:00.000Z"
      }
    ],
    count: 1
  },

  postmanSteps: [
    "Set method to POST",
    "URL: http://localhost:5000/api/gamification/check-achievements",
    "Headers → Authorization: Bearer {JWT}",
    "Body: {} (empty)",
    "Send request",
    "Verify count matches newAchievements.length"
  ],

  curl: `curl -X POST "http://localhost:5000/api/gamification/check-achievements" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{}'`
};

// ═══════════════════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD ENDPOINTS TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ✅ TEST 12: POST Upload Profile Photo
 * Upload and store profile photo in Cloudinary
 */
const test_uploadProfilePhoto = {
  name: "POST /api/upload/profile-photo",
  method: "POST",
  url: "http://localhost:5000/api/upload/profile-photo",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    // Content-Type: multipart/form-data (auto-set by Postman/browser)
  },

  formData: {
    profilePhoto: "(select image file: jpg, jpeg, png, webp, max 5MB)"
  },

  expectedResponse: {
    success: true,
    profilePhoto: "https://res.cloudinary.com/mysticmatch/image/upload/w_400,h_400,c_fill,g_face,q_auto/mysticmatch/profiles/xxxxx.jpg"
  },

  errorCases: [
    {
      scenario: "No file uploaded",
      statusCode: 400,
      response: { success: false, message: "No file uploaded" }
    },
    {
      scenario: "File > 5MB",
      statusCode: 400,
      response: { success: false, message: "File too large. Maximum size is 5MB." }
    },
    {
      scenario: "Invalid format (pdf, etc)",
      statusCode: 400,
      response: { success: false, message: "Only jpg, jpeg, png, and webp images are allowed." }
    }
  ],

  postmanSteps: [
    "Set method to POST",
    "URL: http://localhost:5000/api/upload/profile-photo",
    "Headers → Authorization: Bearer {JWT}",
    "Body → form-data",
    "Key: profilePhoto | Value: [select image file]",
    "Send request",
    "Verify response contains Cloudinary URL",
    "Verify User.profilePhoto updated in DB"
  ],

  postmanForm: {
    step1: "Click Body tab",
    step2: "Select 'form-data'",
    step3: "Key field: profilePhoto",
    step4: "Value type: select File (dropdown)",
    step5: "Choose image file (jpg/png/webp)",
    step6: "Send"
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST FLOWS
// ═══════════════════════════════════════════════════════════════════════════

const integrationFlow_Achievement = {
  title: "Complete Achievement Unlock Flow",
  steps: [
    {
      step: 1,
      action: "User completes story (Phase 3)",
      endpoint: "POST /api/story/complete (from Phase 3)",
      result: "user.storyProgress.completed = true"
    },
    {
      step: 2,
      action: "System triggers achievement check",
      endpoint: "POST /api/gamification/check-achievements",
      result: "Detects storyProgress.completed trigger"
    },
    {
      step: 3,
      action: "System awards achievement",
      internal: "awardAchievement('original_vampire')",
      result: "Achievement document created + added to User.achievements"
    },
    {
      step: 4,
      action: "Frontend displays new badge",
      endpoint: "GET /api/gamification/achievements/:userId",
      result: "Returns earned array with new badge"
    }
  ]
};

const integrationFlow_StreakAchievement = {
  title: "Streak-Based Achievement Unlock (7-Day Badge)",
  steps: [
    {
      day: "Day 1",
      action: "User logs in",
      endpoint: "POST /api/gamification/streak/update",
      result: "streak.current = 1"
    },
    {
      day: "Days 2-6",
      action: "User logs in daily",
      endpoint: "POST /api/gamification/streak/update",
      result: "streak.current increments each day"
    },
    {
      day: "Day 7",
      action: "User logs in on 7th consecutive day",
      endpoint: "POST /api/gamification/streak/update",
      result: "streak.current = 7, system detects >= 7 check"
    },
    {
      day: "Day 7 (Auto-triggered)",
      action: "checkAndAwardAchievements called",
      internal: "Finds loyal_witch trigger match",
      result: 'awardAchievement("loyal_witch") called'
    },
    {
      day: "Day 7 (Auto-triggered)",
      action: "Response includes newAchievements",
      result: "[{ achievementId: 'loyal_witch', name: 'Loyal Witch', icon: '🔮' }]"
    }
  ]
};

const integrationFlow_ProfilePhoto = {
  title: "Upload and Replace Profile Photo",
  steps: [
    {
      step: 1,
      action: "User uploads first profile photo",
      endpoint: "POST /api/upload/profile-photo",
      file: "photo1.jpg (3MB)",
      result: "Saved to Cloudinary, user.profilePhoto = URL1"
    },
    {
      step: 2,
      action: "User uploads second photo",
      endpoint: "POST /api/upload/profile-photo",
      file: "photo2.png (2.5MB)",
      result: "photo1.jpg deleted from Cloudinary"
    },
    {
      step: 3,
      action: "User profile updated",
      result: "user.profilePhoto = URL2 (new Cloudinary URL)"
    },
    {
      step: 4,
      action: "Frontend displays new photo",
      endpoint: "GET /api/auth/profile or GET /api/matches/:matchId (populated user)",
      result: "Shows updated profilePhoto URL"
    }
  ]
};

const integrationFlow_MatchExplanation = {
  title: "Generate and Cache Match Explanation",
  steps: [
    {
      call: "First Call",
      action: "POST /api/ai/match-explanation {matchId}",
      processing: "Groq API called, generates 3 fields"
    },
    {
      call: "First Call",
      result: "{ cached: false, explanation: {...} }",
      storage: "JSON string saved to match.matchExplanation"
    },
    {
      call: "Second Call",
      action: "POST /api/ai/match-explanation {matchId} (same match)",
      processing: "Checks match.matchExplanation field"
    },
    {
      call: "Second Call",
      result: "{ cached: true, explanation: {...} }",
      performance: "No Groq API call, instant response"
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE RESPONSES IN DETAIL
// ═══════════════════════════════════════════════════════════════════════════

const exampleAchievementDefinitions = {
  achievements: [
    {
      id: "original_vampire",
      name: "Original Vampire",
      description: "Complete all 3 story chapters",
      icon: "🧛",
      trigger: "story_completed"
    },
    {
      id: "ripper_mode",
      name: "Ripper Mode",
      description: "Send 50 diary entries in a single day",
      icon: "🩸",
      trigger: "messages_50_in_day"
    },
    {
      id: "loyal_witch",
      name: "Loyal Witch",
      description: "Maintain a 7-day activity streak",
      icon: "🔮",
      trigger: "streak_7"
    },
    {
      id: "hybrid_awakening",
      name: "Hybrid Awakening",
      description: "Match with all 4 supernatural archetypes",
      icon: "⚡",
      trigger: "all_archetypes_matched"
    },
    {
      id: "keeper_of_secrets",
      name: "Keeper of Secrets",
      description: "Unlock 5 dark side profiles",
      icon: "📖",
      trigger: "dark_sides_5"
    },
    {
      id: "first_blood",
      name: "First Blood",
      description: "Get your first mutual match",
      icon: "❤️",
      trigger: "first_match"
    },
    {
      id: "eternal_bond",
      name: "Eternal Bond",
      description: "Maintain a 30-day activity streak",
      icon: "♾️",
      trigger: "streak_30"
    },
    {
      id: "compulsion_master",
      name: "Compulsion Master",
      description: "Pin 10 diary entries across all chats",
      icon: "🌀",
      trigger: "pins_10"
    }
  ]
};

const examplePersonalityInsights = [
  {
    name: "Damon",
    archetype: "Vampire",
    insight: {
      summary: "A dangerous charmer wrapped in darkness. Your unpredictable nature masks a protective core, making you both thrilling and trustworthy to those who earn your loyalty.",
      strengths: [
        "Raw magnetism draws people despite your reputation",
        "Witty humor breaks tension in heavy moments",
        "When you love, you love absolutely and fiercely"
      ],
      weaknesses: [
        "Impulsive decisions made in anger",
        "Fear of rejection expressed as cruelty",
        "Difficulty showing vulnerability first"
      ],
      idealPartner: "Someone strong-willed who won't be intimidated, who sees your humor as armor and helps you lower it.",
      powerPhrase: "I've spent centuries running—maybe it's time to stay."
    }
  },
  {
    name: "Elena",
    archetype: "Witch",
    insight: {
      summary: "An empath with quiet strength. Your ability to love fiercely despite the chaos around you makes you a beacon for supernatural beings. You balance power with compassion.",
      strengths: [
        "Leadership emerges naturally in crisis",
        "Emotional intelligence reads people instantly",
        "Sacrifice comes easily—sometimes too easily"
      ],
      weaknesses: [
        "Self-sacrificial tendency blinds you to your own needs",
        "Tendency to shoulder others' burdens",
        "Struggle to accept help from those you protect"
      ],
      idealPartner: "Someone strong enough to support you in return, who values your strength as much as your tenderness.",
      powerPhrase: "I've lost everything—but what I choose to protect, I will never lose again."
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// TESTING CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const testingChecklist = {
  "AI Endpoints": [
    "✅ GET /api/ai/insights/:userId returns valid insight with all 5 fields",
    "✅ GET /api/ai/insights/:userId returns 400 if quiz not completed",
    "✅ POST /api/ai/match-explanation first call: cached=false, generates",
    "✅ POST /api/ai/match-explanation second call: cached=true, uses stored",
    "✅ POST /api/ai/battle-result returns chemistryScore 0-100",
    "✅ POST /api/ai/battle-result chemistryLabel is one of 5 values",
    "✅ Groq API failures return 500 with error message"
  ],

  "Gamification Endpoints": [
    "✅ GET /api/gamification/achievements/:userId returns earned + locked arrays",
    "✅ Earned array sorted by unlockedAt (newest first)",
    "✅ Locked array contains unearned achievements",
    "✅ GET /api/gamification/streak/:userId returns current/longest/lastActiveDate",
    "✅ POST /api/gamification/streak/update first call: streak = 1",
    "✅ POST /api/gamification/streak/update same day: returns 'already updated'",
    "✅ POST /api/gamification/streak/update consecutive: increments streak",
    "✅ POST /api/gamification/streak/update after 2-day gap: resets to 1",
    "✅ POST /api/gamification/streak/update on day 7: unlocks loyal_witch",
    "✅ POST /api/gamification/streak/update on day 30: unlocks eternal_bond",
    "✅ POST /api/gamification/check-achievements detects all triggers"
  ],

  "Achievement System": [
    "✅ No duplicate achievements created (unique index enforced)",
    "✅ Achievement documents include all metadata (name, description, icon)",
    "✅ User.achievements array updated when achievement awarded",
    "✅ Duplicate award attempts return null (silent fail)",
    "✅ Achievement triggers checked correctly (story, streak, match)",
    "✅ First Blood: awarded on first match",
    "✅ Original Vampire: awarded on story completion",
    "✅ Loyal Witch: awarded at 7-day streak",
    "✅ Eternal Bond: awarded at 30-day streak"
  ],

  "Cloudinary Endpoints": [
    "✅ POST /api/upload/profile-photo accepts jpg/jpeg/png/webp",
    "✅ POST /api/upload/profile-photo rejects files > 5MB (400 error)",
    "✅ POST /api/upload/profile-photo returns Cloudinary URL",
    "✅ First upload: new photo stored, user.profilePhoto set",
    "✅ Second upload: old photo deleted from Cloudinary",
    "✅ Second upload: user.profilePhoto updated with new URL",
    "✅ File transformation applied: 400x400 crop with face gravity"
  ],

  "Security & Auth": [
    "✅ All AI endpoints require JWT (401 without token)",
    "✅ All gamification endpoints require JWT (401 without token)",
    "✅ All upload endpoints require JWT (401 without token)",
    "✅ Match explanation: only participants can view (403 if not)",
    "✅ Profile photo: only owner can upload (user from JWT)",
    "✅ No API keys exposed in responses",
    "✅ No raw stack traces in error responses"
  ],

  "Database": [
    "✅ Achievement model has unique index {userId, achievementId}",
    "✅ Match.matchExplanation stores JSON string correctly",
    "✅ User.streak updated atomically",
    "✅ User.achievements array updated with new Achievement._id",
    "✅ Profile photos tracked with new Cloudinary URLs"
  ],

  "Error Handling": [
    "✅ 400: Missing required fields",
    "✅ 400: Invalid file type",
    "✅ 400: File size exceeded",
    "✅ 403: Unauthorized user access",
    "✅ 404: User/Match/Achievement not found",
    "✅ 500: Groq API failures",
    "✅ All errors follow {success: false, message} format"
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// DEPLOYMENT CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const deploymentChecklist = {
  environment: [
    "✅ GROQ_API_KEY set and valid (test with simple prompt)",
    "✅ GROQ_MODEL set to llama3-70b-8192",
    "✅ CLOUDINARY_CLOUD_NAME set",
    "✅ CLOUDINARY_API_KEY set",
    "✅ CLOUDINARY_API_SECRET set",
    "✅ NODE_ENV set to production"
  ],

  database: [
    "✅ Achievement collection created with indexes",
    "✅ User collection has achievements array field",
    "✅ User collection has streak object field",
    "✅ Match collection has matchExplanation field",
    "✅ Indexes created on Achievement {userId, achievementId}"
  ],

  dependencies: [
    "✅ groq-sdk installed",
    "✅ cloudinary installed",
    "✅ multer installed",
    "✅ multer-storage-cloudinary installed",
    "✅ npm install completed without errors"
  ],

  testing: [
    "✅ All 12 endpoints tested and working",
    "✅ Groq API responding with valid JSON",
    "✅ Cloudinary uploads working and storing",
    "✅ Achievement system awarding correctly",
    "✅ Streak system calculating correctly",
    "✅ No errors in server console"
  ]
};

// Export for use in other files
export {
  test_getPersonalityInsight,
  test_getMatchExplanation_Fresh,
  test_getBattleResult,
  test_getAchievements,
  test_getStreak,
  test_updateStreak_FirstTime,
  test_updateStreak_SameDay,
  test_updateStreak_ConsecutiveDay,
  test_updateStreak_7DayUnlock,
  test_updateStreak_Broken,
  test_triggerAchievementCheck,
  test_uploadProfilePhoto,
  integrationFlow_Achievement,
  integrationFlow_StreakAchievement,
  integrationFlow_ProfilePhoto,
  integrationFlow_MatchExplanation,
  exampleAchievementDefinitions,
  examplePersonalityInsights,
  testingChecklist,
  deploymentChecklist
};
