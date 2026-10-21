export const DIFFICULTY_PERCENTAGES = {
  low: 0.5,
  medium: 0.3,
  high: 0.2,
} as const;

export type QuestionDifficulty =
  | "low"
  | "medium"
  | "high";

export type QuestionCategory =
  | "offense"
  | "defense"
  | "information"
  | "mobility"
  | "control"
  | "support"
  | "utility"
  | "unique";

export type QuestionId = string;

export type Question = {
  label: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  description: string;
};

export const QUESTIONS: Record<QuestionId, Question> = {
  // =========================================================
  // OFFENSE
  // =========================================================

  "can-deal-ability-damage": {
    label: "Can Deal Ability Damage",
    category: "offense",
    difficulty: "low",
    description:
      "Can the Agent use a non-ultimate ability that directly damages an enemy?",
  },

  "can-damage-multiple-enemies": {
    label: "Can Damage Multiple Enemies",
    category: "offense",
    difficulty: "low",
    description:
      "Can one of the Agent's abilities damage two or more enemies at the same time?",
  },

  "can-deal-damage-over-time": {
    label: "Can Deal Damage Over Time",
    category: "offense",
    difficulty: "medium",
    description:
      "Can the Agent create an effect that continues damaging enemies after it is used?",
  },

  "can-destroy-enemy-utility": {
    label: "Can Destroy Enemy Utility",
    category: "offense",
    difficulty: "medium",
    description:
      "Can one of the Agent's abilities destroy an enemy's placed ability or deployable?",
  },

  "can-damage-through-area": {
    label: "Can Damage Through an Area",
    category: "offense",
    difficulty: "medium",
    description:
      "Can the Agent damage enemies with an ability rather than a normal weapon attack?",
  },

  "ultimate-deals-damage": {
    label: "Does the Ultimate Deal Damage",
    category: "offense",
    difficulty: "low",
    description:
      "Does the Agent's ultimate have a direct damaging effect on enemies?",
  },

  "ultimate-can-kill": {
    label: "Can the Ultimate Kill",
    category: "offense",
    difficulty: "high",
    description:
      "Can the Agent's ultimate directly eliminate an enemy without requiring a normal weapon attack?",
  },

  // =========================================================
  // DEFENSE
  // =========================================================

  "can-create-a-wall": {
    label: "Can Create a Wall",
    category: "defense",
    difficulty: "low",
    description:
      "Can the Agent create a physical barrier that blocks movement?",
  },

  "can-block-bullets": {
    label: "Can Block Bullets",
    category: "defense",
    difficulty: "medium",
    description:
      "Can the Agent create something that prevents bullets from passing through?",
  },

  "can-create-cover": {
    label: "Can Create Cover",
    category: "defense",
    difficulty: "low",
    description:
      "Can the Agent create temporary cover that helps players avoid being seen or attacked?",
  },

  "can-protect-an-ally": {
    label: "Can Protect an Ally",
    category: "defense",
    difficulty: "medium",
    description:
      "Can the Agent directly protect a teammate from enemy damage or danger?",
  },

  "can-deny-an-area": {
    label: "Can Make an Area Unsafe",
    category: "defense",
    difficulty: "low",
    description:
      "Can the Agent make an area dangerous for enemies to enter or remain in?",
  },

  "can-hold-an-area": {
    label: "Can Hold an Area",
    category: "defense",
    difficulty: "medium",
    description:
      "Can the Agent use an ability to defend an area and make it harder for enemies to take control of it?",
  },

  // =========================================================
  // INFORMATION
  // =========================================================

  "can-reveal-enemies": {
    label: "Can Reveal Enemy Locations",
    category: "information",
    difficulty: "low",
    description:
      "Can the Agent use an ability that reveals enemy positions to themselves or their team?",
  },

  "can-get-information-safely": {
    label: "Can Gather Information From Safety",
    category: "information",
    difficulty: "medium",
    description:
      "Can the Agent gather information about an area without fully entering it?",
  },

  "can-track-an-enemy": {
    label: "Can Track an Enemy",
    category: "information",
    difficulty: "high",
    description:
      "Can one of the Agent's abilities continue following or tracking an enemy after detecting them?",
  },

  "can-see-enemies-through-walls": {
    label: "Can Detect Enemies Through Walls",
    category: "information",
    difficulty: "medium",
    description:
      "Can the Agent detect enemy positions when enemies are behind walls?",
  },

  "can-detect-nearby-enemies": {
    label: "Can Detect Nearby Enemies",
    category: "information",
    difficulty: "low",
    description:
      "Can the Agent detect enemies within a specific area or range without necessarily revealing their exact positions?",
  },

  // =========================================================
  // MOBILITY
  // =========================================================

  "has-a-movement-ability": {
    label: "Has a Movement Ability",
    category: "mobility",
    difficulty: "low",
    description:
      "Does the Agent have an ability that directly helps them move around the map?",
  },

  "can-move-faster": {
    label: "Can Move Faster",
    category: "mobility",
    difficulty: "low",
    description:
      "Can the Agent temporarily increase their movement speed?",
  },

  "can-dash": {
    label: "Can Dash",
    category: "mobility",
    difficulty: "high",
    description:
      "Can the Agent quickly move a short distance using a dash-like ability?",
  },

  "can-teleport": {
    label: "Can Teleport",
    category: "mobility",
    difficulty: "high",
    description:
      "Can the Agent instantly move from one location to another using an ability?",
  },

  "can-move-through-space": {
    label: "Can Move in an Unusual Way",
    category: "mobility",
    difficulty: "medium",
    description:
      "Can the Agent move in a way that is very different from normal walking, running, or jumping?",
  },

  "has-vertical-movement": {
    label: "Can Move High or Stay in the Air",
    category: "mobility",
    difficulty: "medium",
    description:
      "Can the Agent use an ability to gain significant vertical movement or stay airborne?",
  },

  "can-return-to-a-location": {
    label: "Can Return to a Location",
    category: "mobility",
    difficulty: "high",
    description:
      "Can the Agent mark or use a location and later return to it with an ability?",
  },

  // =========================================================
  // CONTROL
  // =========================================================

  "can-slow-enemies": {
    label: "Can Slow Enemies",
    category: "control",
    difficulty: "low",
    description:
      "Can the Agent use an ability that reduces an enemy's movement speed?",
  },

  "can-restrict-movement": {
    label: "Can Restrict Enemy Movement",
    category: "control",
    difficulty: "medium",
    description:
      "Can the Agent use an ability that prevents or strongly limits an enemy from moving?",
  },

  "can-push-or-pull-enemies": {
    label: "Can Push or Pull Enemies",
    category: "control",
    difficulty: "high",
    description:
      "Can the Agent directly move an enemy by pushing, pulling, lifting, or displacing them?",
  },

  "can-concuss-enemies": {
    label: "Can Concuss Enemies",
    category: "control",
    difficulty: "medium",
    description:
      "Can the Agent use an ability that applies the Concussed effect to an enemy?",
  },

  "can-suppress-enemies": {
    label: "Can Disable Enemy Abilities",
    category: "control",
    difficulty: "high",
    description:
      "Can the Agent temporarily stop enemies from using their abilities?",
  },

  "can-detain-enemies": {
    label: "Can Detain an Enemy",
    category: "control",
    difficulty: "high",
    description:
      "Can the Agent use an ability that detains an enemy and prevents them from acting normally?",
  },

  "can-deafen-enemies": {
    label: "Can Affect Enemy Audio",
    category: "control",
    difficulty: "high",
    description:
      "Can the Agent use an ability that makes it harder for enemies to hear?",
  },

  "can-impair-enemy-actions": {
    label: "Can Make Enemies Less Effective",
    category: "control",
    difficulty: "medium",
    description:
      "Can the Agent use an ability that makes enemies less effective at fighting or moving through an impairing effect?",
  },

  // =========================================================
  // SUPPORT
  // =========================================================

  "can-heal": {
    label: "Can Restore Health",
    category: "support",
    difficulty: "medium",
    description:
      "Can the Agent use an ability to restore a player's health?",
  },

  "can-heal-an-ally": {
    label: "Can Heal an Ally",
    category: "support",
    difficulty: "high",
    description:
      "Can the Agent directly restore the health of a teammate?",
  },

  "can-heal-self": {
    label: "Can Heal Self",
    category: "support",
    difficulty: "high",
    description:
      "Can the Agent use an ability to restore their own health?",
  },

  "can-revive-an-ally": {
    label: "Can Revive an Ally",
    category: "support",
    difficulty: "high",
    description:
      "Can the Agent bring an eliminated teammate back into the round?",
  },

  "can-help-an-ally-directly": {
    label: "Can Directly Help an Ally",
    category: "support",
    difficulty: "low",
    description:
      "Does the Agent have an ability that directly gives a teammate a beneficial effect?",
  },

  // =========================================================
  // UTILITY
  // =========================================================

  "can-block-line-of-sight": {
    label: "Can Block Line of Sight",
    category: "utility",
    difficulty: "low",
    description:
      "Can the Agent create something that blocks enemies' vision through an area?",
  },

  "can-impair-vision": {
    label: "Can Impair Enemy Vision",
    category: "utility",
    difficulty: "medium",
    description:
      "Can the Agent use an ability that makes it harder for enemies to see clearly?",
  },

  "can-place-utility": {
    label: "Can Place Utility",
    category: "utility",
    difficulty: "low",
    description:
      "Can the Agent place an ability somewhere on the map instead of using it immediately?",
  },

  "has-utility-that-stays": {
    label: "Has Utility That Stays",
    category: "utility",
    difficulty: "low",
    description:
      "Can the Agent leave an ability active at a location after placing it?",
  },

  "can-control-placed-utility": {
    label: "Can Control Placed Utility",
    category: "utility",
    difficulty: "medium",
    description:
      "Can the Agent control, move, or interact with their own placed utility after deploying it?",
  },

  "can-recover-utility": {
    label: "Can Recover Their Utility",
    category: "utility",
    difficulty: "high",
    description:
      "Can the Agent pick up, recall, or recover their own placed utility?",
  },

  "can-reuse-an-ability": {
    label: "Can Reuse an Ability",
    category: "utility",
    difficulty: "medium",
    description:
      "Can an ability be used again during the same round after its initial use?",
  },

  "uses-thrown-or-launched-abilities": {
    label: "Uses Thrown or Launched Abilities",
    category: "utility",
    difficulty: "low",
    description:
      "Does the Agent have an ability that is thrown, launched, or sent toward a location?",
  },

  "can-use-abilities-through-walls": {
    label: "Can Use Abilities Through Walls",
    category: "utility",
    difficulty: "medium",
    description:
      "Can the Agent affect an enemy or area with an ability without needing a direct line of sight?",
  },

  "can-place-utility-at-range": {
    label: "Can Place Utility From Far Away",
    category: "utility",
    difficulty: "medium",
    description:
      "Can the Agent place or activate useful abilities at a location far away from themselves?",
  },

  // =========================================================
  // UNIQUE
  // =========================================================

  "has-a-companion": {
    label: "Can Use a Companion",
    category: "unique",
    difficulty: "high",
    description:
      "Can the Agent use an ability that creates or controls a creature or companion?",
  },

  "can-create-a-copy": {
    label: "Can Create a Decoy or Copy",
    category: "unique",
    difficulty: "high",
    description:
      "Can the Agent create a fake version, clone, or imitation of themselves to trick or distract enemies?",
  },

  "can-become-invulnerable": {
    label: "Can Become Invulnerable",
    category: "unique",
    difficulty: "high",
    description:
      "Can the Agent become immune to damage for a short period of time?",
  },

  "can-act-after-death": {
    label: "Can Use Abilities After Death",
    category: "unique",
    difficulty: "high",
    description:
      "Can the Agent continue using or controlling an ability after being eliminated?",
  },

  "can-return-after-death": {
    label: "Can Return After Death",
    category: "unique",
    difficulty: "high",
    description:
      "Can the Agent resurrect themselves and re-enter the round after being eliminated?",
  },

  "can-affect-the-spike": {
    label: "Can Directly Affect the Spike",
    category: "unique",
    difficulty: "high",
    description:
      "Can one of the Agent's abilities directly interact with the Spike?",
  },

  "has-different-ability-modes": {
    label: "Has Different Ability Modes",
    category: "unique",
    difficulty: "high",
    description:
      "Can one of the Agent's abilities be used in different modes or have clearly different effects?",
  },

  "uses-map-targeting": {
    label: "Can Target Using a Map",
    category: "unique",
    difficulty: "medium",
    description:
      "Can the Agent choose where to use an ability through a map-style targeting view?",
  },

  "has-a-special-ultimate-effect": {
    label: "Has a Unique Ultimate Effect",
    category: "unique",
    difficulty: "high",
    description:
      "Does the Agent's ultimate do something distinctive beyond simply dealing damage or providing a typical combat benefit?",
  },
};