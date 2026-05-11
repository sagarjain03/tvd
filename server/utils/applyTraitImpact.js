/**
 * Trait Impact Utility
 *
 * Handles safe application of trait changes from story decisions.
 * Ensures values stay within bounds and archetype evolution is accurate.
 */

/**
 * Apply trait impacts from a decision to a user's personality traits
 *
 * @param {Object} currentTraits - User's current traits (0-10 scale)
 *   { loyalty, aggression, empathy, strategy, dominance, emotionalDepth }
 * @param {Object} traitImpact - Impact to apply
 *   { loyalty: 1, aggression: -1, ... }
 * @returns {Object} Updated traits, clamped to [0, 10]
 */
export const applyTraitImpact = (currentTraits, traitImpact) => {
  const updated = { ...currentTraits };

  // Apply each trait impact
  for (const [trait, impact] of Object.entries(traitImpact)) {
    if (updated.hasOwnProperty(trait)) {
      // Apply impact and clamp to [0, 10]
      updated[trait] = Math.min(10, Math.max(0, updated[trait] + impact));
    }
  }

  return updated;
};

/**
 * Apply multiple trait impacts sequentially
 *
 * Useful for applying all decisions made in a chapter at once.
 *
 * @param {Object} baseTraits - Starting traits
 * @param {Array<Object>} impactList - Array of trait impacts to apply
 * @returns {Object} Final traits after all impacts
 */
export const applyMultipleTraitImpacts = (baseTraits, impactList) => {
  let traits = { ...baseTraits };

  for (const impact of impactList) {
    traits = applyTraitImpact(traits, impact);
  }

  return traits;
};

/**
 * Merge trait impacts
 *
 * Combines multiple trait impacts into a single impact object.
 * Useful for calculating net effect of all decisions in a chapter.
 *
 * @param {Array<Object>} impacts - Array of impact objects
 * @returns {Object} Merged impact
 */
export const mergeTraitImpacts = (impacts) => {
  const merged = {
    loyalty: 0,
    aggression: 0,
    empathy: 0,
    strategy: 0,
    dominance: 0,
    emotionalDepth: 0,
  };

  for (const impact of impacts) {
    for (const [trait, value] of Object.entries(impact)) {
      if (merged.hasOwnProperty(trait)) {
        merged[trait] += value;
      }
    }
  }

  return merged;
};

/**
 * Check if a trait change would significantly shift archetype
 *
 * This is a simple heuristic. A "significant" change means
 * a trait has increased or decreased by 2+ points.
 *
 * @param {Object} oldTraits - Traits before decision
 * @param {Object} newTraits - Traits after decision
 * @returns {boolean} True if change is significant
 */
export const isSignificantTraitChange = (oldTraits, newTraits) => {
  const threshold = 2;

  for (const trait of Object.keys(oldTraits)) {
    const diff = Math.abs((newTraits[trait] || 0) - (oldTraits[trait] || 0));
    if (diff >= threshold) {
      return true;
    }
  }

  return false;
};

/**
 * Get trait change summary
 *
 * Creates a human-readable summary of trait changes.
 * Useful for player feedback.
 *
 * @param {Object} oldTraits - Traits before
 * @param {Object} newTraits - Traits after
 * @returns {Object} { increased: [], decreased: [] }
 */
export const getTraitChangeSummary = (oldTraits, newTraits) => {
  const increased = [];
  const decreased = [];

  for (const trait of Object.keys(oldTraits)) {
    const oldVal = oldTraits[trait] || 0;
    const newVal = newTraits[trait] || 0;
    const change = newVal - oldVal;

    if (change > 0) {
      increased.push({ trait, change });
    } else if (change < 0) {
      decreased.push({ trait, change: Math.abs(change) });
    }
  }

  // Sort by magnitude
  increased.sort((a, b) => b.change - a.change);
  decreased.sort((a, b) => b.change - a.change);

  return {
    increased: increased.map((t) => `${t.trait} +${t.change}`),
    decreased: decreased.map((t) => `${t.trait} -${t.change}`),
  };
};

/**
 * Validate trait values
 *
 * Ensures all traits are within valid range [0, 10].
 *
 * @param {Object} traits - Traits to validate
 * @returns {boolean} True if all traits are valid
 */
export const validateTraitBounds = (traits) => {
  for (const [trait, value] of Object.entries(traits)) {
    if (value < 0 || value > 10) {
      return false;
    }
  }
  return true;
};

/**
 * Calculate trait "momentum"
 *
 * Shows which trait is being reinforced most by decisions.
 * Useful for narrative feedback.
 *
 * @param {Array<Object>} storyDecisions - Array of decisions made
 * @returns {Object} { trait: "loyalty", momentum: 5 }
 */
export const calculateTraitMomentum = (storyDecisions) => {
  const momentum = {
    loyalty: 0,
    aggression: 0,
    empathy: 0,
    strategy: 0,
    dominance: 0,
    emotionalDepth: 0,
  };

  for (const decision of storyDecisions) {
    if (!decision.traitImpact) continue;

    for (const [trait, impact] of Object.entries(decision.traitImpact)) {
      if (momentum.hasOwnProperty(trait)) {
        momentum[trait] += impact;
      }
    }
  }

  // Find trait with highest momentum
  let maxTrait = "loyalty";
  let maxValue = momentum.loyalty;

  for (const [trait, value] of Object.entries(momentum)) {
    if (Math.abs(value) > Math.abs(maxValue)) {
      maxTrait = trait;
      maxValue = value;
    }
  }

  return {
    trait: maxTrait,
    momentum: maxValue,
    allMomentum: momentum,
  };
};
