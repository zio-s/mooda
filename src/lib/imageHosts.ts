/**
 * next/image 최적화(/_next/image)를 허용할 외부 이미지 호스트.
 *
 * 전엔 remotePatterns 를 https/http '**' 로 열어둬서 아무 URL 이나 우리 서버로 리사이즈 요청을
 * 보낼 수 있었음 → 남이 Vercel 이미지 최적화 사용량을 태울 수 있는 구멍.
 * 카페 사진 출처가 수백 개 도메인이라 전부 나열은 불가 — 비중 큰 호스트만 최적화하고
 * 나머지는 unoptimized 로 원본 URL 을 그대로 쓴다 (canOptimizeImage 로 판별).
 *
 * `**.` 접두사는 next.config remotePatterns 와 같은 의미: 모든 하위 도메인 (apex 제외).
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  '**.pstatic.net', // 네이버 (플레이스·블로그·검색 썸네일)
  'maps.googleapis.com', // Google Places 사진
  '**.googleusercontent.com',
  'i.pinimg.com',
  '**.daumcdn.net', // 카카오/다음
  '**.kakaocdn.net',
] as const;

const matchesHost = (hostname: string, pattern: string) =>
  pattern.startsWith('**.') ? hostname.endsWith(pattern.slice(2)) : hostname === pattern;

export function canOptimizeImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith('/')) return true; // 로컬 정적 파일
  try {
    const { protocol, hostname } = new URL(src);
    return protocol === 'https:' && OPTIMIZED_IMAGE_HOSTS.some((p) => matchesHost(hostname, p));
  } catch {
    return false;
  }
}
