export type SimulatorMode = "prediction" | "replay" | "demo";

type ModeSelectorProps = {
  value: SimulatorMode;
  onChange: (mode: SimulatorMode) => void;
};

const modes: Array<{ id: SimulatorMode; label: string }> = [
  { id: "prediction", label: "Future Match Prediction" },
  { id: "replay", label: "Historical Real Match Replay" },
  { id: "demo", label: "Demo Mode" }
];

export function ModeSelector({ value, onChange }: ModeSelectorProps): JSX.Element {
  return (
    <div className="grid gap-2 rounded-md border border-slate-700 bg-slate-950/70 p-2 sm:grid-cols-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`rounded px-3 py-2 text-sm font-medium transition ${
            value === mode.id ? "bg-accent text-slate-950" : "bg-slate-900 text-slate-200 hover:bg-slate-800"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
