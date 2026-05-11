/**
 * Phase 4 - Compatibility Matching Engine
 * API Endpoints Testing Guide
 *
 * All endpoints require authentication (JWT token in Authorization header)
 * Base URL: http://localhost:5000/api/matches
 */

// ============================================
// 1. GET /api/matches
// ============================================
// Get all matches for current user
//
// Request:
//   GET http://localhost:5000/api/matches
//   Headers: Authorization: Bearer {JWT_TOKEN}
//
// Response (200 OK):
{
  "success": true,
  "message": "Matches retrieved",
  "data": {
    "totalMatches": 2,
    "matches": [
      {
        "matchId": "64f7c2e1b8e2a4c6d9f3e8a1",
        "with": {
          "_id": "64f7c2e1b8e2a4c6d9f3e8a2",
          "name": "Elena",
          "profilePhoto": "https://...",
          "supernaturalType": "Vampire",
          "personalityTraits": {
            "loyalty": 8,
            "empathy": 7,
            "dominance": 6
          }
        },
        "compatibilityScore": 87,
        "compatibilityLabel": "Eternal Flame",
        "status": "matched",
        "chatId": "64f7c2e1b8e2a4c6d9f3e8a3",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}

// ============================================
// 2. GET /api/matches/suggestions
// ============================================
// Get match suggestions (top compatible candidates)
//
// Request:
//   GET http://localhost:5000/api/matches/suggestions?limit=10
//   Headers: Authorization: Bearer {JWT_TOKEN}
//   Query Params: limit (optional, default 10)
//
// Response (200 OK):
{
  "success": true,
  "message": "Match suggestions retrieved",
  "data": {
    "totalSuggestions": 10,
    "suggestions": [
      {
        "userId": "64f7c2e1b8e2a4c6d9f3e8a4",
        "name": "Katherine",
        "profilePhoto": "https://...",
        "supernaturalType": "Witch",
        "compatibilityScore": 92,
        "compatibilityLabel": "Ancient Bond",
        "personalityTraits": {
          "loyalty": 7,
          "empathy": 8,
          "dominance": 5
        }
      },
      {
        "userId": "64f7c2e1b8e2a4c6d9f3e8a5",
        "name": "Stefan",
        "profilePhoto": "https://...",
        "supernaturalType": "Vampire",
        "compatibilityScore": 78,
        "compatibilityLabel": "Magnetic Pull",
        "personalityTraits": {
          "loyalty": 9,
          "empathy": 6,
          "dominance": 7
        }
      }
    ]
  }
}

// Error (404 - User not found):
{
  "success": false,
  "message": "User not found"
}

// ============================================
// 3. POST /api/matches/like/:userId
// ============================================
// Like a user (initiate or confirm match)
//
// Request:
//   POST http://localhost:5000/api/matches/like/64f7c2e1b8e2a4c6d9f3e8a4
//   Headers: Authorization: Bearer {JWT_TOKEN}
//   Body: {} (empty)
//
// Response (200 OK) - One-sided like:
{
  "success": true,
  "message": "Like sent. Awaiting their response.",
  "data": {
    "matchId": "64f7c2e1b8e2a4c6d9f3e8a6",
    "status": "pending",
    "compatibilityScore": 92,
    "compatibilityLabel": "Ancient Bond",
    "chatId": null
  }
}
//
// Response (200 OK) - Mutual like (match created):
{
  "success": true,
  "message": "It's a match! A new conversation has been created.",
  "data": {
    "matchId": "64f7c2e1b8e2a4c6d9f3e8a6",
    "status": "matched",
    "compatibilityScore": 92,
    "compatibilityLabel": "Ancient Bond",
    "chatId": "64f7c2e1b8e2a4c6d9f3e8a7"
  }
}

// Error (400 - Self-like):
{
  "success": false,
  "message": "You cannot like yourself"
}

// Error (400 - Already liked):
{
  "success": false,
  "message": "You have already liked this user"
}

// Error (400 - Quiz not completed):
{
  "success": false,
  "message": "Target user has not completed the personality quiz"
}

// ============================================
// 4. POST /api/matches/reject/:userId
// ============================================
// Reject a user (exclude from future suggestions)
//
// Request:
//   POST http://localhost:5000/api/matches/reject/64f7c2e1b8e2a4c6d9f3e8a4
//   Headers: Authorization: Bearer {JWT_TOKEN}
//   Body: {} (empty)
//
// Response (200 OK):
{
  "success": true,
  "message": "User rejected",
  "data": {
    "rejected": true
  }
}

// Error (400 - Already rejected):
{
  "success": false,
  "message": "You have already rejected this user"
}

// Error (404 - User not found):
{
  "success": false,
  "message": "User not found"
}

// ============================================
// 5. GET /api/matches/:matchId
// ============================================
// Get details of a specific match
//
// Request:
//   GET http://localhost:5000/api/matches/64f7c2e1b8e2a4c6d9f3e8a6
//   Headers: Authorization: Bearer {JWT_TOKEN}
//
// Response (200 OK):
{
  "success": true,
  "message": "Match details retrieved",
  "data": {
    "matchId": "64f7c2e1b8e2a4c6d9f3e8a6",
    "with": {
      "userId": "64f7c2e1b8e2a4c6d9f3e8a2",
      "name": "Elena",
      "profilePhoto": "https://...",
      "supernaturalType": "Vampire",
      "personalityTraits": {
        "loyalty": 8,
        "aggression": 4,
        "empathy": 7,
        "strategy": 6,
        "dominance": 6,
        "emotionalDepth": 9
      },
      "darkSideProfile": {
        "darkSideName": "The Red Eyes",
        "darkTraits": { ... }
      }
    },
    "compatibility": {
      "score": 87,
      "label": "Eternal Flame",
      "breakdown": {
        "similarityScore": 88,
        "archetypeScore": 85,
        "complementaryScore": 82,
        "storyAlignmentScore": 91,
        "activityScore": 75
      },
      "pairing": "Two powerful presences, naturally possessive of each other"
    },
    "explanation": "Your emotional depths align perfectly. They bring intensity that matches your own, creating a bond that feels inevitable.",
    "status": "matched",
    "chatId": "64f7c2e1b8e2a4c6d9f3e8a7",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}

// Error (403 - Unauthorized):
{
  "success": false,
  "message": "Unauthorized. Can only view your own matches."
}

// Error (404 - Match not found):
{
  "success": false,
  "message": "Match not found"
}

// ============================================
// 6. GET /api/matches/activity/history
// ============================================
// Get matching activity summary
//
// Request:
//   GET http://localhost:5000/api/matches/activity/history
//   Headers: Authorization: Bearer {JWT_TOKEN}
//
// Response (200 OK):
{
  "success": true,
  "message": "Matching activity retrieved",
  "data": {
    "matches": 3,
    "pending": 2,
    "liked": 8,
    "rejected": 5,
    "activityScore": 85
  }
}

// ============================================
// TESTING SCENARIOS
// ============================================
//
// Scenario 1: First-time user
// 1. Verify user completed quiz (check quizCompleted flag)
// 2. GET /api/matches/suggestions → should return eligible candidates
// 3. POST /api/matches/like/:userId → creates pending match
// 4. GET /api/matches → shows pending match
// 5. When target likes back, POST /api/matches/like/:userId again
//    (or when they like you first) → creates Chat, status → "matched"
//
// Scenario 2: Active matcher
// 1. GET /api/matches/activity/history → shows engagement metrics
// 2. POST /api/matches/reject/:userId → excludes from suggestions
// 3. Repeated GET /api/matches/suggestions → never returns rejected users
// 4. GET /api/matches/:matchId → full profile before messaging
//
// Scenario 3: Mutual match flow
// 1. User A: POST /api/matches/like/B → pending
// 2. User B: POST /api/matches/like/A → matched (mutual detected)
// 3. Both: GET /api/matches/:matchId → see full compatibility breakdown
// 4. Both: ready for Phase 5 chat integration (using chatId)
//
// ============================================
// ERROR CODES
// ============================================
//
// 200 OK          - Successful operation
// 400 Bad Request - Validation error (self-like, already liked, etc.)
// 403 Forbidden   - Not authorized for this match
// 404 Not Found   - Resource not found (user, match)
// 500 Server Error - Unexpected error
//
// ============================================
// IMPORTANT NOTES
// ============================================
//
// 1. Authentication:
//    - All endpoints require valid JWT token
//    - Token passed in Authorization: Bearer {token} header
//    - 403 Forbidden if token invalid/expired
//
// 2. Quiz Requirement:
//    - Both users must complete personality quiz first
//    - Cannot match with users who haven't completed quiz
//
// 3. Mutual Match Detection:
//    - If both users like each other → Chat created, status → "matched"
//    - Single like → status remains "pending"
//    - Reject removes from future suggestions
//
// 4. Compatibility Calculation:
//    - Based on: personality similarity (25%), archetype (30%),
//      complementary traits (20%), story alignment (15%), activity (10%)
//    - Score ranges 0-100, includes breakdown for transparency
//
// 5. Activity Score:
//    - +5 points per like sent
//    - Used to normalize matching engagement in compatibility calc
//    - Higher activity = more invested in finding matches
//
// ============================================
