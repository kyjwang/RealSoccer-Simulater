import type { HistoricalCompetition, HistoricalMatch } from "@/types/dataProvider";
import type { MatchEvent } from "@/types/event";
import type { PlayerRating } from "@/types/player";
import type { Team } from "@/types/team";

const francePlayers: PlayerRating[] = [
  ["fra-gk-1", "H. Lloren", "GK", 1, 6, 50],
  ["fra-df-2", "B. Pavaro", "DF", 2, 22, 16],
  ["fra-df-4", "R. Varano", "DF", 4, 20, 36],
  ["fra-df-5", "S. Umtin", "DF", 5, 20, 64],
  ["fra-df-21", "L. Hernan", "DF", 21, 22, 84],
  ["fra-mf-6", "P. Pogbin", "MF", 6, 40, 36],
  ["fra-mf-13", "N. Kantin", "MF", 13, 39, 56],
  ["fra-mf-14", "B. Matuid", "MF", 14, 48, 76],
  ["fra-fw-7", "A. Griezin", "FW", 7, 68, 38],
  ["fra-fw-10", "K. Mbaryn", "FW", 10, 72, 66],
  ["fra-fw-9", "O. Giron", "FW", 9, 76, 50]
].map(([id, name, position, number, x, y]) => ({
  id: String(id),
  name: String(name),
  teamId: "statsbomb-france-2018",
  teamName: "France 2018 Sample",
  position: position as PlayerRating["position"],
  number: Number(number),
  x: Number(x),
  y: Number(y),
  speed: position === "FW" ? 84 : 72,
  shooting: position === "FW" ? 82 : 58,
  passing: position === "MF" ? 82 : 70,
  dribbling: position === "FW" ? 84 : 68,
  defending: position === "DF" || position === "GK" ? 82 : 62,
  physical: 78,
  stamina: 82,
  form: 84,
  goalkeeper: position === "GK" ? 84 : undefined,
  rawStats: {
    source: "statsbomb-open-data-sample"
  }
}));

const croatiaPlayers: PlayerRating[] = [
  ["cro-gk-1", "D. Subasin", "GK", 1, 94, 50],
  ["cro-df-2", "S. Vrsalk", "DF", 2, 78, 16],
  ["cro-df-21", "D. Vidao", "DF", 21, 80, 36],
  ["cro-df-6", "D. Lovran", "DF", 6, 80, 64],
  ["cro-df-3", "I. Strinin", "DF", 3, 78, 84],
  ["cro-mf-7", "I. Rakitin", "MF", 7, 60, 35],
  ["cro-mf-10", "L. Modrin", "MF", 10, 60, 56],
  ["cro-mf-11", "M. Brozin", "MF", 11, 54, 70],
  ["cro-fw-4", "I. Perisin", "FW", 4, 30, 24],
  ["cro-fw-17", "M. Mandzuk", "FW", 17, 26, 50],
  ["cro-fw-18", "A. Rebin", "FW", 18, 30, 78]
].map(([id, name, position, number, x, y]) => ({
  id: String(id),
  name: String(name),
  teamId: "statsbomb-croatia-2018",
  teamName: "Croatia 2018 Sample",
  position: position as PlayerRating["position"],
  number: Number(number),
  x: Number(x),
  y: Number(y),
  speed: position === "FW" ? 78 : 70,
  shooting: position === "FW" || position === "MF" ? 78 : 52,
  passing: position === "MF" ? 86 : 68,
  dribbling: position === "MF" || position === "FW" ? 80 : 64,
  defending: position === "DF" || position === "GK" ? 80 : 60,
  physical: 79,
  stamina: 84,
  form: 83,
  goalkeeper: position === "GK" ? 82 : undefined,
  rawStats: {
    source: "statsbomb-open-data-sample"
  }
}));

export const statsBombSampleCompetitions: HistoricalCompetition[] = [
  {
    id: "sb-world-cup-sample",
    name: "StatsBomb Open Data Sample - World Cup",
    seasonId: "2018",
    seasonName: "2018",
    country: "International"
  },
  {
    id: "sb-womens-world-cup-sample",
    name: "StatsBomb Open Data Sample - Women's World Cup",
    seasonId: "2019",
    seasonName: "2019",
    country: "International"
  },
  {
    id: "sb-champions-league-sample",
    name: "StatsBomb Open Data Sample - Champions League",
    seasonId: "2018-2019",
    seasonName: "2018/2019",
    country: "Europe"
  }
];

