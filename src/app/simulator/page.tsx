"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DataSourceStatus } from "@/components/DataSourceStatus";
import { MatchControls } from "@/components/MatchControls";
import { MatchStatsPanel } from "@/components/MatchStatsPanel";
import { MatchTimeline } from "@/components/MatchTimeline";
import { ModeSelector, type SimulatorMode } from "@/components/ModeSelector";
import { Pitch2D } from "@/components/Pitch2D";
import { PredictionResultsPanel } from "@/components/PredictionResultsPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { StartingXI } from "@/components/StartingXI";
import { TeamSelector } from "@/components/TeamSelector";
import { DEFAULT_FOOTBALL_CONFIG, SUPPORTED_LEAGUES, SUPPORTED_SEASONS } from "@/config/football";
import { teams as localTeams } from "@/data/teams";
import { simulateMatch } from "@/engine/matchEngine";
import { runMonteCarloPrediction } from "@/engine/prediction/monteCarlo";
import { buildReplayMatch } from "@/engine/replayEngine";
import { buildStartingXI } from "@/engine/startingXi";
import type { FixtureSummary, HistoricalCompetition, HistoricalMatch, ProviderStatus } from "@/types/dataProvider";
import type { DataQuality, MatchFrame, MatchStats, MatchSummary, PredictionResult } from "@/types/match";
import type { Team } from "@/types/team";

type FootballDataStatusResponse = {
  apiFootball: ProviderStatus;
  localDemo: ProviderStatus;
};

type ProviderPayload<T> = {
  data: T;
  status: ProviderStatus;
};

const emptyStats = (): MatchStats => ({
  home: {
    goals: 0,
    possessionTicks: 0,
    shots: 0,
    shotsOnTarget: 0,
    xg: 0,
    passesAttempted: 0,
    passesCompleted: 0,
    tackles: 0,
    fouls: 0,
    corners: 0,
    interceptions: 0
  },
  away: {
    goals: 0,
    possessionTicks: 0,
    shots: 0,
    shotsOnTarget: 0,
    xg: 0,
    passesAttempted: 0,
    passesCompleted: 0,
    tackles: 0,
    fouls: 0,
    corners: 0,
    interceptions: 0
  }
});

const makePreviewFrame = (home: Team, away: Team): MatchFrame => ({
  tick: 0,
  minute: 0,
  second: 0,
  elapsedSeconds: 0,
  ball: {
    x: 50,
    y: 50,
    teamId: home.id
  },
  players: [...home.players, ...away.players].map((player) => ({
    playerId: player.id,
    teamId: player.teamId,
    x: player.x,
    y: player.y,
    hasBall: false,
    stamina: player.stamina
  })),
  score: {
    home: 0,
    away: 0
  }
});

const dataQualityFor = (apiStatus?: ProviderStatus): DataQuality => {
  if (apiStatus?.state === "connected" || apiStatus?.state === "cached") {
    return {
      score: apiStatus.state === "connected" ? 0.72 : 0.62,
      label: apiStatus.state === "connected" ? "medium" : "low",
      warnings: [
        "API-Football data is converted into simulator ratings with transparent approximations where detailed stats are unavailable."
      ]
    };
  }

  return {
    score: 0.42,
    label: "demo",
    warnings: [
      "No live API-Football data is available, so the prediction uses bundled local ratings and sample fixtures."
    ]
  };
};

const hydrateTeamWithSquad = async (team: Team, options: { season?: string; attacksRight: boolean }): Promise<Team> => {
  if (team.players.length >= 11 || team.dataSource === "local-demo") {
    return {
      ...team,
      players: buildStartingXI(team.players, { attacksRight: options.attacksRight })
    };
  }

  const response = await fetch(
    `/api/football/squad?teamId=${encodeURIComponent(team.id)}${options.season ? `&season=${options.season}` : ""}`
  );

  if (!response.ok) {
    return team;
  }

  const payload = (await response.json()) as ProviderPayload<Team["players"]>;
  return {
    ...team,
    players: payload.data.length >= 11 ? buildStartingXI(payload.data, { attacksRight: options.attacksRight }) : team.players,
    dataQuality: payload.data.length >= 11 ? 0.65 : team.dataQuality
  };
};

