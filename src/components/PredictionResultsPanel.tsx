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
      <section className="rounded-md border border-slate-700 bg-slate-900/80 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Prediction Results</h3>
        <p className="mt-2 text-sm text-slate-400">Run Monte Carlo prediction to populate this panel.</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Prediction Results</h3>
        <p className="text-xs text-accent">
          {result.simulationsRun} sims · data quality {result.dataQuality.label}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded border border-slate-700 bg-slate-950 p-3">
          <p className="text-xs text-slate-400">{homeTeam.shortName} win</p>
          <p className="text-xl font-bold text-white">{result.homeWinProbability}%</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-950 p-3">
          <p className="text-xs text-slate-400">Draw</p>
          <p className="text-xl font-bold text-white">{result.drawProbability}%</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-950 p-3">
          <p className="text-xs text-slate-400">{awayTeam.shortName} win</p>
          <p className="text-xl font-bold text-white">{result.awayWinProbability}%</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-700 bg-slate-950 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Likely scorelines</p>
          <div className="mt-2 space-y-1 text-sm text-slate-100">
            {result.likelyScorelines.map((scoreline) => (
              <p key={scoreline.scoreline} className="flex justify-between">
                <span>{scoreline.scoreline}</span>
                <span>{scoreline.probability}%</span>
              </p>
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-950 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400">Averages</p>
          <div className="mt-2 space-y-1 text-sm text-slate-100">
            <p className="flex justify-between">
              <span>Goals</span>
              <span>
                {fixed(result.averageGoals.home)} - {fixed(result.averageGoals.away)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>xG-like</span>
              <span>
                {fixed(result.averageXg.home)} - {fixed(result.averageXg.away)}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Top MVP</span>
              <span>{result.mvpCandidates[0]?.playerName ?? "N/A"}</span>
            </p>
          </div>
        </div>
      </div>

      {result.dataQuality.warnings.length > 0 ? (
        <div className="mt-3 rounded border border-amber-400/40 bg-amber-950/30 p-3 text-xs text-amber-100">
          {result.dataQuality.warnings[0]}
        </div>
      ) : null}
    </section>
  );
}
