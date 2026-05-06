import type { PlayerPosition, PlayerRating } from "@/types/player";

const SHAPE: Array<{ position: PlayerPosition; count: number }> = [
  { position: "GK", count: 1 },
  { position: "DF", count: 4 },
  { position: "MF", count: 3 },
  { position: "FW", count: 3 }
];

const overall = (player: PlayerRating): number => {
  if (player.position === "GK") {
    return (player.goalkeeper ?? player.defending) * 0.45 + player.passing * 0.18 + player.physical * 0.2 + player.form * 0.17;
  }

  return (
    player.speed * 0.14 +
    player.shooting * 0.16 +
    player.passing * 0.18 +
    player.dribbling * 0.16 +
    player.defending * 0.16 +
    player.physical * 0.1 +
    player.form * 0.1
  );
};

const sortByRoleStrength = (players: PlayerRating[]): PlayerRating[] =>
  [...players].sort((a, b) => overall(b) - overall(a));

const assignShapeCoordinates = (players: PlayerRating[], attacksRight: boolean): PlayerRating[] => {
  const slots: Record<PlayerPosition, Array<{ x: number; y: number }>> = {
    GK: [{ x: 6, y: 50 }],
    DF: [
      { x: 22, y: 16 },
      { x: 20, y: 36 },
      { x: 20, y: 64 },
      { x: 22, y: 84 }
    ],
    MF: [
      { x: 40, y: 32 },
      { x: 39, y: 50 },
      { x: 40, y: 68 }
    ],
    FW: [
      { x: 70, y: 20 },
      { x: 74, y: 50 },
      { x: 70, y: 80 }
    ]
  };

  const counters: Record<PlayerPosition, number> = {
    GK: 0,
    DF: 0,
    MF: 0,
    FW: 0
  };

  return players.map((player) => {
    const index = counters[player.position];
    counters[player.position] += 1;
    const slot = slots[player.position][index % slots[player.position].length];

    return {
      ...player,
      x: attacksRight ? slot.x : 100 - slot.x,
      y: slot.y
    };
  });
};

export const buildStartingXI = (squad: PlayerRating[], options: { attacksRight: boolean }): PlayerRating[] => {
  const selected: PlayerRating[] = [];
  const usedIds = new Set<string>();

  for (const role of SHAPE) {
    const candidates = sortByRoleStrength(squad.filter((player) => player.position === role.position && !usedIds.has(player.id)));
    for (const player of candidates.slice(0, role.count)) {
      selected.push(player);
      usedIds.add(player.id);
    }
  }

  if (selected.length < 11) {
    const remaining = sortByRoleStrength(squad.filter((player) => !usedIds.has(player.id)));
    for (const player of remaining.slice(0, 11 - selected.length)) {
      selected.push(player);
      usedIds.add(player.id);
    }
  }

  return assignShapeCoordinates(selected.slice(0, 11), options.attacksRight);
};