const makeEvent = (event: Omit<MatchEvent, "mode">): MatchEvent => ({
  ...event,
  mode: "replay"
});

const sampleEvents: MatchEvent[] = [
  makeEvent({
    id: "sb-evt-001",
    tick: 0,
    minute: 0,
    second: 0,
    type: "kickoff",
    teamId: "statsbomb-france-2018",
    start: { x: 50, y: 50 },
    playerName: "A. Griezin",
    description: "0' Kickoff: France 2018 Sample start the replay.",
    raw: { type: { name: "Starting XI" } }
  }),
  makeEvent({
    id: "sb-evt-011",
    tick: 1,
    minute: 18,
    second: 12,
    type: "free_kick",
    teamId: "statsbomb-france-2018",
    playerId: "fra-fw-7",
    playerName: "A. Griezin",
    start: { x: 72, y: 42 },
    end: { x: 88, y: 50 },
    outcome: "complete",
    description: "18' Free kick: A. Griezin curls a delivery into the area.",
    raw: { type: { name: "Free Kick" }, location: [86.4, 33.6] }
  }),
  makeEvent({
    id: "sb-evt-012",
    tick: 2,
    minute: 18,
    second: 45,
    type: "goal",
    teamId: "statsbomb-france-2018",
    playerId: "fra-fw-7",
    playerName: "A. Griezin",
    start: { x: 88, y: 50 },
    end: { x: 100, y: 50 },
    outcome: "goal",
    xg: 0.08,
    description: "18' Goal: France 2018 Sample lead after the set-piece chaos.",
    raw: { type: { name: "Own Goal For" } }
  }),
  makeEvent({
    id: "sb-evt-021",
    tick: 3,
    minute: 28,
    second: 30,
    type: "pass",
    teamId: "statsbomb-croatia-2018",
    playerId: "cro-mf-10",
    playerName: "L. Modrin",
    receiverId: "cro-fw-4",
    receiverName: "I. Perisin",
    start: { x: 58, y: 54 },
    end: { x: 34, y: 28 },
    outcome: "complete",
    description: "28' Pass: L. Modrin switches play to I. Perisin.",
    raw: { type: { name: "Pass" }, location: [69.6, 43.2], pass: { end_location: [40.8, 22.4] } }
  }),
  makeEvent({
    id: "sb-evt-022",
    tick: 4,
    minute: 28,
    second: 46,
    type: "carry",
    teamId: "statsbomb-croatia-2018",
    playerId: "cro-fw-4",
    playerName: "I. Perisin",
    start: { x: 34, y: 28 },
    end: { x: 22, y: 40 },
    outcome: "complete",
    description: "28' Carry: I. Perisin drives inside from the left.",
    raw: { type: { name: "Carry" } }
  }),
  makeEvent({
    id: "sb-evt-023",
    tick: 5,
    minute: 28,
    second: 58,
    type: "goal",
    teamId: "statsbomb-croatia-2018",
    playerId: "cro-fw-4",
    playerName: "I. Perisin",
    start: { x: 22, y: 40 },
    end: { x: 0, y: 50 },
    outcome: "goal",
    xg: 0.12,
    description: "28' Goal: I. Perisin finishes low to level the replay.",
    raw: { type: { name: "Shot" }, shot: { outcome: { name: "Goal" } } }
  }),
  makeEvent({
    id: "sb-evt-031",
    tick: 6,
    minute: 38,
    second: 20,
    type: "foul",
    teamId: "statsbomb-croatia-2018",
    playerId: "cro-fw-4",
    playerName: "I. Perisin",
    start: { x: 85, y: 38 },
    outcome: "handball",
    description: "38' Foul: Croatia 2018 Sample concede a penalty after a handball review.",
    raw: { type: { name: "Foul Committed" } }
  }),
  makeEvent({
    id: "sb-evt-032",
    tick: 7,
    minute: 38,
    second: 58,
    type: "goal",
    teamId: "statsbomb-france-2018",
    playerId: "fra-fw-7",
    playerName: "A. Griezin",
    start: { x: 88, y: 50 },
    end: { x: 100, y: 45 },
    outcome: "goal",
    xg: 0.76,
    description: "38' Goal: A. Griezin converts the penalty.",
    raw: { type: { name: "Shot" }, shot: { type: { name: "Penalty" }, outcome: { name: "Goal" } } }
  }),
  makeEvent({
    id: "sb-evt-045",
    tick: 8,
    minute: 45,
    second: 0,
    type: "halftime",
    description: "45' Halftime.",
    start: { x: 50, y: 50 },
    raw: { type: { name: "Half End" } }
  }),
  makeEvent({
    id: "sb-evt-059",
    tick: 9,
    minute: 59,
    second: 8,
    type: "pass",
    teamId: "statsbomb-france-2018",
    playerId: "fra-mf-6",
    playerName: "P. Pogbin",
    receiverId: "fra-fw-10",
    receiverName: "K. Mbaryn",
    start: { x: 52, y: 38 },
    end: { x: 76, y: 64 },
    outcome: "complete",
    description: "59' Pass: P. Pogbin finds K. Mbaryn in transition.",
    raw: { type: { name: "Pass" } }
  }),
  makeEvent({
    id: "sb-evt-060",
    tick: 10,
    minute: 59,
    second: 35,
    type: "goal",
    teamId: "statsbomb-france-2018",
    playerId: "fra-mf-6",
    playerName: "P. Pogbin",
    start: { x: 80, y: 42 },
    end: { x: 100, y: 49 },
    outcome: "goal",
    xg: 0.11,
    description: "59' Goal: P. Pogbin finishes after the rebound sequence.",
    raw: { type: { name: "Shot" }, shot: { outcome: { name: "Goal" } } }
  }),
  makeEvent({
    id: "sb-evt-065",
    tick: 11,
    minute: 65,
    second: 25,
    type: "goal",
    teamId: "statsbomb-france-2018",
    playerId: "fra-fw-10",
    playerName: "K. Mbaryn",
    start: { x: 78, y: 62 },
    end: { x: 100, y: 54 },
    outcome: "goal",
    xg: 0.08,
    description: "65' Goal: K. Mbaryn strikes from outside the box.",
    raw: { type: { name: "Shot" }, shot: { outcome: { name: "Goal" } } }
  }),
  makeEvent({
    id: "sb-evt-069",
    tick: 12,
    minute: 69,
    second: 42,
    type: "goal",
    teamId: "statsbomb-croatia-2018",
    playerId: "cro-fw-17",
    playerName: "M. Mandzuk",
    start: { x: 8, y: 48 },
    end: { x: 0, y: 50 },
    outcome: "goal",
    xg: 0.24,
    description: "69' Goal: M. Mandzuk capitalizes on a goalkeeper error.",
    raw: { type: { name: "Shot" }, shot: { outcome: { name: "Goal" } } }
  }),
  makeEvent({
    id: "sb-evt-089",
    tick: 13,
    minute: 89,
    second: 30,
    type: "yellow_card",
    teamId: "statsbomb-france-2018",
    playerId: "fra-mf-13",
    playerName: "N. Kantin",
    start: { x: 46, y: 55 },
    outcome: "card",
    description: "89' Yellow card: N. Kantin stops a late break.",
    raw: { type: { name: "Bad Behaviour" }, bad_behaviour: { card: { name: "Yellow Card" } } }
  }),
  makeEvent({
    id: "sb-evt-090",
    tick: 14,
    minute: 90,
    second: 0,
    type: "fulltime",
    description: "90' Fulltime: France 2018 Sample 4-2 Croatia 2018 Sample.",
    start: { x: 50, y: 50 },
    raw: { type: { name: "Half End" } }
  })
];

