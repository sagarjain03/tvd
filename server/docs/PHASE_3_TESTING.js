/**
 * PHASE 3 TESTING & DOCUMENTATION
 *
 * Example API payloads and responses for Story Mode
 */

// ========================
// 1. GET CHAPTERS
// ========================

/**
 * REQUEST: GET /api/story/chapters
 * Authorization: Bearer {accessToken}
 *
 * RESPONSE (200):
 */
const getChaptersResponse = {
  success: true,
  message: "Story chapters retrieved",
  data: {
    totalChapters: 3,
    chapters: [
      {
        chapterId: 1,
        title: "Awakening in Mystic Falls",
        description:
          "You arrive in Mystic Falls, a town shrouded in secrets. As darkness falls, you witness something impossible — something supernatural. Your first choice will determine how you respond.",
        decisionCount: 2,
      },
      {
        chapterId: 2,
        title: "Bloodlines and Betrayal",
        description:
          "The supernatural world opens before you, and with it comes a terrible choice. Where will your loyalties lie? Who do you trust? The answers will reshape who you are.",
        decisionCount: 2,
      },
      {
        chapterId: 3,
        title: "The Dark Side Awakens",
        description:
          "Everyone has a dark side. In Mystic Falls, yours is awakening. This final chapter will define who you truly are — and who you'll become.",
        decisionCount: 1,
      },
    ],
  },
};

// ========================
// 2. GET CHAPTER
// ========================

/**
 * REQUEST: GET /api/story/chapter/1
 * Authorization: Bearer {accessToken}
 *
 * RESPONSE (200):
 */
const getChapterResponse = {
  success: true,
  message: "Chapter 1 retrieved",
  data: {
    chapterId: 1,
    title: "Awakening in Mystic Falls",
    description:
      "You arrive in Mystic Falls, a town shrouded in secrets. As darkness falls, you witness something impossible — something supernatural. Your first choice will determine how you respond.",
    scenes: [
      {
        sceneId: "s_1_1",
        sceneTitle: "The Arrival",
        narrative:
          "The old Victorian mansion looms before you. Fog clings to the wrought-iron gates like a living thing. Inside, you hear... voices? Laughter? Something else? Your heart races. This town feels different. Alive. Dangerous. As you step forward, a figure in the shadows locks eyes with you. Red eyes. Unmistakably red.",
      },
    ],
    decisions: [
      {
        decisionId: "d_1_1",
        question:
          "The creature's eyes lock onto yours. Its voice is smooth, hypnotic: 'You're new here. Are you a snack... or do you have potential?' How do you respond?",
        options: [
          {
            text: "Stand your ground. 'I'm neither. And I don't appreciate threats.'",
            consequence: "You establish yourself as someone not to be trifled with. Dangerous... but memorable.",
          },
          {
            text: "Run. Trust your instincts.",
            consequence: "You survive the night. But running reveals your true nature to those who hunt.",
          },
          {
            text: "Engage. 'What is your name? I'd like to know who I'm speaking to.'",
            consequence: "Information is power. This creature respects curiosity.",
          },
          {
            text: "Smile back. 'Potential sounds interesting. What's in it for me?'",
            consequence: "You court danger deliberately. It notices. It approves.",
          },
        ],
      },
      {
        decisionId: "d_1_2",
        question:
          "A friend from school calls you. 'Where are you? Everyone's freaking out. There's been another attack. They're saying it was an animal.' Do you tell them what you really saw?",
        options: [
          {
            text: "Yes. Completely. They deserve to know what's really happening.",
            consequence: "You trust them completely. But you've also made them a target.",
          },
          {
            text: "No. You tell them it was an animal. Some secrets protect people.",
            consequence: "You keep the secret. You become the guardian of knowledge they don't have.",
          },
          {
            text: "Tell them half the truth. Enough to be useful, but not enough to endanger them.",
            consequence: "Balance is everything. You've chosen a middle path.",
          },
        ],
      },
    ],
  },
};

// ========================
// 3. SUBMIT DECISION
// ========================

/**
 * REQUEST: POST /api/story/decision
 * Authorization: Bearer {accessToken}
 * Content-Type: application/json
 *
 * BODY:
 */
const submitDecisionRequest = {
  chapter: 1,
  decisionId: "d_1_1",
  selectedOption: 2,
};

/**
 * RESPONSE (200):
 */
const submitDecisionResponse = {
  success: true,
  message: "Story decision recorded. Your personality evolves.",
  data: {
    decisionSaved: true,
    consequence: "Information is power. This creature respects curiosity.",
    traitChanges: {
      increased: ["strategy +2", "emotionalDepth +1"],
      decreased: [],
    },
    updatedTraits: {
      loyalty: 7.2,
      aggression: 3.1,
      empathy: 4.8,
      strategy: 7.5,
      dominance: 8.1,
      emotionalDepth: 8.9,
    },
    archetypeEvolved: {
      previousArchetype: "Vampire",
      currentArchetype: "Witch",
    },
    storyProgress: {
      currentChapter: 1,
      decisionsMade: 1,
      storyComplete: false,
    },
  },
};

// ========================
// 4. GET MY STORY PROGRESS
// ========================