export default function SimulatorPage(): JSX.Element {
  const [mode, setMode] = useState<SimulatorMode>("prediction");
  const [apiStatus, setApiStatus] = useState<ProviderStatus>();
  const [statsBombStatus, setStatsBombStatus] = useState<ProviderStatus>();
  const [predictionTeams, setPredictionTeams] = useState<Team[]>(localTeams);
  const [fixtures, setFixtures] = useState<FixtureSummary[]>([]);
  const [leagueId, setLeagueId] = useState(DEFAULT_FOOTBALL_CONFIG.leagueId);
  const [season, setSeason] = useState(DEFAULT_FOOTBALL_CONFIG.season);
  const [homeTeamId, setHomeTeamId] = useState(localTeams[0]?.id ?? "");
  const [awayTeamId, setAwayTeamId] = useState(localTeams[1]?.id ?? localTeams[0]?.id ?? "");
  const [fixtureId, setFixtureId] = useState("");
  const [competitions, setCompetitions] = useState<HistoricalCompetition[]>([]);
  const [competitionId, setCompetitionId] = useState("");
  const [replaySeasonId, setReplaySeasonId] = useState("");
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatch[]>([]);
  const [historicalMatchId, setHistoricalMatchId] = useState("");
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(2);
  const [isWorking, setIsWorking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [squadLoadingTeamIds, setSquadLoadingTeamIds] = useState<string[]>([]);
  const [dataError, setDataError] = useState("");

  const selectedHomeTeam = useMemo(
    () => predictionTeams.find((team) => team.id === homeTeamId) ?? predictionTeams[0] ?? localTeams[0],
    [homeTeamId, predictionTeams]
  );
  const selectedAwayTeam = useMemo(
    () => predictionTeams.find((team) => team.id === awayTeamId) ?? predictionTeams[1] ?? localTeams[1] ?? localTeams[0],
    [awayTeamId, predictionTeams]
  );
  const selectedFixture = fixtures.find((fixture) => fixture.id === fixtureId);
  const activeHomeTeam = match?.homeTeam ?? selectedHomeTeam;
  const activeAwayTeam = match?.awayTeam ?? selectedAwayTeam;
  const frameDurationMs = Math.max(45, Math.floor(240 / replaySpeed));
  const replaySeasons = competitions.filter((competition) => competition.id === competitionId);

  const loadHistoricalMatches = useCallback(async (nextCompetitionId: string, nextSeasonId: string): Promise<void> => {
    const matchesResponse = await fetch(
      `/api/statsbomb/matches?competitionId=${encodeURIComponent(nextCompetitionId)}&seasonId=${encodeURIComponent(nextSeasonId)}`
    );
    const matchesPayload = (await matchesResponse.json()) as ProviderPayload<HistoricalMatch[]>;
    setHistoricalMatches(matchesPayload.data);
    setHistoricalMatchId(matchesPayload.data[0]?.id || "");
  }, []);

  const loadProviderData = useCallback(async (refresh = false): Promise<void> => {
    setIsRefreshing(true);
    setDataError("");
    try {
      const query = `league=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}${refresh ? "&refresh=1" : ""}`;
      const [statusResponse, teamsResponse, fixturesResponse, competitionsResponse] = await Promise.all([
        fetch("/api/football/status"),
        fetch(`/api/football/teams?${query}`),
        fetch(`/api/football/fixtures?${query}`),
        fetch("/api/statsbomb/competitions")
      ]);

      const statusPayload = (await statusResponse.json()) as FootballDataStatusResponse;
      const teamsPayload = (await teamsResponse.json()) as ProviderPayload<Team[]>;
      const fixturesPayload = (await fixturesResponse.json()) as ProviderPayload<FixtureSummary[]>;
      const competitionsPayload = (await competitionsResponse.json()) as ProviderPayload<HistoricalCompetition[]>;

      setApiStatus(teamsPayload.status.state === "fallback" ? statusPayload.apiFootball : teamsPayload.status);
      setStatsBombStatus(competitionsPayload.status);
      setPredictionTeams(teamsPayload.data.length > 0 ? teamsPayload.data : localTeams);
      setFixtures(fixturesPayload.data);
      setFixtureId((current) => current || fixturesPayload.data[0]?.id || "");
      setCompetitions(competitionsPayload.data);

      const nextCompetitionId = competitionId || competitionsPayload.data[0]?.id || "";
      const nextSeasonId =
        replaySeasonId ||
        competitionsPayload.data.find((competition) => competition.id === nextCompetitionId)?.seasonId ||
        "";
      setCompetitionId(nextCompetitionId);
      setReplaySeasonId(nextSeasonId);

      if (nextCompetitionId && nextSeasonId) {
        await loadHistoricalMatches(nextCompetitionId, nextSeasonId);
      }
    } catch (error) {
      setPredictionTeams(localTeams);
      setDataError(error instanceof Error ? error.message : "Failed to load football data.");
    } finally {
      setIsRefreshing(false);
    }
  }, [competitionId, leagueId, loadHistoricalMatches, replaySeasonId, season]);

  const loadSquadForTeam = useCallback(async (teamId: string, attacksRight: boolean): Promise<void> => {
    const team = predictionTeams.find((candidate) => candidate.id === teamId);
    if (!team || team.players.length >= 11) {
      return;
    }

    setSquadLoadingTeamIds((current) => [...new Set([...current, teamId])]);
    try {
      const response = await fetch(
        `/api/football/squad?teamId=${encodeURIComponent(teamId)}&season=${encodeURIComponent(season)}`
      );
      const payload = (await response.json()) as ProviderPayload<Team["players"]>;
      setApiStatus(payload.status);

      if (payload.data.length >= 11) {
        setPredictionTeams((current) =>
          current.map((candidate) =>
            candidate.id === teamId
              ? {
                  ...candidate,
                  players: buildStartingXI(payload.data, { attacksRight }),
                  dataQuality: payload.status.state === "connected" ? 0.7 : 0.55
                }
              : candidate
          )
        );
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Failed to load squad data.");
    } finally {
      setSquadLoadingTeamIds((current) => current.filter((id) => id !== teamId));
    }
  }, [predictionTeams, season]);

  useEffect(() => {
    void loadProviderData();
  }, [loadProviderData]);

  useEffect(() => {
    if (mode !== "prediction") {
      return;
    }
    void loadSquadForTeam(homeTeamId, true);
    void loadSquadForTeam(awayTeamId, false);
  }, [awayTeamId, homeTeamId, loadSquadForTeam, mode]);

  useEffect(() => {
    if (!match || !isPlaying) {
      return;
    }

    const lastIndex = match.frames.length - 1;
    const intervalId = window.setInterval(() => {
      setPlayhead((current) => {
        if (current >= lastIndex) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, frameDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [match, isPlaying, frameDurationMs]);

  const currentFrame = match?.frames[playhead] ?? makePreviewFrame(activeHomeTeam, activeAwayTeam);
  const nextFrame = match?.frames[playhead + 1];
  const currentEvent = match?.events.find((event) => event.id === currentFrame.lastEventId);
  const liveStats = match?.statsByTick[playhead] ?? emptyStats();
  const totalPossessionTicks = Math.max(1, liveStats.home.possessionTicks + liveStats.away.possessionTicks);
  const homePossession = Math.round((liveStats.home.possessionTicks / totalPossessionTicks) * 100);
  const awayPossession = 100 - homePossession;
  const isFinal = Boolean(match && playhead >= match.frames.length - 1 && !isPlaying);

  const mvpName = useMemo(() => {
    if (!match) {
      return "";
    }

    const player = [...match.homeTeam.players, ...match.awayTeam.players].find(
      (candidate) => candidate.id === match.mvpPlayerId
    );
    return player?.name ?? "";
  }, [match]);

  const playerMeta = useMemo(() => {
    const dictionary: Record<string, { number: number; name: string }> = {};
    for (const team of [activeHomeTeam, activeAwayTeam]) {
      for (const [index, player] of team.players.entries()) {
        dictionary[player.id] = {
          number: player.number ?? index + 1,
          name: player.name
        };
      }
    }
    return dictionary;
  }, [activeHomeTeam, activeAwayTeam]);

  const onHomeChange = (teamId: string): void => {
    setHomeTeamId(teamId);
    if (teamId === awayTeamId) {
      setAwayTeamId(predictionTeams.find((team) => team.id !== teamId)?.id ?? teamId);
    }
  };

  const onAwayChange = (teamId: string): void => {
    setAwayTeamId(teamId);
    if (teamId === homeTeamId) {
      setHomeTeamId(predictionTeams.find((team) => team.id !== teamId)?.id ?? teamId);
    }
  };

  const beginPlayback = (summary: MatchSummary): void => {
    setMatch(summary);
    setPlayhead(0);
    setIsPlaying(true);
  };

  const handlePrediction = async (): Promise<void> => {
    if (selectedHomeTeam.id === selectedAwayTeam.id) {
      return;
    }

    setIsWorking(true);
    try {
      const seasonForSquads = selectedFixture?.season ?? season;
      const [homeWithSquad, awayWithSquad] = await Promise.all([
        hydrateTeamWithSquad(selectedHomeTeam, { season: seasonForSquads, attacksRight: true }),
        hydrateTeamWithSquad(selectedAwayTeam, { season: seasonForSquads, attacksRight: false })
      ]);
      const result = runMonteCarloPrediction(homeWithSquad, awayWithSquad, {
        simulations: 500,
        dataQuality: dataQualityFor(apiStatus),
        seed: `${Date.now()}-${homeWithSquad.id}-${awayWithSquad.id}`
      });

      setPrediction(result);
      beginPlayback(result.representativeMatch);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDemo = (): void => {
    const summary = simulateMatch(selectedHomeTeam, selectedAwayTeam, {
      seed: `demo-${Date.now()}`
    });
    setPrediction(null);
    beginPlayback({
      ...summary,
      dataQuality: dataQualityFor(undefined)
    });
  };

  const handleReplay = async (): Promise<void> => {
    setIsWorking(true);
    try {
      const response = await fetch(`/api/statsbomb/match?matchId=${encodeURIComponent(historicalMatchId)}`);
      const selectedHistoricalMatch = (await response.json()) as ProviderPayload<HistoricalMatch>;
      setPrediction(null);
      beginPlayback(buildReplayMatch(selectedHistoricalMatch.data));
    } finally {
      setIsWorking(false);
    }
  };

  const primaryAction = mode === "prediction" ? handlePrediction : mode === "replay" ? handleReplay : handleDemo;
  const primaryLabel =
    mode === "prediction" ? "Run 500 Monte Carlo Sims" : mode === "replay" ? "Load Replay" : "Run Demo Match";

  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">RealBall Sim</h1>
          <p className="text-sm text-slate-200">Data-driven event simulation and historical 2D football replay.</p>
        </div>
      </header>

      <ModeSelector value={mode} onChange={setMode} />

      <DataSourceStatus
        apiFootball={apiStatus}
        statsBomb={statsBombStatus}
        onRefresh={() => void loadProviderData(true)}
        isRefreshing={isRefreshing}
      />

      {mode === "prediction" || mode === "demo" ? (
        <section className="grid gap-3 rounded-md border border-slate-700 bg-slate-950/60 p-3 lg:grid-cols-[0.8fr_0.6fr_1fr_1fr_1fr]">
          <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">League</span>
            <select
              value={leagueId}
              onChange={(event) => setLeagueId(event.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {SUPPORTED_LEAGUES.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">Season</span>
            <select
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {SUPPORTED_SEASONS.map((supportedSeason) => (
                <option key={supportedSeason} value={supportedSeason}>
                  {supportedSeason}
                </option>
              ))}
            </select>
          </label>
          <TeamSelector label="Team A" value={selectedHomeTeam.id} options={predictionTeams} onChange={onHomeChange} />
          <TeamSelector label="Team B" value={selectedAwayTeam.id} options={predictionTeams} onChange={onAwayChange} />
          <label className="flex min-w-[220px] flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">Upcoming fixture</span>
            <select
              value={fixtureId}
              onChange={(event) => setFixtureId(event.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {fixtures.length === 0 ? (
                <option value="">No fixture data loaded</option>
              ) : (
                fixtures.map((fixture) => (
                  <option key={fixture.id} value={fixture.id}>
                    {fixture.homeTeamName} vs {fixture.awayTeamName}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="lg:col-span-5">
            {isRefreshing || squadLoadingTeamIds.length > 0 ? (
              <p className="text-xs text-slate-300">
                Loading {isRefreshing ? "league data" : "selected squad data"}...
              </p>
            ) : null}
            {dataError ? <p className="text-xs text-amber-200">{dataError}</p> : null}
            {apiStatus?.state === "missing_key" || apiStatus?.state === "quota_exceeded" || apiStatus?.state === "error" ? (
              <p className="text-xs text-amber-200">{apiStatus.message}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {mode === "replay" ? (
        <section className="grid gap-3 rounded-md border border-slate-700 bg-slate-950/60 p-3 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">Competition</span>
            <select
              value={competitionId}
              onChange={(event) => {
                const nextCompetitionId = event.target.value;
                const nextSeasonId =
                  competitions.find((competition) => competition.id === nextCompetitionId)?.seasonId ?? "";
                setCompetitionId(nextCompetitionId);
                setReplaySeasonId(nextSeasonId);
                void loadHistoricalMatches(nextCompetitionId, nextSeasonId);
              }}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {[...new Map(competitions.map((competition) => [competition.id, competition])).values()].map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">Season</span>
            <select
              value={replaySeasonId}
              onChange={(event) => {
                const nextSeasonId = event.target.value;
                setReplaySeasonId(nextSeasonId);
                void loadHistoricalMatches(competitionId, nextSeasonId);
              }}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {replaySeasons.map((competition) => (
                <option key={competition.seasonId} value={competition.seasonId}>
                  {competition.seasonName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-100">
            <span className="font-medium text-slate-200">Match</span>
            <select
              value={historicalMatchId}
              onChange={(event) => setHistoricalMatchId(event.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
            >
              {historicalMatches.map((historicalMatch) => (
                <option key={historicalMatch.id} value={historicalMatch.id}>
                  {historicalMatch.homeTeam.name} vs {historicalMatch.awayTeam.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      <StartingXI homeTeam={activeHomeTeam} awayTeam={activeAwayTeam} />

      <MatchControls
        onSimulate={() => void primaryAction()}
        primaryLabel={primaryLabel}
        simDisabled={isWorking || squadLoadingTeamIds.length > 0 || selectedHomeTeam.id === selectedAwayTeam.id}
        hasMatch={Boolean(match)}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((value) => !value)}
        onRestartReplay={() => {
          setPlayhead(0);
          setIsPlaying(Boolean(match));
        }}
        replaySpeed={replaySpeed}
        onReplaySpeedChange={setReplaySpeed}
      />

      <PredictionResultsPanel result={prediction} homeTeam={activeHomeTeam} awayTeam={activeAwayTeam} />

      <Scoreboard
        homeTeam={activeHomeTeam}
        awayTeam={activeAwayTeam}
        homeScore={currentFrame.score.home}
        awayScore={currentFrame.score.away}
        minute={currentFrame.minute}
        second={currentFrame.second}
        possession={{
          home: homePossession,
          away: awayPossession
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Pitch2D
            frame={currentFrame}
            nextFrame={nextFrame}
            frameDurationMs={frameDurationMs}
            homeTeam={activeHomeTeam}
            awayTeam={activeAwayTeam}
            playerMeta={playerMeta}
            currentEvent={currentEvent}
          />

          <MatchStatsPanel
            homeTeam={activeHomeTeam}
            awayTeam={activeAwayTeam}
            stats={liveStats}
            isFinal={isFinal}
            mvpName={mvpName}
          />
        </div>

        <MatchTimeline
          events={match?.events ?? []}
          teams={match ? [match.homeTeam, match.awayTeam] : [activeHomeTeam, activeAwayTeam]}
          currentTick={currentFrame.tick}
        />
      </div>
    </main>
  );
}