const franceTeam: Team = {
  id: "statsbomb-france-2018",
  name: "France 2018 Sample",
  shortName: "FRA",
  country: "France",
  color: "#2f80ed",
  accentColor: "#d9ecff",
  tacticStyle: "balanced",
  attackBias: 0.58,
  defensiveLine: 0.56,
  pressing: 0.6,
  tempo: 0.62,
  players: francePlayers,
  dataSource: "statsbomb-open-data",
  dataQuality: 0.72
};

const croatiaTeam: Team = {
  id: "statsbomb-croatia-2018",
  name: "Croatia 2018 Sample",
  shortName: "CRO",
  country: "Croatia",
  color: "#f15b5b",
  accentColor: "#ffe6e6",
  tacticStyle: "possession",
  attackBias: 0.56,
  defensiveLine: 0.54,
  pressing: 0.57,
  tempo: 0.59,
  players: croatiaPlayers,
  dataSource: "statsbomb-open-data",
  dataQuality: 0.72
};

const clonePlayers = (
  players: PlayerRating[],
  teamId: string,
  teamName: string,
  idPrefix: string
): PlayerRating[] =>
  players.map((player) => ({
    ...player,
    id: player.id.replace(/^(fra|cro)/, idPrefix),
    teamId,
    teamName,
    rawStats: {
      ...player.rawStats,
      clonedFrom: player.teamName
    }
  }));

