/**
 * Compatibility Engine
 *
 * Core matching algorithm that calculates compatibility between two users.
 * Uses multiple factors:
 * - Personality trait similarity (cosine similarity)
 * - Archetype compatibility (matrix-based)
 * - Complementary traits (balance scoring)
 * - Story decision alignment
 * - Activity score normalization
 *
 * Returns score 0-100 with label and breakdown.
 */

/**
 * Archetype compatibility matrix
 * Values represent natural chemistry between types (0.0 – 1.0)
 * Based on Vampire Diaries supernatural dynamics
 */
const ARCHETYPE_MATRIX = {
  Vampire: {
    Vampire: 0.65, // Self-assured but possessive
    Werewolf: 0.50, // Predators vs predators - conflict
    Witch: 0.90, // Strategic mind meets emotional depth
    Hybrid: 0.60, // Unpredictability concerns vampire
  },
  Werewolf: {
    Vampire: 0.50, // Pack loyalty vs singular bond
    Werewolf: 0.70, // Pack synergy
    Witch: 0.75, // Instinct + strategy balance
    Hybrid: 0.85, // Chaos meets raw energy
  },
  Witch: {
    Vampire: 0.90, // Both strategic and powerful
    Werewolf: 0.75, // Balance of intellect and instinct
    Witch: 0.55, // Too similar - competing strategies
    Hybrid: 0.65, // Can't predict hybrid nature
  },
  Hybrid: {
    Vampire: 0.60, // Vampire finds hybrid unstable
    Werewolf: 0.85, // Werewolf thrives on hybrid chaos
    Witch: 0.65, // Strategy can't anticipate hybrid
    Hybrid: 0.45, // Two hybrids - too chaotic
  },
};

/**
 * Compatibility labels for display
 * Selected based on score and archetype pairing
 */
const COMPATIBILITY_LABELS = {
  high: [
    "Ancient Bond",
    "Fated Connection",
    "Eternal Flame",
    "Soul Recognition",
    "Kindred Spirits",
  ],
  medium: [
    "Unlikely Alliance",
    "Magnetic Pull",
    "Rising Chemistry",
    "Dangerous Attraction",
    "Moonlit Chaos",
  ],
  low: [
    "Curious Strangers",
    "Potential Spark",
    "Distant Echoes",
    "Untested Waters",
    "Stormy Skies",
  ],
};

/**
 * Calculate cosine similarity between two trait vectors
 *
 * Measures how aligned two users' personalities are.
 * Returns value between 0 and 1.
 *
 * @param {Object} traitsA - First user's traits
 * @param {Object} traitsB - Second user's traits
 * @returns {number} Similarity score (0-1)
 */
export const cosineSimilarity = (traitsA, traitsB) => {
  const keys = [
    "loyalty",
    "aggression",
    "empathy",
    "strategy",
    "dominance",
    "emotionalDepth",
  ];

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const key of keys) {
    const a = traitsA[key] || 0;
    const b = traitsB[key] || 0;

    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
};

/**
 * Calculate complementary score
 *
 * Measures how well traits balance each other.
 * High when one is strong where the other is weak.
 *
 * Examples:
 * - High empathy complements high aggression
 * - High strategy complements high emotionalDepth
 *
 * @param {Object} traitsA - First user's traits
 * @param {Object} traitsB - Second user's traits
 * @returns {number} Complementary score (0-1)
 */
export const calculateComplementaryScore = (traitsA, traitsB) => {
  const pairings = [
    { trait1: "empathy", trait2: "aggression" },
    { trait1: "strategy", trait2: "emotionalDepth" },
    { trait1: "dominance", trait2: "loyalty" },
  ];

  let totalComplement = 0;
  let count = 0;

  for (const pairing of pairings) {
    const a1 = traitsA[pairing.trait1] || 0;
    const b1 = traitsB[pairing.trait1] || 0;
    const a2 = traitsA[pairing.trait2] || 0;
    const b2 = traitsB[pairing.trait2] || 0;

    // If one is high and other is low, they complement
    const complement1 = 1 - Math.abs(a1 - b1) / 10; // Normalize by max trait value
    const complement2 = 1 - Math.abs(a2 - b2) / 10;

    totalComplement += (complement1 + complement2) / 2;
    count += 1;
  }

  const avgComplement = count > 0 ? totalComplement / count : 0;
  return Math.max(0, Math.min(1, avgComplement));
};

