// Minimal geohash encoder (base-32, no deps).
// At precision 6 a cell is ~1.2km × 0.6km, which is the right bucket size
// for the nearby query — small drags within the same cell reuse the RTK
// Query cache instead of firing a fresh request every frame.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lng: number, precision = 6): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  if (precision < 1 || precision > 12) {
    throw new RangeError('precision must be within 1..12');
  }
  let latLo = -90;
  let latHi = 90;
  let lngLo = -180;
  let lngHi = 180;
  let even = true;
  let bit = 0;
  let ch = 0;
  const out: string[] = [];

  while (out.length < precision) {
    if (even) {
      const mid = (lngLo + lngHi) / 2;
      if (lng >= mid) {
        ch = (ch << 1) | 1;
        lngLo = mid;
      } else {
        ch = ch << 1;
        lngHi = mid;
      }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat >= mid) {
        ch = (ch << 1) | 1;
        latLo = mid;
      } else {
        ch = ch << 1;
        latHi = mid;
      }
    }
    even = !even;
    bit += 1;
    if (bit === 5) {
      out.push(BASE32[ch]);
      bit = 0;
      ch = 0;
    }
  }
  return out.join('');
}

/** Haversine distance in metres between two coordinates. */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}
