import { clamp } from "@/engine/probability";
import type { RawPlayerStats } from "@/types/dataProvider";
import type { PlayerPosition, PlayerRating } from "@/types/player";

type RatingDefaults = Pick<
  PlayerRating,
  "speed" | "shooting" | "passing" | "dribbling" | "defending" | "physical" | "stamina" | "form" | "goalkeeper"
>;

const positionDefaults: Record<PlayerPosition, RatingDefaults> = {
  GK: {
    speed: 40,
    shooting: 20,
    passing: 60,
    dribbling: 40,
    defending: 50,
    physical: 70,
    stamina: 70,
    form: 65,
    goalkeeper: 80
  },
  DF: {
    speed: 65,
    shooting: 35,
    passing: 60,
    dribbling: 50,
    defending: 75,
    physical: 75,
    stamina: 75,
    form: 65
  },
  MF: {
    speed: 70,
    shooting: 55,
    passing: 75,
    dribbling: 70,
    defending: 60,
    physical: 65,
    stamina: 80,
    form: 70
  },
  FW: {
    speed: 75,
    shooting: 75,
    passing: 60,
    dribbling: 75,
    defending: 30,
    physical: 65,
    stamina: 75,
    form: 70
  }
};

const clampRating = (value: number): number => Math.round(clamp(value, 25, 95));

const per90 = (value: number | undefined, minutes: number | undefined): number => {
  if (!value || !minutes || minutes <= 0) {
    return 0;
  }
  return (value / minutes) * 90;
};

export const normalizePosition = (position: string | undefined): PlayerPosition => {
  const upper = position?.toUpperCase() ?? "";
  if (upper.includes("GOAL") || upper === "G" || upper === "GK") {
    return "GK";
  }
  if (upper.includes("DEF") || upper === "D" || upper === "DF") {
    return "DF";
  }
  if (upper.includes("MID") || upper === "M" || upper === "MF") {
    return "MF";
  }
  if (upper.includes("ATT") || upper.includes("FOR") || upper === "F" || upper === "FW") {
    return "FW";
  }
  return "MF";
};

const startingPositionFor = (position: PlayerPosition, index: number, attacksRight: boolean): { x: number; y: number } => {
  const homeShape = {
    GK: [{ x: 6, y: 50 }],
    DF: [
      { x: 22, y: 16 },
      { x: 20, y: 36 },
      { x: 20, y: 64 },
      { x: 22, y: 84 }
    ],
    MF: [
      { x: 40, y: 35 },
      { x: 39, y: 50 },
      { x: 40, y: 65 }
    ],
    FW: [
      { x: 70, y: 20 },
      { x: 74, y: 50 },
      { x: 70, y: 80 }
    ]
  } satisfies Record<PlayerPosition, { x: number; y: number }[]>;

  const slot = homeShape[position][index % homeShape[position].length];
  return attacksRight ? slot : { x: 100 - slot.x, y: slot.y };
};

// Deterministic variance seed from a player's name so the same player always
// gets the same ratings, but different players differ even without stats.
const nameSeed = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

// Returns a small deterministic offset in [-range, +range] from a seed.
const variance = (seed: number, range: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x); // 0-1
  return (r - 0.5) * 2 * range;
};

