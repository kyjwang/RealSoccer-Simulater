type MatchControlsProps = {
  onSimulate: () => void;
  primaryLabel?: string;
  simDisabled?: boolean;
  hasMatch: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestartReplay: () => void;
  replaySpeed: number;
  onReplaySpeedChange: (speed: number) => void;
};

const SPEED_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 }
];

export function MatchControls({
  onSimulate,
  primaryLabel = "Simulate Match",
  simDisabled,
  hasMatch,
  isPlaying,
  onTogglePlay,
  onRestartReplay,
  replaySpeed,
  onReplaySpeedChange
}: MatchControlsProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-surface via-panel to-surface p-4 shadow-panel">
      <button
        type="button"
        onClick={onSimulate}
        disabled={simDisabled}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-stadium transition hover:bg-emerald-400 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
      >
        ⚽ {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!hasMatch}
        className="rounded-lg border border-emerald-500/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      <button
        type="button"
        onClick={onRestartReplay}
        disabled={!hasMatch}
        className="rounded-lg border border-emerald-500/30 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ↺ Restart
      </button>

      <label className="ml-auto flex items-center gap-2 text-sm text-emerald-100/80">
        <span className="font-medium">Speed</span>
        <select
          value={replaySpeed}
          onChange={(event) => onReplaySpeedChange(Number(event.target.value))}
          disabled={!hasMatch}
          className="rounded-md border border-emerald-500/30 bg-stadium px-2.5 py-1.5 text-sm font-medium text-emerald-100 outline-none focus:border-emerald-400 disabled:opacity-50"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
