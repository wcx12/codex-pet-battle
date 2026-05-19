export const PET_SKILL_CATALOG = [
  {
    id: "token_spark",
    unlockLevel: 2,
    displayName: "Token Spark",
    effect: "+1 energy cue when new XP lands.",
    description: "The pet reacts more visibly when fresh Codex activity becomes XP."
  },
  {
    id: "context_sense",
    unlockLevel: 3,
    displayName: "Context Sense",
    effect: "Highlights scan windows and import state.",
    description: "The pet is better at showing whether the current scan is previewing or writing."
  },
  {
    id: "test_shield",
    unlockLevel: 5,
    displayName: "Test Shield",
    effect: "Marks verified local checks as protected progress.",
    description: "A defensive milestone for keeping the local loop covered by tests."
  },
  {
    id: "refactor_aura",
    unlockLevel: 8,
    displayName: "Refactor Aura",
    effect: "Adds a higher-tier growth badge.",
    description: "A late-game signal for sustained code cleanup and iteration."
  },
  {
    id: "battle_ready",
    unlockLevel: 10,
    displayName: "Battle Ready",
    effect: "Unlocks the future battle slot.",
    description: "The pet has enough progression history to enter future combat systems."
  }
] as const;

export type PetSkillId = (typeof PET_SKILL_CATALOG)[number]["id"];
