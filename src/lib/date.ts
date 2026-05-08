import { formatInTimeZone } from "date-fns-tz";

export const DEFAULT_TZ = process.env.TZ || "Europe/Athens";

export function todayISO(tz: string = DEFAULT_TZ): string {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

export function yesterdayISO(tz: string = DEFAULT_TZ): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return formatInTimeZone(d, tz, "yyyy-MM-dd");
}

export function formatRoundDate(iso: string, tz: string = DEFAULT_TZ): string {
  // iso is yyyy-MM-dd; treat as local date in tz
  return formatInTimeZone(new Date(iso + "T12:00:00Z"), tz, "EEEE MMM d");
}
