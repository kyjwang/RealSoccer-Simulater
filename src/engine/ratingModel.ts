import type { MatchEvent } from "@/types/event";
import type { PlayerRating } from "@/types/player";

const ATTRIBUTE_SCALE = 100;

export const toUnit = (value: number): number => Math.max(0, Math.min(1, value / ATTRIBUTE_SCALE));

export const staminaEffect = (stamina: number): number => {
  if (stamina >= 75) {
    return 1;
  }
  if (stamina >= 55) {
    return 0.94;
  }
  if (stamina >= 35) {
    return 0.88;
  }
  return 0.8;
};

export const effectiveAttribute = (
  player: PlayerRating,
  attribute: keyof Pick<
    PlayerRating,
    "speed" | "shooting" | "passing" | "dribbling" | "defending" | "physical" | "form"
  >,
  runtimeStamina: number
): number => {
  const raw = player[attribute];
  const formBoost = 0.9 + toUnit(player.form) * 0.2;
  return toUnit(raw) * staminaEffect(runtimeStamina) * formBoost;
};

export const pickMvp = (
  players: PlayerRating[],
  contributions: Record<string, number>,
  events: MatchEvent[]
): string => {
  if (players.length === 0) {
    return "";
  }

  const touchesByPlayer = events.reduce<Record<string, number>>((acc, event) => {
    if (event.playerId) {
      acc[event.playerId] = (acc[event.playerId] ?? 0) + 1;
    }
    return acc;
  }, {});

  let bestId = players[0].id;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const player of players) {
    const contribution = contributions[player.id] ?? 0;
    const involvement = touchesByPlayer[player.id] ?? 0;
    const baseline = toUnit(player.form) * 0.8 + toUnit(player.stamina) * 0.4;
    const score = contribution + involvement * 0.06 + baseline;

    if (score > bestScore) {
      bestScore = score;
      bestId = player.id;
    }
  }

  return bestId;
};
