import { simulateMatch } from "@/engine/matchEngine";
import type { DataQuality, MatchSummary, PredictionResult, ScorelineProbability } from "@/types/match";
import type { Team } from "@/types/team";

export type MonteCarloOptions = {
  simulations?: number;
  seed?: string;
  dataQuality?: DataQuality;
};

const defaultQuality: DataQuality = {
  score: 0.45,
  label: "demo",
  warnings: [
    "Using local or incomplete data. Ratings are transparent approximations, not official scouting grades.",
    "Free data sources often omit tracking speed, pressure, pass value, and recent injury context."
  ]
};

const percentage = (count: number, total: number): number => Math.round((count / Math.max(1, total)) * 1000) / 10;

const topScorelines = (counts: Map<string, number>, total: number): ScorelineProbability[] =>
  [...counts.entries()]
    .map(([scoreline, count]) => ({
      scoreline,
      count,
      probability: percentage(count, total)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

const representativeFor = (matches: MatchSummary[], likelyScoreline: string | undefined): MatchSummary => {
  const matching = likelyScoreline
    ? matches.filter((match) => `${match.finalScore.home}-${match.finalScore.away}` === likelyScoreline)
    : [];

  if (matching.length > 0) {
    return matching[Math.floor(matching.length / 2)];
  }

  return matches[Math.floor(matches.length / 2)] ?? matches[0];
};

export const runMonteCarloPrediction = (
  homeTeam: Team,
  awayTeam: Team,
  options: MonteCarloOptions = {}
): PredictionResult => {
  const simulations = options.simulations ?? 500;
  const seed = options.seed ?? `${Date.now()}-${homeTeam.id}-${awayTeam.id}`;
  const matches: MatchSummary[] = [];
  const scorelineCounts = new Map<string, number>();
  const mvpCounts = new Map<string, number>();

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let homeXg = 0;
  let awayXg = 0;

  for (let index = 0; index < simulations; index += 1) {
    const match = simulateMatch(homeTeam, awayTeam, {
      seed: `${seed}-${index}`
    });

    matches.push(match);
    homeGoals += match.finalScore.home;
    awayGoals += match.finalScore.away;
    homeXg += match.stats.home.xg;
    awayXg += match.stats.away.xg;

    if (match.finalScore.home > match.finalScore.away) {
      homeWins += 1;
    } else if (match.finalScore.home < match.finalScore.away) {
      awayWins += 1;
    } else {
      draws += 1;
    }

    const scoreline = `${match.finalScore.home}-${match.finalScore.away}`;
    scorelineCounts.set(scoreline, (scorelineCounts.get(scoreline) ?? 0) + 1);
    mvpCounts.set(match.mvpPlayerId, (mvpCounts.get(match.mvpPlayerId) ?? 0) + 1);
  }

  const likelyScorelines = topScorelines(scorelineCounts, simulations);
  const representativeMatch = representativeFor(matches, likelyScorelines[0]?.scoreline);
  const allPlayers = [...homeTeam.players, ...awayTeam.players];

  return {
    simulationsRun: simulations,
    homeWinProbability: percentage(homeWins, simulations),
    drawProbability: percentage(draws, simulations),
    awayWinProbability: percentage(awayWins, simulations),
    likelyScorelines,
    averageGoals: {
      home: Math.round((homeGoals / simulations) * 100) / 100,
      away: Math.round((awayGoals / simulations) * 100) / 100
    },
    averageXg: {
      home: Math.round((homeXg / simulations) * 100) / 100,
      away: Math.round((awayXg / simulations) * 100) / 100
    },
    mvpCandidates: [...mvpCounts.entries()]
      .map(([playerId, count]) => {
        const player = allPlayers.find((candidate) => candidate.id === playerId);
        return {
          playerId,
          playerName: player?.name ?? playerId,
          teamId: player?.teamId ?? "",
          count,
          probability: percentage(count, simulations)
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    dataQuality: options.dataQuality ?? defaultQuality,
    representativeMatch: {
      ...representativeMatch,
      dataQuality: options.dataQuality ?? defaultQuality
    }
  };
};
