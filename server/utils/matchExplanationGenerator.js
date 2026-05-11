/**
 * Match Explanation Generator
 *
 * Generates human-readable explanations for why two users are compatible.
 * Currently returns mock/template-based explanations.
 * Future phases will integrate Groq API for AI-generated personalized insights.
 *
 * This keeps explanation logic separate from matching logic,
 * making it easy to swap in real AI later.
 */

/**
 * Generate a compatibility explanation
 *
 * Creates a narrative summary of why two users match well.
 * Uses score, traits, and archetypes to tailor the message.
 *
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @param {Object} compatibility - { score, label, breakdown }
 * @returns {string} Human-readable explanation
 */
export const generateMatchExplanation = (user1, user2, compatibility) => {
  const { score, label, breakdown } = compatibility;

  // High compatibility
  if (score >= 80) {
    return generateHighCompatibilityExplanation(user1, user2, breakdown);
  }

  // Medium compatibility
  if (score >= 50) {
    return generateMediumCompatibilityExplanation(user1, user2, breakdown);
  }

  // Low compatibility
  return generateLowCompatibilityExplanation(user1, user2, breakdown);
};

/**
 * High compatibility explanations (80-100)
 */
const generateHighCompatibilityExplanation = (user1, user2, breakdown) => {
  const templates = [
    `Your emotional depths align perfectly. ${user1.name || "They"} bring intensity that matches your own, creating a bond that feels inevitable.`,

    `This is the kind of connection that transcends the supernatural. ${user1.name || "They"} complement your darkness with their own, creating something undeniably powerful.`,

    `Your strategic minds are rare finds for each other. Together, you don't just survive—you thrive.`,

    `There's a magnetic pull here that goes beyond physical attraction. Your personalities orbit each other naturally, creating a gravitational force that's hard to resist.`,

    `This partnership feels written in the stars. Your traits don't just match—they enhance each other, creating something greater than the sum of your parts.`,

    `You've found someone who understands the fire that burns inside you. They don't ask you to dim it; they welcome it.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Medium compatibility explanations (50-79)
 */
const generateMediumCompatibilityExplanation = (user1, user2, breakdown) => {
  const templates = [
    `This connection has potential. Your differences might create friction, but they also create spark. Worth exploring.`,

    `You're not perfect for each other, but that might be what makes this interesting. The unpredictability could be thrilling.`,

    `${user1.name || "They"} brings something different to your world. It might challenge you, but challenges can lead to growth.`,

    `There's chemistry here, though you'll need to work to understand each other. But isn't the best romance built on discovery?`,

    `This pairing is unconventional, but sometimes the best connections are. Your opposing traits might be exactly what each of you needs.`,

    `You have enough common ground to build on, and enough differences to keep things from becoming predictable.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Low compatibility explanations (0-49)
 */
const generateLowCompatibilityExplanation = (user1, user2, breakdown) => {
  const templates = [
    `This might be a case of "opposites attract," but proceed with caution. Your differences are significant.`,

    `The attraction might be there, but compatibility is another matter. This path requires patience and understanding.`,

    `You're entering uncertain territory here. The connection exists, but building something meaningful will require intentional effort.`,

    `Distant echoes. There's something intriguing, but also substantial differences that could be challenging.`,

    `Don't write this off yet. Some of the most unexpected connections bloom in the strangest soil.`,

    `This is a gamble. You might find unexpected depths with ${user1.name || "them"}, or you might discover why you're so different. Only one way to find out.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Get explanation based on specific trait comparison
 *
 * Analyzes which traits are strongest indicators and crafts explanation around them.
 *
 * @param {Object} user1Traits
 * @param {Object} user2Traits
 * @param {number} score
 * @returns {string}
 */
export const generateTraitBasedExplanation = (user1Traits, user2Traits, score) => {
  // Find strongest shared trait
  const traits = ["loyalty", "aggression", "empathy", "strategy", "dominance", "emotionalDepth"];
  let maxSharedTrait = null;
  let maxSharedValue = 0;

  for (const trait of traits) {
    const combined = (user1Traits[trait] || 0) + (user2Traits[trait] || 0);
    if (combined > maxSharedValue) {
      maxSharedValue = combined;
      maxSharedTrait = trait;
    }
  }

  if (!maxSharedTrait) {
    return "A mysterious connection awaits discovery.";
  }

  const traitDescriptions = {
    loyalty: "Your shared commitment to those you love creates an unbreakable foundation.",
    aggression: "You both burn with an intensity that few can understand. Together, you're unstoppable.",
    empathy: "Your capacity to feel deeply for others creates an emotional sanctuary for each other.",
    strategy: "Twin brilliant minds aligned toward the same goals.",
    dominance: "Two strong personalities who respect each other's need for control.",
    emotionalDepth: "Your inner worlds resonate on the same frequency.",
  };

  return traitDescriptions[maxSharedTrait] || "A connection grounded in mutual understanding.";
};

/**
 * Get archetype-specific romantic angle
 *
 * Tailors explanation to archetype pairing for more flavor.
 *
 * @param {string} archetype1
 * @param {string} archetype2
 * @returns {string}
 */
export const getArchetypeRomanticAngle = (archetype1, archetype2) => {
  const angles = {
    "Vampire-Vampire": "Two eternities could never be lonely together.",
    "Vampire-Werewolf": "The hunter meets the hunter. Dangerous. Intoxicating.",
    "Vampire-Witch": "Power and intellect aligned. A force of nature.",
    "Vampire-Hybrid": "You can't predict them. It terrifies and thrills you.",
    "Werewolf-Werewolf": "Pack of two. Loyalty forged in fire.",
    "Werewolf-Witch": "Instinct and intellect dancing together.",
    "Werewolf-Hybrid": "They keep you on your toes. You wouldn't want it any other way.",
    "Witch-Witch": "Two brilliant minds, plotting together.",
    "Witch-Hybrid": "You think you understand them. You're almost right.",
    "Hybrid-Hybrid": "Two storms colliding. Beautiful chaos.",
  };

  const key1 = `${archetype1}-${archetype2}`;
  const key2 = `${archetype2}-${archetype1}`;

  return angles[key1] || angles[key2] || "A connection written in darkness.";
};

/**
 * Get question to prompt further connection
 *
 * Generates conversation starter or ice-breaker.
 *
 * @param {string} archetype1
 * @param {string} archetype2
 * @returns {string}
 */
export const getConnectionQuestion = (archetype1, archetype2) => {
  const questions = [
    "What's the one thing about yourself that scares you most?",
    "Tell me about a choice you made that changed everything.",
    "What does loyalty mean to you?",
    "Who are you when no one's watching?",
    "What would you do if you had nothing left to lose?",
    "What's worth dying for?",
    "What does freedom mean to you?",
    "Tell me your darkest secret.",
    "What's your greatest fear?",
    "Why do you think we matched?",
  ];

  const pairing = `${archetype1}-${archetype2}`;

  // Use pairing as seed for deterministic selection
  const hash = pairing.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return questions[hash % questions.length];
};

/**
 * Full profile explanation for match detail page
 *
 * Combines multiple factors into comprehensive explanation.
 *
 * @param {Object} user1
 * @param {Object} user2
 * @param {Object} compatibility
 * @returns {Object} { summary, angle, question }
 */
export const generateFullMatchExplanation = (user1, user2, compatibility) => {
  return {
    summary: generateMatchExplanation(user1, user2, compatibility),
    angle: getArchetypeRomanticAngle(user1.supernaturalType, user2.supernaturalType),
    question: getConnectionQuestion(user1.supernaturalType, user2.supernaturalType),
  };
};
