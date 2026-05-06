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

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  minute,
  second = 0,
  possession
}: ScoreboardProps): JSX.Element {
  const clock = `${minute}:${String(second).padStart(2, "0")}`;

  return (
    <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: homeTeam.color }} />
        <p className="font-semibold text-slate-100">{homeTeam.name}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-2xl font-extrabold text-white">
          {homeScore} - {awayScore}
        </p>
        <p className="text-sm text-slate-300">{clock}</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <p className="font-semibold text-slate-100">{awayTeam.name}</p>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: awayTeam.color }} />
      </div>

      <div className="sm:col-span-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="rounded border border-slate-700 bg-slate-800/70 px-3 py-2">
          Possession {homeTeam.shortName}: {possession.home}%
        </div>
        <div className="rounded border border-slate-700 bg-slate-800/70 px-3 py-2 text-right">
          Possession {awayTeam.shortName}: {possession.away}%
        </div>
      </div>
    </div>
  );
}
