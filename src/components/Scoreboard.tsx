import type { Team } from "@/types/team";

type ScoreboardProps = {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  minute: number;
  second?: number;
  possession: {
    home: number;
    away: number;
  };
};

const clampPct = (value: number): number => Math.max(0, Math.min(100, value));

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  minute,
  second = 0,
  possession
}: ScoreboardProps): JSX.Element {
  const clock = `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  const homePossession = clampPct(possession.home);
  const awayPossession = clampPct(possession.away);

  return (
    <section className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-surface via-panel to-surface p-4 shadow-panel">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        {/* Home team */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: homeTeam.color }}
          >
            {homeTeam.shortName.slice(0, 2)}
          </div>
          <p className="truncate font-body font-semibold text-netWhite">{homeTeam.name}</p>
        </div>

        {/* Score center */}
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">Live Sim</p>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold text-netWhite">{homeScore}</span>
            <span className="font-display text-2xl font-medium text-emerald-600">:</span>
            <span className="font-display text-4xl font-bold text-netWhite">{awayScore}</span>
          </div>
          <div className="mt-0.5 rounded-md border border-emerald-500/25 bg-stadium/80 px-3 py-0.5">
            <p className="font-display text-sm font-medium tracking-wider text-emerald-300">{clock}</p>
          </div>
        </div>

        {/* Away team */}
        <div className="flex items-center justify-end gap-3">
          <p className="truncate text-right font-body font-semibold text-netWhite">{awayTeam.name}</p>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: awayTeam.color }}
          >
            {awayTeam.shortName.slice(0, 2)}
          </div>
        </div>
      </div>

      {/* Possession bar */}
      <div className="mt-4 rounded-lg border border-emerald-500/15 bg-stadium/60 p-3">
        <div className="mb-2 flex justify-between text-xs text-emerald-100/70">
          <span className="font-medium">{homeTeam.shortName} possession {homePossession}%</span>
          <span className="font-medium">{awayTeam.shortName} possession {awayPossession}%</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-stadium/80">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${homePossession}%`,
              background: `linear-gradient(90deg, ${homeTeam.color}, ${homeTeam.color}dd)`
            }}
          />
        </div>
      </div>
    </section>
  );
}
