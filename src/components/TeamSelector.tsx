import type { Team } from "@/types/team";

type TeamSelectorProps = {
  label: string;
  value: string;
  options: Team[];
  onChange: (teamId: string) => void;
};

export function TeamSelector({ label, value, options, onChange }: TeamSelectorProps): JSX.Element {
  return (
    <label className="flex min-w-[220px] flex-col gap-1.5 text-sm text-emerald-100">
      <span className="font-semibold text-emerald-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-emerald-500/30 bg-stadium px-3 py-2 text-sm text-emerald-50 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30"
      >
        {options.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}