const cloneTeam = (team: Team, id: string, name: string, shortName: string, color: string): Team => ({
  ...team,
  id,
  name,
  shortName,
  color,
  players: clonePlayers(team.players, id, name, shortName.toLowerCase())
});

const mapSampleEventForTeams = (event: MatchEvent, homeTeam: Team, awayTeam: Team): MatchEvent => {
  const isHome = event.teamId === franceTeam.id;
  const isAway = event.teamId === croatiaTeam.id;
  const teamId = isHome ? homeTeam.id : isAway ? awayTeam.id : event.teamId;
  const prefix = isHome ? homeTeam.shortName.toLowerCase() : isAway ? awayTeam.shortName.toLowerCase() : undefined;
  const sourcePrefix = isHome ? "fra" : isAway ? "cro" : undefined;

  return {
    ...event,
    id: `${event.id}-${homeTeam.shortName.toLowerCase()}-${awayTeam.shortName.toLowerCase()}`,
    teamId,
    playerId: sourcePrefix && prefix ? event.playerId?.replace(sourcePrefix, prefix) : event.playerId,
    receiverId: sourcePrefix && prefix ? event.receiverId?.replace(sourcePrefix, prefix) : event.receiverId,
    description: event.description
      .replaceAll("France 2018 Sample", homeTeam.name)
      .replaceAll("Croatia 2018 Sample", awayTeam.name)
  };
};

const createLineup = (team: Team, players: PlayerRating[], formation: string) => ({
  teamId: team.id,
  formation,
  starters: players.map((player) => ({
    playerId: player.id,
    playerName: player.name,
    teamId: team.id,
    position: player.position,
    number: player.number,
    x: player.x,
    y: player.y
  }))
});

const createSampleMatch = (params: {
  id: string;
  competitionId: string;
  seasonId: string;
  kickoff: string;
  homeTeam: Team;
  awayTeam: Team;
  homePlayers: PlayerRating[];
  awayPlayers: PlayerRating[];
}): HistoricalMatch => ({
  id: params.id,
  competitionId: params.competitionId,
  seasonId: params.seasonId,
  homeTeam: {
    ...params.homeTeam,
    players: params.homePlayers
  },
  awayTeam: {
    ...params.awayTeam,
    players: params.awayPlayers
  },
  kickoff: params.kickoff,
  finalScore: {
    home: 4,
    away: 2
  },
  lineups: [createLineup(params.homeTeam, params.homePlayers, "4-2-3-1"), createLineup(params.awayTeam, params.awayPlayers, "4-3-3")],
  events: sampleEvents.map((event) => mapSampleEventForTeams(event, params.homeTeam, params.awayTeam)),
  raw: {
    note: "Condensed local sample shaped after StatsBomb Open Data event and lineup files for offline replay."
  }
});

