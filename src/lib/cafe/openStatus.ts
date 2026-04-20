export type OpenStatus = 'open' | 'closing-soon' | 'closed';

export type CafeHourInput = {
  dayOfWeek: number;        // 0=Sun .. 6=Sat
  openTime: string | null;  // 'HH:MM'
  closeTime: string | null; // 'HH:MM' (may cross midnight)
  isClosed: boolean;
};

const CLOSING_SOON_WINDOW_MIN = 30;

function parseHM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 47 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function computeOpenStatus(
  hours: readonly CafeHourInput[] | null | undefined,
  now: Date = new Date(),
): OpenStatus {
  if (!hours || hours.length === 0) return 'closed';

  const day = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = hours.find((h) => h.dayOfWeek === day);
  const prevDay = (day + 6) % 7;
  const prev = hours.find((h) => h.dayOfWeek === prevDay);

  // Overnight slot from previous day, e.g. open 18:00 close 02:00.
  if (prev && !prev.isClosed && prev.openTime && prev.closeTime) {
    const open = parseHM(prev.openTime);
    const close = parseHM(prev.closeTime);
    if (open !== null && close !== null && close <= open) {
      // Crosses midnight — the late-night portion belongs to today.
      const minutesRemaining = close - minutesNow;
      if (minutesNow < close) {
        if (minutesRemaining <= CLOSING_SOON_WINDOW_MIN) return 'closing-soon';
        return 'open';
      }
    }
  }

  if (!today || today.isClosed || !today.openTime || !today.closeTime) {
    return 'closed';
  }

  const open = parseHM(today.openTime);
  const close = parseHM(today.closeTime);
  if (open === null || close === null) return 'closed';

  if (close > open) {
    // Same-day window.
    if (minutesNow < open || minutesNow >= close) return 'closed';
    const minutesRemaining = close - minutesNow;
    if (minutesRemaining <= CLOSING_SOON_WINDOW_MIN) return 'closing-soon';
    return 'open';
  }

  // Today's window crosses midnight (close <= open). The after-midnight
  // portion is handled by the previous-day branch above; here we only check
  // the pre-midnight portion.
  if (minutesNow >= open) {
    // Closes after midnight → treat 23:59 as upper bound when computing remaining.
    const minutesRemaining = 24 * 60 - minutesNow + close;
    if (minutesRemaining <= CLOSING_SOON_WINDOW_MIN) return 'closing-soon';
    return 'open';
  }

  return 'closed';
}
