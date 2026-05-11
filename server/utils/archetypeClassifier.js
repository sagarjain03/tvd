/**
 * Archetype Classifier Utility
 *
 * This module implements the supernatural archetype classification logic.
 * It takes raw personality trait scores and classifies users into one of four archetypes:
 * Vampire, Werewolf, Witch, or Hybrid.
 *
 * Classification uses Euclidean distance to find the closest match to each archetype's ideal profile.
 */

/**
 * Archetype trait weight profiles
 * Each archetype has ideal scores for each trait on a 0–10 scale
 *
 * VAMPIRE: High emotional depth, loyalty, and dominance
 *   - Complex, intense, deeply connected to others
 *   - Protective but commanding
 *   - Values tradition and lasting bonds
 *
 * WEREWOLF: High aggression, loyalty, and moderate dominance
 *   - Fiercely protective pack mentality
 *   - Direct, physical, action-oriented
 *   - Impulsive but deeply committed
 *
 * WITCH: High strategy, empathy, and emotional depth
 *   - Intellectual, analytical, compassionate
 *   - Manipulates situations through intelligence and understanding
 *   - Balanced mix of head and heart
 *
 * HYBRID: High aggression, dominance, with mixed everything
 *   - Unpredictable blend of all traits
 *   - Chaotic but powerful
 *   - No clear allegiance to one approach
 */
const ARCHETYPE_PROFILES = {
  Vampire: {
    loyalty: 8,
    aggression: 4,
    empathy: 5,
    strategy: 6,
    dominance: 8,
    emotionalDepth: 9,
  },
  Werewolf: {
    loyalty: 9,
    aggression: 8,
    empathy: 4,
    strategy: 3,
    dominance: 6,
    emotionalDepth: 5,
  },
  Witch: {
    loyalty: 6,
    aggression: 2,
    empathy: 8,
    strategy: 9,
    dominance: 5,
    emotionalDepth: 7,
  },
  Hybrid: {
    loyalty: 5,
    aggression: 7,
    empathy: 4,
    strategy: 6,
    dominance: 9,
    emotionalDepth: 6,
  },
};

/**
 * Calculate Euclidean distance between user's traits and archetype's ideal profile
 * Lower distance = better match
 *
 * @param {Object} userTraits - Normalized user trait scores
 * @param {Object} archetypeProfile - Archetype's ideal trait profile
 * @returns {number} Euclidean distance
 */
const calculateDistance = (userTraits, archetypeProfile) => {
  let sumSquares = 0;

  for (const trait in archetypeProfile) {
    const userScore = userTraits[trait] || 0;
    const profileScore = archetypeProfile[trait];
    const diff = userScore - profileScore;
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
};

/**
 * Normalize raw trait scores to 0–10 scale
 *
 * Max possible raw score per trait:
 * - 15 questions × max impact per question = varies per question
 * - Theoretical max = +30 per trait (if every answer maxes that trait)
 * - Theoretical min = -30 per trait (rare, but possible)
 *
 * We clamp normalized scores to 0–10 range
 *
 * @param {Object} rawTraits - Raw accumulated trait scores
 * @returns {Object} Normalized traits (0–10 scale)
 */
const normalizeTraits = (rawTraits) => {
  const maxPossible = 30; // Conservative max: 15 questions × 2 points per question
  const normalized = {};

  for (const trait in rawTraits) {
    // Raw score could be negative, so we normalize and clamp to [0, 10]
    let normalized_value = (rawTraits[trait] / maxPossible) * 10;
    normalized[trait] = Math.min(10, Math.max(0, normalized_value));
  }

  return normalized;
};

/**
 * Classify user into supernatural archetype based on personality traits
 *
 * @param {Object} rawTraits - Raw trait scores from quiz submission
 *   Format: { loyalty: 5, aggression: -2, empathy: 8, strategy: 12, dominance: 4, emotionalDepth: 9 }
 *
 * @returns {Object} Classification result
 *   {
 *     archetype: "Vampire" | "Werewolf" | "Witch" | "Hybrid",
 *     traits: { loyalty: 5.2, aggression: 0, ... } (normalized 0–10)
 *   }
 */
export const classifyArchetype = (rawTraits) => {
  // Normalize traits to 0–10 scale
  const normalizedTraits = normalizeTraits(rawTraits);

  let closestArchetype = null;
  let minDistance = Infinity;

  // Find archetype with smallest distance (best match)
  for (const [archetype, profile] of Object.entries(ARCHETYPE_PROFILES)) {
    const distance = calculateDistance(normalizedTraits, profile);

    if (distance < minDistance) {
      minDistance = distance;
      closestArchetype = archetype;
    }
  }

  return {
    archetype: closestArchetype || "Hybrid", // Fallback (shouldn't happen)
    traits: normalizedTraits,
  };
};

/**
 * Get archetype profile for a given archetype type
 * Useful for displaying archetype characteristics in UI
 *
 * @param {string} archetypeName - Archetype name
 * @returns {Object|null} Archetype profile or null if not found
 */
export const getArchetypeProfile = (archetypeName) => {
  return ARCHETYPE_PROFILES[archetypeName] || null;
};

/**
 * Get all available archetypes
 *
 * @returns {Array<string>} List of archetype names
 */
export const getAvailableArchetypes = () => {
  return Object.keys(ARCHETYPE_PROFILES);
};
