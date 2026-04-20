export type OpenStatus = 'open' | 'closing-soon' | 'closed';

export type CafeHourInput = {
  dayOfWeek: number;        // 0=Sun .. 6=Sat
  openTime: string | null;  // 'HH:MM'
  closeTime: string | null; // 'HH:MM' (may cross midnight)
  isClosed: boolean;
};

export type OpenStatusOptions = {
  /**
   * 마감까지 남은 분이 이 값 이하일 때 'closing-soon' 반환. 기본 30.
   * 제품 실험/A/B 시 호출부에서 15·45·60 등으로 조정 가능.
   */
  closingSoonMinutes?: number;
  /** 테스트 편의를 위한 시간 주입. 기본 new Date(). */
  now?: Date;
};

export const DEFAULT_CLOSING_SOON_MINUTES = 30;

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
  optsOrNow: OpenStatusOptions | Date = {},
): OpenStatus {
  // Backward-compat: 기존 호출부는 2번째 인자로 Date 를 전달. 이를 지원.
  const opts: OpenStatusOptions =
    optsOrNow instanceof Date ? { now: optsOrNow } : optsOrNow;
  const now = opts.now ?? new Date();
  const closingSoonMin = opts.closingSoonMinutes ?? DEFAULT_CLOSING_SOON_MINUTES;

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
        if (minutesRemaining <= closingSoonMin) return 'closing-soon';
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
    if (minutesRemaining <= closingSoonMin) return 'closing-soon';
    return 'open';
  }

  // Today's window crosses midnight (close <= open). The after-midnight
  // portion is handled by the previous-day branch above; here we only check
  // the pre-midnight portion.
  if (minutesNow >= open) {
    const minutesRemaining = 24 * 60 - minutesNow + close;
    if (minutesRemaining <= closingSoonMin) return 'closing-soon';
    return 'open';
  }

  return 'closed';
}
