import type { ProviderStatus } from "@/types/dataProvider";

type DataSourceStatusProps = {
  apiFootball?: ProviderStatus;
  statsBomb?: ProviderStatus;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

const stateTone = (state: ProviderStatus["state"] | undefined): string => {
  switch (state) {
    case "connected":
      return "bg-emerald-400";
    case "cached":
      return "bg-sky-400";
    case "missing_key":
    case "quota_exceeded":
    case "forbidden":
      return "bg-cardYellow";
    case "error":
      return "bg-cardRed";
    default:
      return "bg-emerald-600";
  }
};

const StatusLine = ({ status }: { status?: ProviderStatus }): JSX.Element => (
  <div className="min-w-0 rounded-lg border border-emerald-500/15 bg-stadium/60 px-3 py-2">
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${stateTone(status?.state)}`} />
      <p className="truncate text-sm font-medium text-netWhite">{status?.label ?? "Data source"}</p>
    </div>
    <p className="mt-0.5 text-xs text-emerald-100/60">{status?.message ?? "Checking data source..."}</p>
  </div>
);

export function DataSourceStatus({
  apiFootball,
  statsBomb,
  onRefresh,
  isRefreshing
}: DataSourceStatusProps): JSX.Element {
  return (
    <section className="grid gap-2 rounded-lg border border-emerald-500/20 bg-gradient-to-r from-surface via-panel to-surface p-2.5 lg:grid-cols-[1fr_1fr_auto]">
      <StatusLine status={apiFootball} />
      <StatusLine status={statsBomb} />
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRefreshing ? "⟳ Refreshing" : "⟳ Refresh"}
      </button>
    </section>
  );
}
