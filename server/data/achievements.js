// Achievement definitions for MysticMatch gamification system
export const ACHIEVEMENTS = [
  {
    id: "original_vampire",
    name: "Original Vampire",
    description: "Complete all 3 story chapters",
    icon: "🧛",
    trigger: "story_completed",
  },
  {
    id: "ripper_mode",
    name: "Ripper Mode",
    description: "Send 50 diary entries in a single day",
    icon: "🩸",
    trigger: "messages_50_in_day",
  },
  {
    id: "loyal_witch",
    name: "Loyal Witch",
    description: "Maintain a 7-day activity streak",
    icon: "🔮",
    trigger: "streak_7",
  },
  {
    id: "hybrid_awakening",
    name: "Hybrid Awakening",
    description: "Match with all 4 supernatural archetypes",
    icon: "⚡",
    trigger: "all_archetypes_matched",
  },
  {
    id: "keeper_of_secrets",
    name: "Keeper of Secrets",
    description: "Unlock 5 dark side profiles",
    icon: "📖",
    trigger: "dark_sides_5",
  },
  {
    id: "first_blood",
    name: "First Blood",
    description: "Get your first mutual match",
    icon: "❤️",
    trigger: "first_match",
  },
  {
    id: "eternal_bond",
    name: "Eternal Bond",
    description: "Maintain a 30-day activity streak",
    icon: "♾️",
    trigger: "streak_30",
  },
  {
    id: "compulsion_master",
    name: "Compulsion Master",
    description: "Pin 10 diary entries across all chats",
    icon: "🌀",
    trigger: "pins_10",
  },
];