/**
 * REQUEST: GET /api/story/my-progress
 * Authorization: Bearer {accessToken}
 *
 * RESPONSE (200):
 */
const getMyProgressResponse = {
  success: true,
  message: "Your story progress retrieved",
  data: {
    storyStarted: true,
    storyCompleted: false,
    currentChapter: 2,
    decisionsCount: 3,
    completionPercentage: 60,
    currentArchetype: "Witch",
    personalityTraits: {
      loyalty: 6.8,
      aggression: 3.5,
      empathy: 6.2,
      strategy: 8.1,
      dominance: 7.5,
      emotionalDepth: 8.2,
    },
    decisions: [
      {
        chapter: 1,
        decisionId: "d_1_1",
        choice: "Engage. 'What is your name? I'd like to know who I'm speaking to.'",
        consequence: "Information is power. This creature respects curiosity.",
        traitImpact: {
          strategy: 2,
          empathy: 1,
          emotionalDepth: 1,
        },
        madeAt: "2024-05-11T10:30:00.000Z",
      },
      {
        chapter: 1,
        decisionId: "d_1_2",
        choice:
          "Tell them half the truth. Enough to be useful, but not enough to endanger them.",
        consequence: "Balance is everything. You've chosen a middle path.",
        traitImpact: {
          strategy: 2,
          loyalty: 1,
          empathy: 1,
        },
        madeAt: "2024-05-11T10:35:00.000Z",
      },
      {
        chapter: 2,
        decisionId: "d_2_1",
        choice: "Walk away from both. You make your own rules.",
        consequence: "You are free. Hunted. Powerful in your independence.",
        traitImpact: {
          dominance: 2,
          strategy: 1,
          loyalty: -2,
        },
        madeAt: "2024-05-11T11:00:00.000Z",
      },
    ],
    storyContext:
      "Chapter 1: Engage. 'What is your name? I'd like to know who I'm speaking to.' Information is power. This creature respects curiosity. Chapter 1: Tell them half the truth. Enough to be useful, but not enough to endanger them. Balance is everything. You've chosen a middle path. Chapter 2: Walk away from both. You make your own rules. You are free. Hunted. Powerful in your independence.",
  },
};

// ========================
// ERROR RESPONSES
// ========================

const errorResponses = {
  // Quiz not completed
  notCompletedQuiz: {
    success: false,
    message:
      "Complete the personality quiz before starting story mode",
  },

  // Invalid chapter
  invalidChapter: {
    success: false,
    message: "Story chapter 5 not found",
  },

  // Invalid decision
  invalidDecision: {
    success: false,
    message: "Decision d_1_99 not found in chapter 1",
  },

  // Invalid option
  invalidOption: {
    success: false,
    message: "Invalid option index 10 for decision d_1_1",
  },

  // Duplicate submission
  duplicateDecision: {
    success: false,
    message:
      'You have already made the decision "d_1_1". Story choices are permanent.',
  },

  // Unauthorized
  unauthorized: {
    success: false,
    message: "Unauthorized. Can only view your own story progress.",
  },

  // User not found
  userNotFound: {
    success: false,
    message: "User not found",
  },
};

// ========================
// POSTMAN TEST COLLECTION
// ========================

const postmanCollection = {
  info: {
    name: "Phase 3 - Story Mode API",
    description: "Test endpoints for interactive story mode",
  },
  requests: [
    {
      name: "Get Available Chapters",
      method: "GET",
      url: "{{baseUrl}}/api/story/chapters",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
    {
      name: "Get Chapter 1",
      method: "GET",
      url: "{{baseUrl}}/api/story/chapter/1",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
    {
      name: "Get Chapter 2",
      method: "GET",
      url: "{{baseUrl}}/api/story/chapter/2",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
    {
      name: "Get Chapter 3",
      method: "GET",
      url: "{{baseUrl}}/api/story/chapter/3",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
    {
      name: "Submit Decision - Chapter 1",
      method: "POST",
      url: "{{baseUrl}}/api/story/decision",
      headers: {
        Authorization: "Bearer {{accessToken}}",
        "Content-Type": "application/json",
      },
      body: {
        chapter: 1,
        decisionId: "d_1_1",
        selectedOption: 2,
      },
    },
    {
      name: "Submit Decision - Chapter 2",
      method: "POST",
      url: "{{baseUrl}}/api/story/decision",
      headers: {
        Authorization: "Bearer {{accessToken}}",
        "Content-Type": "application/json",
      },
      body: {
        chapter: 2,
        decisionId: "d_2_1",
        selectedOption: 0,
      },
    },
    {
      name: "Get My Story Progress",
      method: "GET",
      url: "{{baseUrl}}/api/story/my-progress",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
    {
      name: "Get User Story Progress",
      method: "GET",
      url: "{{baseUrl}}/api/story/progress/{{userId}}",
      headers: {
        Authorization: "Bearer {{accessToken}}",
      },
    },
  ],
};

export {
  getChaptersResponse,
  getChapterResponse,
  submitDecisionRequest,
  submitDecisionResponse,
  getMyProgressResponse,
  errorResponses,
  postmanCollection,
};
