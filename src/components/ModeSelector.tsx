export type SimulatorMode = "prediction" | "replay" | "demo";

type ModeSelectorProps = {
  value: SimulatorMode;
  onChange: (mode: SimulatorMode) => void;
};

const modes: Array<{ id: SimulatorMode; label: string; icon: string }> = [
  { id: "prediction", label: "Match Prediction", icon: "⚽" },
  { id: "replay", label: "Historical Replay", icon: "📺" },
  { id: "demo", label: "Demo Match", icon: "🎮" }
];

export function ModeSelector({ value, onChange }: ModeSelectorProps): JSX.Element {
  return (
    <div className="grid gap-2 rounded-lg border border-emerald-500/20 bg-gradient-to-r from-surface via-panel to-surface p-1.5 sm:grid-cols-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
            value === mode.id
              ? "bg-emerald-500 text-stadium shadow-glow"
              : "text-emerald-100/70 hover:bg-emerald-500/10 hover:text-emerald-100"
          }`}
        >
          <span>{mode.icon}</span>
          <span className="font-body">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
