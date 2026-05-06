import type { MatchStats } from "@/types/match";
import type { Team } from "@/types/team";

type MatchStatsPanelProps = {
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  mvpName?: string;
  isFinal: boolean;
};

const pct = (value: number): string => `${Math.round(value)}%`;
const fixed = (value: number): string => value.toFixed(2);

type Row = {
  label: string;
  home: string | number;
  away: string | number;
};

export function MatchStatsPanel({
  homeTeam,
  awayTeam,
  stats,
  mvpName,
  isFinal
}: MatchStatsPanelProps): JSX.Element {
  const totalPossession = Math.max(1, stats.home.possessionTicks + stats.away.possessionTicks);

  const rows: Row[] = [
    { label: "Goals", home: stats.home.goals, away: stats.away.goals },
    {
      label: "Possession",
      home: pct((stats.home.possessionTicks / totalPossession) * 100),
      away: pct((stats.away.possessionTicks / totalPossession) * 100)
    },
    { label: "Shots", home: stats.home.shots, away: stats.away.shots },
    {
      label: "Shots On Target",
      home: stats.home.shotsOnTarget,
      away: stats.away.shotsOnTarget
    },
    {
      label: "Passes",
      home: stats.home.passesAttempted,
      away: stats.away.passesAttempted
    },
    {
      label: "Pass Accuracy",
      home: pct((stats.home.passesCompleted / Math.max(1, stats.home.passesAttempted)) * 100),
      away: pct((stats.away.passesCompleted / Math.max(1, stats.away.passesAttempted)) * 100)
    },
    {
      label: "Tackles",
      home: stats.home.tackles,
      away: stats.away.tackles
    },
    {
      label: "Interceptions",
      home: stats.home.interceptions,
      away: stats.away.interceptions
    },
    { label: "Fouls", home: stats.home.fouls, away: stats.away.fouls },
    { label: "Corners", home: stats.home.corners, away: stats.away.corners },
    { label: "xG-like", home: fixed(stats.home.xg), away: fixed(stats.away.xg) }
  ];

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Match Stats</h3>
        {isFinal && mvpName ? <p className="text-xs text-accent">MVP: {mvpName}</p> : null}
      </div>

      <div className="overflow-hidden rounded border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-2 py-2 text-left">{homeTeam.shortName}</th>
              <th className="px-2 py-2 text-center">Metric</th>
              <th className="px-2 py-2 text-right">{awayTeam.shortName}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-700">
                <td className="px-2 py-2 text-left text-slate-100">{row.home}</td>
                <td className="px-2 py-2 text-center text-slate-300">{row.label}</td>
                <td className="px-2 py-2 text-right text-slate-100">{row.away}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
