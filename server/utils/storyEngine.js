/**
 * Story Engine Utility
 *
 * Core logic for story progression and decision handling.
 * Keeps story business logic separate from controller code.
 */

/**
 * Get story chapter by ID
 *
 * @param {Array} storyData - Full story data array
 * @param {number} chapterId - Chapter to retrieve (1, 2, 3, etc.)
 * @returns {Object|null} Chapter object or null if not found
 */
export const getChapterById = (storyData, chapterId) => {
  if (!Array.isArray(storyData) || chapterId < 1) {
    return null;
  }
  return storyData.find((ch) => ch.chapterId === chapterId) || null;
};

/**
 * Get decision within a chapter
 *
 * @param {Object} chapter - Chapter object
 * @param {string} decisionId - Decision to find (e.g., "d_1_1")
 * @returns {Object|null} Decision object or null if not found
 */
export const getDecisionInChapter = (chapter, decisionId) => {
  if (!chapter || !chapter.decisions) {
    return null;
  }
  return chapter.decisions.find((d) => d.decisionId === decisionId) || null;
};

/**
 * Get specific option from a decision
 *
 * @param {Object} decision - Decision object
 * @param {number} optionIndex - Option index (0-indexed)
 * @returns {Object|null} Option object or null if not found
 */
export const getOptionFromDecision = (decision, optionIndex) => {
  if (!decision || !decision.options) {
    return null;
  }
  if (optionIndex < 0 || optionIndex >= decision.options.length) {
    return null;
  }
  return decision.options[optionIndex] || null;
};

/**
 * Validate story decision input
 *
 * @param {Object} input - User input { chapter, decisionId, selectedOption }
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateDecisionInput = (input) => {
  if (!input) {
    return { valid: false, error: "Decision input is required" };
  }

  if (input.chapter === undefined || input.chapter === null) {
    return { valid: false, error: "Chapter is required" };
  }

  if (typeof input.chapter !== "number" || input.chapter < 1) {
    return { valid: false, error: "Chapter must be a positive number" };
  }

  if (!input.decisionId || typeof input.decisionId !== "string") {
    return { valid: false, error: "Decision ID is required and must be a string" };
  }

  if (input.selectedOption === undefined || input.selectedOption === null) {
    return { valid: false, error: "Selected option is required" };
  }

  const optionIdx = parseInt(input.selectedOption);
  if (isNaN(optionIdx) || optionIdx < 0) {
    return { valid: false, error: "Selected option must be a valid index" };
  }

  return { valid: true };
};

/**
 * Calculate story completion percentage
 *
 * @param {number} decisionsInChapter - Decisions completed in current chapter
 * @param {number} totalDecisionsInChapter - Total decisions available
 * @param {number} currentChapter - Current chapter (1, 2, 3)
 * @param {number} totalChapters - Total chapters available (default 3)
 * @returns {number} Completion percentage (0-100)
 */
export const calculateCompletionPercentage = (
  decisionsInChapter,
  totalDecisionsInChapter,
  currentChapter,
  totalChapters = 3
) => {
  // Each chapter represents 1/totalChapters of the story
  const chapterProgress = (currentChapter / totalChapters) * 100;

  // Within chapter, decisions represent progress toward next chapter
  let withinChapterProgress = 0;
  if (totalDecisionsInChapter > 0) {
    const chapterSize = 100 / totalChapters;
    withinChapterProgress =
      ((decisionsInChapter / totalDecisionsInChapter) * chapterSize) / totalChapters;
  }

  return Math.round(chapterProgress + withinChapterProgress * 100);
};

/**
 * Determine if all decisions in a chapter have been made
 *
 * @param {Array<Object>} storyDecisions - User's story decisions
 * @param {number} chapter - Chapter number
 * @param {number} requiredDecisions - Number of decisions to complete chapter
 * @returns {boolean} True if chapter is complete
 */
export const isChapterComplete = (storyDecisions, chapter, requiredDecisions) => {
  const chapDecisions = storyDecisions.filter((d) => d.chapter === chapter);
  return chapDecisions.length >= requiredDecisions;
};

/**
 * Get next chapter number (for progression)
 *
 * @param {number} currentChapter - Current chapter
 * @param {number} totalChapters - Total chapters (default 3)
 * @returns {number|null} Next chapter or null if at end
 */
export const getNextChapter = (currentChapter, totalChapters = 3) => {
  if (currentChapter >= totalChapters) {
    return null;
  }
  return currentChapter + 1;
};

/**
 * Build story context narrative (for future AI use)
 *
 * Prepares a narrative summary of decisions made so far.
 * Can be used with Groq API to generate contextual responses.
 *
 * @param {Array<Object>} storyDecisions - User decisions made
 * @param {Object} storyData - Full story data
 * @returns {string} Narrative summary
 */
export const buildStoryContext = (storyDecisions, storyData) => {
  if (!storyDecisions || storyDecisions.length === 0) {
    return "You've just arrived in Mystic Falls, untouched by the supernatural.";
  }

  const summary = storyDecisions
    .map((decision) => {
      const chapter = getChapterById(storyData, decision.chapter);
      if (!chapter) return null;

      const choiceDesc = decision.selectedText || "made a choice";
      const consequence = decision.consequence || "";

      return `Chapter ${decision.chapter}: ${choiceDesc}. ${consequence}`;
    })
    .filter(Boolean)
    .join(" ");

  return summary || "Your story unfolds...";
};