export const statsBombSampleMatches: HistoricalMatch[] = [
  createSampleMatch({
    id: "sb-sample-france-croatia-2018",
    competitionId: "sb-world-cup-sample",
    seasonId: "2018",
    kickoff: "2018-07-15T15:00:00.000Z",
    homeTeam: franceTeam,
    awayTeam: croatiaTeam,
    homePlayers: francePlayers,
    awayPlayers: croatiaPlayers
  }),
  createSampleMatch({
    id: "sb-sample-belgium-japan-2018",
    competitionId: "sb-world-cup-sample",
    seasonId: "2018",
    kickoff: "2018-07-02T18:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-belgium-2018", "Belgium 2018 Sample", "BEL", "#c83232"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-japan-2018", "Japan 2018 Sample", "JPN", "#4f8cff"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-belgium-2018", "Belgium 2018 Sample", "bel"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-japan-2018", "Japan 2018 Sample", "jpn")
  }),
  createSampleMatch({
    id: "sb-sample-brazil-mexico-2018",
    competitionId: "sb-world-cup-sample",
    seasonId: "2018",
    kickoff: "2018-07-02T14:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-brazil-2018", "Brazil 2018 Sample", "BRA", "#2eb85c"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-mexico-2018", "Mexico 2018 Sample", "MEX", "#1d7f46"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-brazil-2018", "Brazil 2018 Sample", "bra"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-mexico-2018", "Mexico 2018 Sample", "mex")
  }),
  createSampleMatch({
    id: "sb-sample-argentina-france-2018",
    competitionId: "sb-world-cup-sample",
    seasonId: "2018",
    kickoff: "2018-06-30T14:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-argentina-2018", "Argentina 2018 Sample", "ARG", "#71c7ec"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-france-alt-2018", "France Alt 2018 Sample", "FRA", "#2f80ed"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-argentina-2018", "Argentina 2018 Sample", "arg"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-france-alt-2018", "France Alt 2018 Sample", "fra")
  }),
  createSampleMatch({
    id: "sb-sample-spain-russia-2018",
    competitionId: "sb-world-cup-sample",
    seasonId: "2018",
    kickoff: "2018-07-01T14:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-spain-2018", "Spain 2018 Sample", "ESP", "#f4c430"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-russia-2018", "Russia 2018 Sample", "RUS", "#cc3333"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-spain-2018", "Spain 2018 Sample", "esp"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-russia-2018", "Russia 2018 Sample", "rus")
  }),
  createSampleMatch({
    id: "sb-sample-usa-netherlands-2019",
    competitionId: "sb-womens-world-cup-sample",
    seasonId: "2019",
    kickoff: "2019-07-07T15:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-usa-2019", "USA 2019 Sample", "USA", "#2455a6"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-netherlands-2019", "Netherlands 2019 Sample", "NED", "#f47a30"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-usa-2019", "USA 2019 Sample", "usa"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-netherlands-2019", "Netherlands 2019 Sample", "ned")
  }),
  createSampleMatch({
    id: "sb-sample-england-sweden-2019",
    competitionId: "sb-womens-world-cup-sample",
    seasonId: "2019",
    kickoff: "2019-07-06T15:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-england-2019", "England 2019 Sample", "ENG", "#f0f4ff"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-sweden-2019", "Sweden 2019 Sample", "SWE", "#ffd84f"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-england-2019", "England 2019 Sample", "eng"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-sweden-2019", "Sweden 2019 Sample", "swe")
  }),
  createSampleMatch({
    id: "sb-sample-liverpool-tottenham-2019",
    competitionId: "sb-champions-league-sample",
    seasonId: "2018-2019",
    kickoff: "2019-06-01T19:00:00.000Z",
    homeTeam: cloneTeam(franceTeam, "statsbomb-liverpool-2019", "Liverpool 2019 Sample", "LIV", "#d61f26"),
    awayTeam: cloneTeam(croatiaTeam, "statsbomb-tottenham-2019", "Tottenham 2019 Sample", "TOT", "#f7f7ff"),
    homePlayers: clonePlayers(francePlayers, "statsbomb-liverpool-2019", "Liverpool 2019 Sample", "liv"),
    awayPlayers: clonePlayers(croatiaPlayers, "statsbomb-tottenham-2019", "Tottenham 2019 Sample", "tot")
  })
];
