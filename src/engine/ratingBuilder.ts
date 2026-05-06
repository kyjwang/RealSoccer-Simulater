import { clamp } from "@/engine/probability";
import type { RawPlayerStats } from "@/types/dataProvider";
import type { PlayerPosition, PlayerRating } from "@/types/player";

type RatingDefaults = Pick<
  PlayerRating,
  "speed" | "shooting" | "passing" | "dribbling" | "defending" | "physical" | "stamina" | "form" | "goalkeeper"
>;

const positionDefaults: Record<PlayerPosition, RatingDefaults> = {
  GK: {
    speed: 45,
    shooting: 30,
    passing: 62,
    dribbling: 45,
    defending: 62,
    physical: 72,
    stamina: 72,
    form: 68,
    goalkeeper: 74
  },
  DF: {
    speed: 68,
    shooting: 45,
    passing: 64,
    dribbling: 58,
    defending: 72,
    physical: 74,
    stamina: 75,
    form: 68
  },
  MF: {
    speed: 70,
    shooting: 62,
    passing: 74,
    dribbling: 72,
    defending: 62,
    physical: 68,
    stamina: 78,
    form: 70
  },
  FW: {
    speed: 76,
    shooting: 76,
    passing: 65,
    dribbling: 75,
    defending: 38,
    physical: 70,
    stamina: 76,
    form: 70
  }
};

const clampRating = (value: number): number => Math.round(clamp(value, 30, 96));

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

export const buildPlayerRating = (
  stats: RawPlayerStats,
  options: { index?: number; attacksRight?: boolean } = {}
): PlayerRating => {
  const position = normalizePosition(stats.position);
  const defaults = positionDefaults[position];
  const minutes = stats.minutes ?? 0;
  const passAccuracy = stats.passAccuracy && stats.passAccuracy > 1 ? stats.passAccuracy : (stats.passAccuracy ?? 0) * 100;
  const dribbleRate = stats.dribbleAttempts ? (stats.dribblesSucceeded ?? 0) / stats.dribbleAttempts : 0;
  const duelRate = stats.duelsTotal ? (stats.duelsWon ?? 0) / stats.duelsTotal : 0.45;
  const ratingBoost = stats.rating ? (stats.rating - 6) * 5 : 0;
  const startsRatio = stats.appearances ? (stats.starts ?? 0) / stats.appearances : 0.55;

  const shooting =
    defaults.shooting +
    per90(stats.goals, minutes) * 18 +
    per90(stats.shotsOnTarget, minutes) * 7 +
    per90(stats.shots, minutes) * 3 +
    ratingBoost;

  const passing =
    defaults.passing +
    per90(stats.assists, minutes) * 15 +
    per90(stats.keyPasses, minutes) * 7 +
    (passAccuracy - 75) * 0.25 +
    ratingBoost * 0.5;

  const dribbling =
    defaults.dribbling +
    dribbleRate * 12 +
    per90(stats.dribbleAttempts, minutes) * 2.5 +
    per90(stats.foulsWon, minutes) * 2 +
    ratingBoost * 0.45;

  const defending =
    defaults.defending +
    per90(stats.tackles, minutes) * 5 +
    per90(stats.interceptions, minutes) * 5 +
    per90(stats.clearances, minutes) * 2 +
    per90(stats.blocks, minutes) * 2 +
    (duelRate - 0.45) * 16 +
    ratingBoost * 0.35;

  const stamina = defaults.stamina + Math.min(14, minutes / 280) + startsRatio * 8 - (stats.injured ? 10 : 0);
  const form = defaults.form + ratingBoost + per90((stats.goals ?? 0) + (stats.assists ?? 0), minutes) * 8 - (stats.injured ? 12 : 0);
  const goalkeeper =
    position === "GK"
      ? (defaults.goalkeeper ?? 72) +
        per90(stats.saves, minutes) * 5 +
        (stats.cleanSheets ?? 0) * 0.7 -
        (stats.goalsConceded ?? 0) * 0.3 +
        ratingBoost
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
    speed: clampRating(defaults.speed + (position === "FW" ? dribbleRate * 8 : 0) + (stats.age ? Math.max(-7, 28 - stats.age) * 0.6 : 0)),
    shooting: clampRating(shooting),
    passing: clampRating(passing),
    dribbling: clampRating(dribbling),
    defending: clampRating(defending),
    physical: clampRating(defaults.physical + (duelRate - 0.45) * 12),
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
