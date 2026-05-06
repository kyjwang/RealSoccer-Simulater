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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
      <button
        type="button"
        onClick={onSimulate}
        disabled={simDisabled}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!hasMatch}
        className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPlaying ? "Pause Replay" : "Play Replay"}
      </button>

      <button
        type="button"
        onClick={onRestartReplay}
        disabled={!hasMatch}
        className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Restart Replay
      </button>

      <label className="ml-auto flex items-center gap-2 text-sm text-slate-200">
        Replay speed
        <select
          value={replaySpeed}
          onChange={(event) => onReplaySpeedChange(Number(event.target.value))}
          disabled={!hasMatch}
          className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-sm outline-none focus:border-accent disabled:opacity-60"
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
