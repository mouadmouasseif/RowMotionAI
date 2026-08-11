export const DATA_UNAVAILABLE = "data non dispo";

export function textOrUnavailable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DATA_UNAVAILABLE;
}

export function numberOrUnavailable(value: number | null | undefined, format: (value: number) => string = String) {
  return typeof value === "number" && Number.isFinite(value) ? format(value) : DATA_UNAVAILABLE;
}
