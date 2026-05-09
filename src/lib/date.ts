export const DEFAULT_TZ = "Europe/Athens";

function isoInTz(date: Date, tz: string): string {
  // en-CA emits yyyy-MM-dd ordering natively
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayISO(tz: string = DEFAULT_TZ): string {
  return isoInTz(new Date(), tz);
}

export function yesterdayISO(tz: string = DEFAULT_TZ): string {
  return isoInTz(new Date(Date.now() - 24 * 60 * 60 * 1000), tz);
}

export function formatRoundDate(iso: string, tz: string = DEFAULT_TZ): string {
  // iso is yyyy-MM-dd; anchor at noon UTC so the date renders identically in every reasonable tz
  const d = new Date(iso + "T12:00:00Z");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("month")} ${get("day")}`;
}