/**
 * Get archetype compatibility score
 *
 * @param {string} archetype1 - First user's archetype
 * @param {string} archetype2 - Second user's archetype
 * @returns {number} Compatibility (0-1)
 */
export const getArchetypeCompatibility = (archetype1, archetype2) => {
  if (!ARCHETYPE_MATRIX[archetype1] || !ARCHETYPE_MATRIX[archetype1][archetype2]) {
    return 0.5; // Default if unknown pairing
  }
  return ARCHETYPE_MATRIX[archetype1][archetype2];
};

/**
 * Calculate story alignment score
 *
 * Compare decisions made in story mode.
 * Similar sacrifice decisions = higher emotional connection.
 * Opposite loyalty choices = lower trust score.
 *
 * @param {Array} decisionsA - First user's story decisions
 * @param {Array} decisionsB - Second user's story decisions
 * @returns {number} Alignment score (0-1)
 */
export const calculateStoryAlignment = (decisionsA, decisionsB) => {
  // If either user hasn't completed story, neutral score
  if (!decisionsA || !decisionsB || decisionsA.length === 0 || decisionsB.length === 0) {
    return 0.5;
  }

  // Simple approach: compare trait impacts across decisions
  let alignmentSum = 0;
  let comparisons = 0;

  // Compare overlapping decisions
  const maxLen = Math.min(decisionsA.length, decisionsB.length);

  for (let i = 0; i < maxLen; i++) {
    const decA = decisionsA[i];
    const decB = decisionsB[i];

    if (!decA || !decB || !decA.traitImpact || !decB.traitImpact) continue;

    // Compare trait impacts
    let impactSimilarity = 0;
    const traits = ["loyalty", "aggression", "empathy", "strategy", "dominance", "emotionalDepth"];

    for (const trait of traits) {
      const impactA = decA.traitImpact[trait] || 0;
      const impactB = decB.traitImpact[trait] || 0;
      // Similar impact direction = more aligned
      const similarity = 1 - Math.abs(impactA - impactB) / 6; // Max impact is ±3
      impactSimilarity += similarity;
    }

    alignmentSum += impactSimilarity / traits.length;
    comparisons += 1;
  }

  const avgAlignment = comparisons > 0 ? alignmentSum / comparisons : 0.5;
  return Math.max(0, Math.min(1, avgAlignment));
};

/**
 * Normalize activity score
 *
 * Converts raw activity score to 0-1 scale.
 * Higher activity = more invested in finding matches.
 *
 * @param {number} activityScore - User's activity score
 * @returns {number} Normalized score (0-1)
 */
export const normalizeActivityScore = (activityScore) => {
  // Assume max reasonable activity is 500
  // Adjust based on actual distribution later
  const maxActivity = 500;
  return Math.min(1, Math.max(0, activityScore / maxActivity));
};

/**
 * Select compatibility label
 *
 * Chooses appropriate label based on score and archetype pairing.
 *
 * @param {number} score - Compatibility score (0-100)
 * @param {string} archetype1 - First archetype
 * @param {string} archetype2 - Second archetype
 * @returns {string} Label
 */
export const selectCompatibilityLabel = (score, archetype1, archetype2) => {
  let labelSet;

  if (score >= 80) {
    labelSet = COMPATIBILITY_LABELS.high;
  } else if (score >= 50) {
    labelSet = COMPATIBILITY_LABELS.medium;
  } else {
    labelSet = COMPATIBILITY_LABELS.low;
  }

  // Hash archetype pairing to select deterministic label
  const pairingHash = (archetype1.charCodeAt(0) + archetype2.charCodeAt(0)) % labelSet.length;
  return labelSet[pairingHash];
};

