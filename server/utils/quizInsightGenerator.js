/**
 * Quiz Insight Generator Utility
 *
 * Generates personality insights based on quiz results and supernatural archetype.
 * Currently returns mock/placeholder summaries.
 * Future phases will integrate Groq LLaMA API for AI-generated insights.
 *
 * This keeps the logic separated from the controller and makes it easy
 * to swap in real AI later without touching the controller code.
 */

/**
 * Mock insight templates for each archetype
 * These are placeholder narratives. Phase 6 will replace these with Groq API calls.
 */
const ARCHETYPE_INSIGHTS = {
  Vampire: {
    summary:
      "This Vampire personality is emotionally intense, deeply loyal, and possesses a commanding presence. You feel everything with full force and guard those you love fiercely. Your greatest strength lies in your ability to understand complex emotions and navigate human connection with sophistication.",
    strengths: [
      "Emotional depth and authenticity",
      "Fierce loyalty to chosen ones",
      "Natural magnetism and influence",
      "Complex understanding of relationships",
    ],
    challenges: [
      "Tendency to be possessive",
      "Difficulty letting go of grudges",
      "Intense emotional swings",
      "High standards for others",
    ],
    compatibility:
      "Vampires thrive with partners who can match their emotional intensity and appreciate their protective nature. Werewolves and fellow Vampires often create powerful partnerships.",
  },
  Werewolf: {
    summary:
      "This Werewolf personality thrives on action, loyalty, and protection. You are fiercely protective of your inner circle and lead through direct action rather than manipulation. Your strength comes from your instincts, physical presence, and unwavering commitment to those you call family.",
    strengths: [
      "Fierce protectiveness and loyalty",
      "Instinctive decision-making",
      "Physical confidence and presence",
      "Deep sense of community",
    ],
    challenges: [
      "Tendency toward aggression",
      "Difficulty with strategic thinking",
      "Impulsivity under stress",
      "Limited emotional expression",
    ],
    compatibility:
      "Werewolves pair well with those who value directness and loyalty. Vampires provide strategic balance, while other Werewolves create strong pack dynamics.",
  },
  Witch: {
    summary:
      "This Witch personality combines intellectual brilliance with deep empathy. You see patterns others miss and use knowledge as your greatest tool. Your ability to understand both logic and emotion makes you a natural strategist and advisor. You balance compassion with cold analysis.",
    strengths: [
      "Strategic thinking and planning",
      "Empathic understanding",
      "Intellectual curiosity",
      "Ability to see multiple perspectives",
    ],
    challenges: [
      "Tendency to overthink",
      "Difficulty making emotional decisions",
      "Can appear cold or detached",
      "Analysis paralysis",
    ],
    compatibility:
      "Witches seek intellectual partners who can engage in meaningful conversation. Fellow Witches often create harmonious partnerships, while Vampires provide emotional depth they crave.",
  },
  Hybrid: {
    summary:
      "This Hybrid personality defies categorization. You are a unique blend of all archetypes—unpredictable, powerful, and impossible to pin down. You possess conflicting traits that somehow work in harmony. Your greatest power is your adaptability and refusal to be limited by a single identity.",
    strengths: [
      "Versatility and adaptability",
      "Broad skill set across multiple areas",
      "Charismatic and magnetic presence",
      "Able to handle complex situations",
    ],
    challenges: [
      "Internal conflicts between traits",
      "Difficulty finding like-minded partners",
      "Inconsistency in approach",
      "May seem unstable to others",
    ],
    compatibility:
      "Hybrids need partners who can appreciate their complexity and contradiction. Other Hybrids understand this duality, while confident individuals of any archetype can match their unpredictability.",
  },
};

/**
 * Generate a personalized insight summary for a user's quiz results
 *
 * @param {string} archetype - User's supernatural archetype (Vampire, Werewolf, Witch, Hybrid)
 * @param {Object} traits - Normalized personality traits (0–10 scale)
 *   Format: { loyalty, aggression, empathy, strategy, dominance, emotionalDepth }
 *
 * @returns {Object} Insight object
 *   {
 *     summary: "Long-form narrative insight",
 *     strengths: ["array", "of", "strengths"],
 *     challenges: ["array", "of", "challenges"],
 *     compatibility: "Narrative about relationship compatibility"
 *   }
 */
export const generateInsight = (archetype, traits) => {
  if (!ARCHETYPE_INSIGHTS[archetype]) {
    return {
      summary: "Your personality is uniquely your own. Continue exploring.",
      strengths: [],
      challenges: [],
      compatibility: "Seek partners who value authenticity.",
    };
  }

  const baseInsight = ARCHETYPE_INSIGHTS[archetype];

  // Future enhancement: Customize insight based on specific trait combinations
  // For now, return the base template
  // Example: If Vampire has low loyalty trait, adjust the summary
  // Future Groq call would do this: `const customized = await groqClient.generatePersonalizedInsight(archetype, traits)`

  return {
    summary: baseInsight.summary,
    strengths: baseInsight.strengths,
    challenges: baseInsight.challenges,
    compatibility: baseInsight.compatibility,
  };
};

/**
 * Generate a short tagline for an archetype
 * Useful for UI display and profile cards
 *
 * @param {string} archetype - Supernatural archetype
 * @returns {string} Short narrative tagline
 */
export const getArchetypeTagline = (archetype) => {
  const taglines = {
    Vampire:
      "Emotionally intense. Fiercely loyal. Dangerously sophisticated.",
    Werewolf: "Protective. Instinctive. Uncompromisingly loyal.",
    Witch: "Intelligent. Empathic. Strategically unpredictable.",
    Hybrid: "Undefined. Unpredictable. Impossibly magnetic.",
  };

  return taglines[archetype] || "Authentically yourself.";
};

/**
 * Generate random personality insights for testing
 * (Not used in production, but useful for frontend development before backend is ready)
 *
 * @returns {Object} Random insight
 */
export const getRandomInsight = () => {
  const archetypes = Object.keys(ARCHETYPE_INSIGHTS);
  const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  return {
    archetype: randomArchetype,
    insight: ARCHETYPE_INSIGHTS[randomArchetype],
  };
};
