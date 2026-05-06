import { cityStylePlayers, madridStylePlayers } from "@/data/players";
import type { Team } from "@/types/team";

export const teams: Team[] = [
  {
    id: "city-style",
    name: "Manchester Azure",
    shortName: "MAZ",
    color: "#64d2ff",
    accentColor: "#dff7ff",
    tacticStyle: "possession",
    attackBias: 0.59,
    defensiveLine: 0.66,
    pressing: 0.68,
    tempo: 0.6,
    players: cityStylePlayers
  },
  {
    id: "madrid-style",
    name: "Madrid Blancos",
    shortName: "MBL",
    color: "#ff7f50",
    accentColor: "#ffe6da",
    tacticStyle: "counter",
    attackBias: 0.57,
    defensiveLine: 0.58,
    pressing: 0.62,
    tempo: 0.67,
    players: madridStylePlayers
  }
];

export const getTeamById = (teamId: string): Team | undefined =>
  teams.find((team) => team.id === teamId);
