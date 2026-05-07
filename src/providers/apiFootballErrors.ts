import type { ProviderConnectionState } from "@/types/dataProvider";

export class ApiFootballHttpError extends Error {
  readonly status: number;
  readonly state: ProviderConnectionState;

  constructor(message: string, status: number, state: ProviderConnectionState = "error") {
    super(message);
    this.name = "ApiFootballHttpError";
    this.status = status;
    this.state = state;
  }
}

const flattenErrorText = (value: unknown): string => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(flattenErrorText).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenErrorText)
      .filter(Boolean)
      .join(" ");
  }
  return "";
};

export const classifyApiFootballError = (status: number, details?: unknown): { state: ProviderConnectionState; message: string } => {
  const detailText = flattenErrorText(details).toLowerCase().trim();
  const hasDetails = detailText.length > 0;

  if (status === 429 || detailText.includes("quota") || detailText.includes("limit")) {
    return {
      state: "quota_exceeded",
      message: "API-Football quota limit reached."
    };
  }

  if (status === 401 || detailText.includes("invalid key") || detailText.includes("api key")) {
    return {
      state: "missing_key",
      message: "API-Football key is invalid or not authorized."
    };
  }

  if (status === 403) {
    return {
      state: "forbidden",
      message: hasDetails
        ? `API-Football access forbidden (${detailText}).`
        : "API-Football access forbidden for this endpoint, league, or season."
    };
  }

  return {
    state: "error",
    message: hasDetails ? `API-Football request failed (${detailText}).` : `API-Football request failed with status ${status}.`
  };
};
