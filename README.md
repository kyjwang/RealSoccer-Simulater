# RealBall Sim

RealBall Sim is a 2D tactical/event football match simulator. It is not a FIFA-style physics game. The app represents football as event streams: generated prediction events for future fixtures, real historical events for replay, and local fallback events for offline demo use.

## Modes

1. Future Match Prediction

Users select two teams and, when available, an upcoming fixture. The app loads the latest available free data through server-side providers, builds simulator ratings, runs Monte Carlo simulations, reports win/draw/loss probabilities, likely scorelines, average goals/xG-like totals, MVP candidates, and animates one representative generated match.

2. Historical Real Match Replay

Users select a historical match from a StatsBomb Open Data style source. Replay mode does not generate events. It loads event timestamps, event types, lineups, and coordinates, then animates the real event timeline using the same normalized renderer.

3. Demo Mode

If API keys are missing, quota is exceeded, or external data is incomplete, the app still runs using bundled local sample teams and a bundled StatsBomb-style replay sample.

## Data Sources

API-Football is the primary adapter for latest teams, fixtures, squads, player statistics, and lineups. Calls are made only through server routes under `/api/football`, so the API key is never exposed to browser code.

StatsBomb Open Data is represented by a local sample adapter for historical replay. The app exposes a competitions/seasons/matches browser through `/api/statsbomb/*`, with multiple bundled StatsBomb-style sample matches and future support for a full open-data folder or GitHub-backed files.

Placeholder adapters are also present for future `football-data.org` and `openfootball` support.

## Environment

Create `.env.local` when you want API-Football data:

```bash
API_FOOTBALL_KEY=your_key_here
```

You can get a free API-Football key from [API-SPORTS / API-Football](https://www.api-football.com/). Free quota is limited, so the server adapter caches responses under `.cache/api-football`.

Restart `npm run dev` after changing `.env.local`; Next.js loads environment variables when the dev server starts.

## Premier League Data

The default football config lives in [src/config/football.ts](/Users/kevin/Desktop/SoccerSimulator/src/config/football.ts):

```ts
export const DEFAULT_FOOTBALL_CONFIG = {
  leagueName: "Premier League",
  leagueId: "39",
  season: "2025"
};
```

The UI lets you change season. If API-Football returns no teams for the selected season on your key, the server transparently falls back to the latest available previous Premier League season and shows that in the data status message.

Main server routes:

```text
GET /api/football/teams?league=39&season=2025
GET /api/football/squad?teamId=TEAM_ID&season=2025
GET /api/football/fixtures?league=39&season=2025
GET /api/football/team-stats?teamId=TEAM_ID&league=39&season=2025
```

Squads come from API-Football `players/squads` first. Detailed `players` statistics are used when available to improve simulator ratings.

## Caching

API-Football responses are cached as server-side JSON in `.cache/api-football`.

- teams: cached by league and season
- fixtures: cached by league and season
- squads: cached by team id
- player stats: cached by team and season

The "Refresh Data" button appends `refresh=1` to server calls. Use it sparingly on a free API-Football key.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000/simulator
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm run test
```

API-Football status messages are now classified to help debugging:

- `missing_key`: key missing/invalid
- `quota_exceeded`: free quota reached
- `forbidden`: endpoint/plan/season access denied (HTTP 403)
- `cached`: cached data used
- `error`: uncategorized provider error

## Architecture

```text
src/
  app/
    api/football/*
    api/statsbomb/*
    simulator/page.tsx

  components/
    DataSourceStatus.tsx
    ModeSelector.tsx
    Pitch2D.tsx
    PredictionResultsPanel.tsx
    StartingXI.tsx

  engine/
    matchEngine.ts
    prediction/monteCarlo.ts
    ratingBuilder.ts
    replayEngine.ts
    startingXi.ts

  providers/
    apiFootballProvider.ts
    statsBombOpenDataProvider.ts
    fallback/localDemoProvider.ts
    cache/fileCache.ts
    placeholderProviders.ts

  types/
    dataProvider.ts
    event.ts
    match.ts
    player.ts
    team.ts
```

## Starting XI

When no confirmed lineup exists, [startingXi.ts](/Users/kevin/Desktop/SoccerSimulator/src/engine/startingXi.ts) selects:

- 1 GK
- 4 DF
- 3 MF
- 3 FW

If a position is short, the remaining slots are filled by the strongest available players based on the generated ratings.

## Replay Data

Replay mode loads:

```text
GET /api/statsbomb/competitions
GET /api/statsbomb/matches?competitionId=...&seasonId=...
GET /api/statsbomb/match?matchId=...
```

The local sample data mirrors the StatsBomb Open Data structure:

- competitions and seasons
- match list
- lineups
- normalized events
- optional 360 freeze-frame method stub

Prediction simulation creates events. Historical replay loads events. That distinction is intentional and important.

## Normalized Events

Both generated simulations and historical replays use:

```ts
type MatchEvent = {
  id: string;
  mode: "simulated" | "replay";
  minute: number;
  second: number;
  type: "pass" | "carry" | "shot" | "goal" | "save" | "foul" | "corner" | "free_kick" | string;
  teamId?: string;
  playerId?: string;
  receiverId?: string;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  xg?: number;
  description: string;
  raw?: unknown;
};
```

The pitch uses frame snapshots derived from these events, and it also draws the active event trail from normalized `start` and `end` coordinates.

## Rating Model

`ratingBuilder.ts` maps real or cached player stats to 0-100 simulator attributes:

- shooting: goals, shots, shots on target, role defaults
- passing: assists, key passes, pass accuracy
- dribbling: dribble attempts/success, fouls won, role defaults
- defending: tackles, interceptions, blocks, duels
- stamina: minutes, starts, appearances, injury flag
- form: recent-looking production proxies and provider rating
- goalkeeper: saves, clean sheets, conceded goals
- speed: estimated from position, age, and dribbling proxies when direct speed data is unavailable

This is intentionally transparent and tunable. Free APIs often do not provide tracking data, pressure data, sprint speed, or full recent-form context, so some ratings are approximations.

## Limitations

- Prediction is probabilistic, not guaranteed.
- Free API tiers may omit detailed player statistics, injuries, live lineups, or current-season depth.
- Historical replay uses event data, not full broadcast-style tracking.
- The bundled StatsBomb sample is a compact offline replay sample shaped like open-data event and lineup files.
- 360 freeze-frame rendering is represented in the adapter architecture, but not fully rendered yet.