export const buildPlayerRating = (
  stats: RawPlayerStats,
  options: { index?: number; attacksRight?: boolean } = {}
): PlayerRating => {
  const position = normalizePosition(stats.position);
  const defaults = positionDefaults[position];
  const minutes = stats.minutes ?? 0;
  const hasRealStats = minutes > 0;
  const passAccuracy = stats.passAccuracy && stats.passAccuracy > 1 ? stats.passAccuracy : (stats.passAccuracy ?? 0) * 100;
  const dribbleRate = stats.dribbleAttempts ? (stats.dribblesSucceeded ?? 0) / stats.dribbleAttempts : 0;
  const duelRate = stats.duelsTotal ? (stats.duelsWon ?? 0) / stats.duelsTotal : 0.45;
  const ratingBoost = stats.rating ? (stats.rating - 6) * 5 : 0;
  const startsRatio = stats.appearances ? (stats.starts ?? 0) / stats.appearances : 0.55;

  // Deterministic per-player variance so players differ even without stats.
  const seed = nameSeed(stats.name);
  // When we have real stats, use a tiny variance just for tie-breaking.
  // When we have no stats, use a larger variance to differentiate players.
  const vRange = hasRealStats ? 1.5 : 5;
  const vSeed = (offset: number) => variance(seed + offset, vRange);

  // Enhanced age curve: peak around 26-28, more realistic decline
  const ageBoost = stats.age !== undefined && stats.age !== null
    ? stats.age < 20
      ? (stats.age - 16) * 0.6   // youth development
      : stats.age <= 25
        ? (stats.age - 20) * 0.4  // rapid improvement
        : stats.age <= 29
          ? 2 + (stats.age - 25) * 0.15  // peak plateau
          : stats.age <= 32
            ? 2 - (stats.age - 29) * 0.2  // gradual decline
            : Math.max(-8, 28 - stats.age) * 0.3  // faster decline after 32
    : 0;

  // Squad number as a rough seniority proxy (lower number ≈ more established)
  const seniority = stats.number && stats.number <= 25
    ? (25 - stats.number) * 0.25
    : 0;

  // International experience bonus (if available in raw stats)
  const internationalBonus = stats.raw && typeof stats.raw.internationalApps === 'number' ? 
    Math.min(3, stats.raw.internationalApps / 10) : 0;

  const baseBoost = (hasRealStats ? 0 : ageBoost + seniority + internationalBonus);

  // Enhanced shooting calculation
  const shooting =
    defaults.shooting +
    per90(stats.goals, minutes) * 20 +
    per90(stats.shotsOnTarget, minutes) * 8 +
    per90(stats.shots, minutes) * 3 +
    ratingBoost * 0.6 +
    baseBoost * 0.4 +
    vSeed(1);

  // Enhanced passing calculation
  const passing =
    defaults.passing +
    per90(stats.assists, minutes) * 18 +
    per90(stats.keyPasses, minutes) * 8 +
    (passAccuracy - 70) * 0.3 +
    ratingBoost * 0.5 +
    baseBoost * 0.35 +
    vSeed(2);

  // Enhanced dribbling calculation
  const dribbling =
    defaults.dribbling +
    dribbleRate * 15 +
    per90(stats.dribbleAttempts, minutes) * 3 +
    per90(stats.foulsWon, minutes) * 2.5 +
    ratingBoost * 0.5 +
    baseBoost * 0.25 +
    vSeed(3);

  // Enhanced defending calculation
  const defending =
    defaults.defending +
    per90(stats.tackles, minutes) * 6 +
    per90(stats.interceptions, minutes) * 6 +
    per90(stats.clearances, minutes) * 1.5 +
    per90(stats.blocks, minutes) * 1.5 +
    (duelRate - 0.45) * 20 +
    ratingBoost * 0.4 +
    baseBoost * 0.3 +
    vSeed(4);

  // Enhanced stamina calculation
  const stamina = defaults.stamina + 
    Math.min(16, minutes / 250) + 
    startsRatio * 10 - 
    (stats.injured ? 15 : 0) + 
    vSeed(5);

  // Enhanced form calculation
  const form = defaults.form + 
    ratingBoost * 0.7 + 
    per90((stats.goals ?? 0) + (stats.assists ?? 0), minutes) * 10 - 
    (stats.injured ? 18 : 0) + 
    vSeed(6);

  // Enhanced goalkeeper calculation
  const goalkeeper =
    position === "GK"
      ? (defaults.goalkeeper ?? 75) +
        per90(stats.saves, minutes) * 6 +
        (stats.cleanSheets ?? 0) * 0.8 -
        (stats.goalsConceded ?? 0) * 0.4 +
        ratingBoost * 0.7 +
        baseBoost * 0.5 +
        vSeed(7)
      : undefined;

  const coordinates = startingPositionFor(position, options.index ?? 0, options.attacksRight ?? true);

  return {
    id: `${stats.teamId}-${stats.externalId ?? stats.name.toLowerCase().replace(/\s+/g, "-")}`,
    externalId: stats.externalId,
    name: stats.name,
    teamId: stats.teamId,
    teamName: stats.teamName,
    position,
    age: stats.age,
    nationality: stats.nationality,
    number: stats.number,
    x: coordinates.x,
    y: coordinates.y,
    speed: clampRating(defaults.speed + 
      (position === "FW" ? dribbleRate * 6 : 0) + 
      (position === "DF" ? Math.max(0, 22 - (stats.age ?? 0)) * 0.1 : 0) +  // Younger fullbacks faster
      ((stats.age ?? 0) ? Math.max(-8, 26 - (stats.age ?? 0)) * 0.3 : 0) + 
      vSeed(8)),
    shooting: clampRating(shooting),
    passing: clampRating(passing),
    dribbling: clampRating(dribbling),
    defending: clampRating(defending),
    physical: clampRating(defaults.physical + (duelRate - 0.45) * 14 + vSeed(9)),
    stamina: clampRating(stamina),
    form: clampRating(form),
    goalkeeper: goalkeeper === undefined ? undefined : clampRating(goalkeeper),
    rawStats: stats.raw
  };
};

export const buildRatingsFromStats = (
  stats: RawPlayerStats[],
  options: { attacksRight?: boolean } = {}
): PlayerRating[] =>
  stats.map((player, index) =>
    buildPlayerRating(player, {
      index,
      attacksRight: options.attacksRight
    })
  );