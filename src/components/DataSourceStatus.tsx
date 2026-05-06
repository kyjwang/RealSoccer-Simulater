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
      return "bg-emerald-500";
    case "cached":
      return "bg-sky-400";
    case "missing_key":
    case "quota_exceeded":
      return "bg-amber-400";
    case "error":
      return "bg-rose-400";
    default:
      return "bg-slate-400";
  }
};

const StatusLine = ({ status }: { status?: ProviderStatus }): JSX.Element => (
  <div className="min-w-0 rounded border border-slate-700 bg-slate-900 px-3 py-2">
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${stateTone(status?.state)}`} />
      <p className="truncate text-sm font-medium text-slate-100">{status?.label ?? "Data source"}</p>
    </div>
    <p className="mt-1 text-xs text-slate-400">{status?.message ?? "Checking data source..."}</p>
  </div>
);

export function DataSourceStatus({
  apiFootball,
  statsBomb,
  onRefresh,
  isRefreshing
}: DataSourceStatusProps): JSX.Element {
  return (
    <section className="grid gap-3 rounded-md border border-slate-700 bg-slate-950/60 p-3 lg:grid-cols-[1fr_1fr_auto]">
      <StatusLine status={apiFootball} />
      <StatusLine status={statsBomb} />
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Refreshing" : "Refresh Data"}
      </button>
    </section>
  );
}
