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
    <section className="rounded-xl border border-emerald-500/20 bg-panel/80 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">Match Stats</h3>
        {isFinal && mvpName ? (
          <div className="flex items-center gap-1.5 rounded-md bg-cardYellow/10 px-2.5 py-1">
            <span className="text-xs">⭐</span>
            <p className="text-xs font-semibold text-cardYellow">MVP: {mvpName}</p>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-emerald-500/15">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-emerald-500/15 bg-stadium/60 text-xs uppercase tracking-wider text-emerald-300/80">
              <th className="px-3 py-2.5 text-left font-semibold">{homeTeam.shortName}</th>
              <th className="px-3 py-2.5 text-center font-semibold">Metric</th>
              <th className="px-3 py-2.5 text-right font-semibold">{awayTeam.shortName}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={`border-t border-emerald-500/10 ${i % 2 === 0 ? "bg-stadium/30" : "bg-transparent"}`}
              >
                <td className="px-3 py-2 text-left font-semibold text-netWhite">{row.home}</td>
                <td className="px-3 py-2 text-center text-emerald-100/60">{row.label}</td>
                <td className="px-3 py-2 text-right font-semibold text-netWhite">{row.away}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
