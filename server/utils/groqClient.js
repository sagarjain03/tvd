import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || "llama3-70b-8192";

// ─── UTILITY: Parse AI response safely ────────────────────────────────────────
// Handles markdown code fences and malformed JSON gracefully
const safeParseJSON = (text) => {
  try {
    // Remove markdown code fences if present
    const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
};

// ─── PERSONALITY INSIGHT ─────────────────────────────────────────────────────
// Generates a mystical personality analysis from Groq for a user
export const generatePersonalityInsight = async (user) => {
  const { supernaturalType, personalityTraits, name } = user;

  const prompt = `
You are an ancient oracle in the world of The Vampire Diaries.
Analyze this supernatural being and return ONLY a JSON object with no extra text.

Name: ${name}
Supernatural Type: ${supernaturalType}
Trait Scores (0-10 scale):
- Loyalty: ${personalityTraits.loyalty.toFixed(1)}
- Aggression: ${personalityTraits.aggression.toFixed(1)}
- Empathy: ${personalityTraits.empathy.toFixed(1)}
- Strategy: ${personalityTraits.strategy.toFixed(1)}
- Dominance: ${personalityTraits.dominance.toFixed(1)}
- Emotional Depth: ${personalityTraits.emotionalDepth.toFixed(1)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence poetic description of this being's essence as a ${supernaturalType}",
  "strengths": ["strength 1 in the vampire diaries world", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "idealPartner": "1-2 sentence description of who would balance or complete this supernatural being",
  "powerPhrase": "One iconic line that captures their essence (under 15 words)"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle in the world of The Vampire Diaries. Speak poetically but concisely. Always respond with valid JSON only — no markdown, no preamble.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 600,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse AI insight response");
  }

  return parsed;
};

// ─── MATCH EXPLANATION ────────────────────────────────────────────────────────
// Analyzes supernatural chemistry between two matched users
export const generateMatchExplanation = async (user1, user2, compatibilityScore, compatibilityLabel) => {
  const prompt = `
You are an ancient oracle in the world of The Vampire Diaries.
Explain the supernatural connection between two beings. Return ONLY a JSON object.

Being 1: ${user1.name} (${user1.supernaturalType})
Traits: Loyalty ${user1.personalityTraits.loyalty.toFixed(1)}, Empathy ${user1.personalityTraits.empathy.toFixed(1)}, Dominance ${user1.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user1.personalityTraits.emotionalDepth.toFixed(1)}

Being 2: ${user2.name} (${user2.supernaturalType})
Traits: Loyalty ${user2.personalityTraits.loyalty.toFixed(1)}, Empathy ${user2.personalityTraits.empathy.toFixed(1)}, Dominance ${user2.personalityTraits.dominance.toFixed(1)}, Emotional Depth ${user2.personalityTraits.emotionalDepth.toFixed(1)}

Compatibility: ${compatibilityScore}% — "${compatibilityLabel}"

Return this exact JSON:
{
  "explanation": "2-3 sentences describing why these two supernatural beings are drawn to each other",
  "tension": "1 sentence about the conflict or challenge in their connection",
  "potential": "1 sentence about what they could become together"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle in the world of The Vampire Diaries. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 400,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse match explanation response");
  }

  return parsed;
};

// ─── BATTLE MODE RESULT ──────────────────────────────────────────────────────
// Generates chemistry analysis from Battle Mode scenario responses
export const generateBattleResult = async (user1, user2, scenario, answer1, answer2) => {
  const prompt = `
You are an oracle in the world of The Vampire Diaries analyzing supernatural chemistry.
Two beings answered the same scenario. Compare their responses and reveal their chemistry.
Return ONLY a JSON object.

Scenario: "${scenario}"

${user1.name} (${user1.supernaturalType}) answered: "${answer1}"
${user2.name} (${user2.supernaturalType}) answered: "${answer2}"

Return this exact JSON:
{
  "chemistryScore": <number 0-100>,
  "chemistryLabel": "<one of: 'Magnetic', 'Kindred', 'Volatile', 'Neutral', 'Transcendent'>",
  "analysis": "2-3 sentences comparing their responses and what it reveals about their dynamic",
  "agreementAreas": ["area of alignment 1", "area of alignment 2"],
  "tensionAreas": ["potential clash 1"],
  "verdict": "One sentence dramatic verdict about their connection based on these answers"
}
`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an oracle analyzing supernatural chemistry. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  const parsed = safeParseJSON(raw);

  if (!parsed) {
    throw new Error("Failed to parse battle result response");
  }

  return parsed;
};
