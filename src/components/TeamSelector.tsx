import type { Team } from "@/types/team";

type TeamSelectorProps = {
  label: string;
  value: string;
  options: Team[];
  onChange: (teamId: string) => void;
};

export function TeamSelector({ label, value, options, onChange }: TeamSelectorProps): JSX.Element {
  return (
    <label className="flex min-w-[220px] flex-col gap-2 text-sm text-slate-100">
      <span className="font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-accent"
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
