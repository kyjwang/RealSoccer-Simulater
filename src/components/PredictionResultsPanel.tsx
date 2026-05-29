import type { PredictionResult } from "@/types/match";
import type { Team } from "@/types/team";

type PredictionResultsPanelProps = {
  result?: PredictionResult | null;
  homeTeam: Team;
  awayTeam: Team;
};

const fixed = (value: number): string => value.toFixed(2);

export function PredictionResultsPanel({ result, homeTeam, awayTeam }: PredictionResultsPanelProps): JSX.Element {
  if (!result) {
    return (
      <section className="rounded-xl border border-emerald-500/20 bg-panel/80 p-4 shadow-panel">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">Prediction Results</h3>
        <p className="mt-2 text-sm text-emerald-100/50">Run Monte Carlo prediction to see win probabilities and likely scorelines.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-emerald-500/20 bg-panel/80 p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">Prediction Results</h3>
        <p className="text-xs text-emerald-100/60">
          {result.simulationsRun} sims · data quality {result.dataQuality.label}
        </p>
      </div>

      {/* Win probability cards */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
          <p className="text-xs text-emerald-100/60">{homeTeam.shortName} win</p>
          <p className="mt-1 font-display text-2xl font-bold text-netWhite">{result.homeWinProbability}%</p>
        </div>
        <div className="rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
          <p className="text-xs text-emerald-100/60">Draw</p>
          <p className="mt-1 font-display text-2xl font-bold text-netWhite">{result.drawProbability}%</p>
        </div>
        <div className="rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
          <p className="text-xs text-emerald-100/60">{awayTeam.shortName} win</p>
          <p className="mt-1 font-display text-2xl font-bold text-netWhite">{result.awayWinProbability}%</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Likely scorelines</p>
          <div className="mt-2 space-y-1 text-sm text-emerald-100/80">
            {result.likelyScorelines.map((scoreline) => (
              <p key={scoreline.scoreline} className="flex justify-between">
                <span className="font-medium">{scoreline.scoreline}</span>
                <span className="text-emerald-300">{scoreline.probability}%</span>
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">Averages</p>
          <div className="mt-2 space-y-1 text-sm text-emerald-100/80">
            <p className="flex justify-between">
              <span>Goals</span>
              <span className="font-semibold">
                {fixed(result.averageGoals.home)} - {fixed(result.averageGoals.away)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>xG-like</span>
              <span className="font-semibold">
                {fixed(result.averageXg.home)} - {fixed(result.averageXg.away)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Top MVP</span>
              <span className="font-semibold text-cardYellow">{result.mvpCandidates[0]?.playerName ?? "N/A"}</span>
            </p>
          </div>
        </div>
      </div>

      {result.dataQuality.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 text-xs text-emerald-100/70">
          ⚠️ {result.dataQuality.warnings[0]}
        </div>
      ) : null}
    </section>
  );
}
