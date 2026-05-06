import type { Team } from "@/types/team";

type StartingXIProps = {
  homeTeam: Team;
  awayTeam: Team;
};

const PlayerList = ({ team }: { team: Team }): JSX.Element => (
  <div className="rounded border border-slate-700 bg-slate-950 p-3">
    <div className="mb-2 flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
      <p className="text-sm font-semibold text-slate-100">{team.shortName} Starting XI</p>
    </div>
    <div className="grid grid-cols-1 gap-1 text-xs text-slate-300 sm:grid-cols-2">
      {team.players.slice(0, 11).map((player) => (
        <p key={player.id} className="truncate">
          {player.number ?? "-"} · {player.name} · {player.position}
        </p>
      ))}
    </div>
  </div>
);

export function StartingXI({ homeTeam, awayTeam }: StartingXIProps): JSX.Element {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <PlayerList team={homeTeam} />
      <PlayerList team={awayTeam} />
    </section>
  );
}
