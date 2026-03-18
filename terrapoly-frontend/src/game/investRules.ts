// ─── TERRAPOLY INVESTMENT RULES ───────────────────────────────────────────
// Single source of truth for all game economy constants (frontend display).
// Backend logic lives in gameHandler.ts — keep both in sync.

// ─── Starting Economy ────────────────────────────────────────────────────
export const STARTING_POINTS = 200;

// ─── Property Purchase ───────────────────────────────────────────────────
export const BUY_COST = 50;           // Cost to buy an unowned SDG property

// ─── Upgrade Costs ───────────────────────────────────────────────────────
// Players can upgrade properties they own when they land on them.
// Each level increases passive income and contributes to the World SDG score.
export const UPGRADE_COST: Record<string, number> = {
  SEED: 100,      // SEED → FULL   (first upgrade)
  FULL: 200,      // FULL → FLAGSHIP (second upgrade)
  FLAGSHIP: 0,    // Already at max
};

// ─── Passive Income (per round) ──────────────────────────────────────────
// Every round, each owned property earns: BASE_INCOME + bonusReturns
// bonusReturns grows from upgrades (+5 FULL, +15 cumulative FLAGSHIP)
// and from donations received (+2 each).
export const BASE_INCOME = 10;

// Expected total return per level (base + upgrade bonuses, before donations)
export const EXPECTED_RETURN: Record<string, number> = {
  SEED: 10,       // 10 base + 0 upgrade bonus
  FULL: 15,       // 10 base + 5 upgrade bonus
  FLAGSHIP: 25,   // 10 base + 5 + 10 upgrade bonus
};

// ─── SDG World Score Contributions ───────────────────────────────────────
// Investing in properties doesn't just earn points — it helps the world.
export const SDG_CONTRIBUTION: Record<string, number> = {
  BUY: 5,         // Buying a new property
  FULL: 8,        // Upgrading to FULL
  FLAGSHIP: 12,   // Upgrading to FLAGSHIP
  DONATION: 15,   // Paying donation (rent) on someone else's property
  APATHY: -3,     // Penalty for skipping an available investment
};

// ─── Other Costs ─────────────────────────────────────────────────────────
export const DONATION_COST = 15;      // Cost when landing on another player's property
export const APATHY_TAX = 15;         // Penalty for skipping an unowned property you can afford

// ─── Level Display ───────────────────────────────────────────────────────
export const LEVELS = ['SEED', 'FULL', 'FLAGSHIP'] as const;
export type InvestmentLevel = typeof LEVELS[number];

export const LEVEL_LABELS: Record<string, string> = {
  SEED: 'Seed',
  FULL: 'Full',
  FLAGSHIP: 'Flagship',
};

export const LEVEL_COLORS: Record<string, string> = {
  SEED: '#94a3b8',     // Slate — just getting started
  FULL: '#3b82f6',     // Blue — committed investment
  FLAGSHIP: '#f59e0b', // Amber — flagship project
};

// ─── Victory Conditions ──────────────────────────────────────────────────
export const SDG_VICTORY_THRESHOLD = 60;  // Each SDG category must reach ≥ 60 to win
export const SDG_MAX = 100;               // SDG scores are capped at 100