/**
 * Calculate final compatibility score and breakdown
 *
 * Main function that orchestrates all compatibility calculations.
 * Uses weighted average of multiple factors.
 *
 * @param {Object} user1 - First user document with traits, archetype, decisions
 * @param {Object} user2 - Second user document
 * @returns {Object} { score, label, breakdown }
 */
export const calculateCompatibility = (user1, user2) => {
  // Extract traits
  const traits1 = user1.personalityTraits || {};
  const traits2 = user2.personalityTraits || {};

  // Extract archetypes
  const archetype1 = user1.supernaturalType || "Hybrid";
  const archetype2 = user2.supernaturalType || "Hybrid";

  // Component scores (0-1)
  const similarityScore = cosineSimilarity(traits1, traits2);
  const archetypeScore = getArchetypeCompatibility(archetype1, archetype2);
  const complementaryScore = calculateComplementaryScore(traits1, traits2);
  const activityScore =
    (normalizeActivityScore(user1.activityScore || 0) +
      normalizeActivityScore(user2.activityScore || 0)) /
    2;

  // Story alignment - requires decision history
  let storyAlignmentScore = 0.5; // Default neutral
  if (user1.storyDecisions && user2.storyDecisions) {
    storyAlignmentScore = calculateStoryAlignment(user1.storyDecisions, user2.storyDecisions);
  }

  // Weighted average (all weights sum to 1.0)
  const weights = {
    similarity: 0.25,
    archetype: 0.30,
    complementary: 0.20,
    storyAlignment: 0.15,
    activity: 0.10,
  };

  const finalScore =
    similarityScore * weights.similarity +
    archetypeScore * weights.archetype +
    complementaryScore * weights.complementary +
    storyAlignmentScore * weights.storyAlignment +
    activityScore * weights.activity;

  // Convert to 0-100 scale
  const score = Math.round(finalScore * 100);

  // Select label
  const label = selectCompatibilityLabel(score, archetype1, archetype2);

  // Breakdown for display
  const breakdown = {
    similarityScore: Math.round(similarityScore * 100),
    archetypeScore: Math.round(archetypeScore * 100),
    complementaryScore: Math.round(complementaryScore * 100),
    storyAlignmentScore: Math.round(storyAlignmentScore * 100),
    activityScore: Math.round(activityScore * 100),
  };

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    breakdown,
  };
};

/**
 * Get archetype pairing description
 *
 * Human-readable description of archetype chemistry.
 *
 * @param {string} archetype1
 * @param {string} archetype2
 * @returns {string} Description
 */
export const getArchetypePairingDescription = (archetype1, archetype2) => {
  const pairings = {
    "Vampire-Vampire": "Two powerful presences, naturally possessive of each other",
    "Vampire-Werewolf": "Predator meets predator - intense but potentially volatile",
    "Vampire-Witch": "Strategic minds aligned with emotional depth",
    "Vampire-Hybrid": "Unpredictability concerns the control-seeking vampire",
    "Werewolf-Werewolf": "Pack unity and protective instincts strengthen the bond",
    "Werewolf-Witch": "Instinct balances intellect in powerful synergy",
    "Werewolf-Hybrid": "Werewolf thrives on the chaos of hybrid nature",
    "Witch-Witch": "Twin intellects may compete for dominance",
    "Witch-Hybrid": "Strategy cannot fully predict hybrid impulses",
    "Hybrid-Hybrid": "Chaos meets chaos - thrilling but unstable",
  };

  const key1 = `${archetype1}-${archetype2}`;
  const key2 = `${archetype2}-${archetype1}`;

  return pairings[key1] || pairings[key2] || "A unique supernatural connection";
};
