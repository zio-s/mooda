/**
 * 네이버 이미지 검색 결과 관련 유틸
 *
 * 발견 (T-SCRIPT-01C 증명):
 *   네이버 이미지 검색 API 의 `link` 필드가 종종 원본이 아닌
 *   search.pstatic.net 의 150px 프록시 썸네일 URL 로 내려온다.
 *   패턴:
 *     https://search.pstatic.net/common/?type=b150&src=<URL-encoded 원본>
 *     https://search.pstatic.net/sunny/?type=b150&src=<URL-encoded 원본>
 *
 *   `src=` 파라미터만 decodeURIComponent 하면 진짜 원본 URL 복구 가능.
 *   3,183 건 검증 결과 100% 추출, 91.7% 가 접근 가능한 고해상도 원본.
 */

/**
 * 네이버 프록시 URL 이면 원본 URL 을 복구해 반환. 프록시가 아니면 null.
 *
 * 이중 인코딩 케이스도 처리 (드물지만 src= 값이 두 번 인코딩된 경우).
 */
export function extractNaverProxyOrigin(proxyUrl: string): string | null {
  try {
    const u = new URL(proxyUrl);
    if (u.hostname !== 'search.pstatic.net') return null;
    const src = u.searchParams.get('src');
    if (!src) return null;
    try {
      const decoded = decodeURIComponent(src);
      if (decoded !== src && /%[0-9A-Fa-f]{2}/.test(decoded)) {
        return decodeURIComponent(decoded);
      }
      return decoded;
    } catch {
      return src;
    }
  } catch {
    return null;
  }
}

/**
 * 수집 시 기본 차단 도메인.
 *
 * 선정 근거 (2026-04-21 실측):
 *   - cdninstagram.com : hotlink 403 (Instagram TOS)
 *   - img.siksinhot.com: hotlink 403
 *   - i.pinimg.com     : Pinterest — 카페와 무관 이미지 비율 높음
 *   - dogdrip / ruliweb / ezday / ezmember : 커뮤니티 — 품질/저작권 불명
 *
 * 수집 스크립트에서 BLOCKED_HOSTS.some((h) => url.includes(h)) 로 필터링.
 */
export const BLOCKED_HOSTS = [
  'cdninstagram.com',
  'img.siksinhot.com',
  'i.pinimg.com',
  'www.dogdrip.com',
  'i3.ruliweb.com',
  'img.ruliweb.com',
  'img.ezday.co.kr',
  'img.ezmember.co.kr',
  'imgssl.ezday.co.kr',
] as const;

export function isBlockedHost(url: string): boolean {
  return BLOCKED_HOSTS.some((h) => url.includes(h));
}
