import type { Team } from "@/types/team";

type StartingXIProps = {
  homeTeam: Team;
  awayTeam: Team;
};

const PlayerList = ({ team }: { team: Team }): JSX.Element => (
  <div className="rounded-lg border border-emerald-500/20 bg-panel/80 p-3 shadow-panel">
    <div className="mb-2.5 flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ backgroundColor: team.color }}
      >
        {team.shortName.slice(0, 2)}
      </div>
      <p className="font-body text-sm font-semibold text-netWhite">{team.shortName} Starting XI</p>
    </div>
    <div className="grid grid-cols-1 gap-1 text-xs text-emerald-100/70 sm:grid-cols-2">
      {team.players.slice(0, 11).map((player) => (
        <p key={player.id} className="truncate">
          <span className="font-semibold text-emerald-200">{player.number ?? "-"}</span>
          {" · "}
          {player.name}
          {" · "}
          <span className="text-emerald-100/50">{player.position}</span>
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
