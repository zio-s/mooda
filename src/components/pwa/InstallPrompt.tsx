'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Download, Share, Coffee } from 'lucide-react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * ─── PWA 설치 배너 노출 / 비노출 조건 (2026-04-21 기준) ──────────────────
 *
 * 🟢 노출 — 아래 조건 전부(AND) 충족 시:
 *   1. PWA 미설치 상태 (`display-mode: standalone` 아님)
 *   2. 사용자가 닫은 적 없음 (`localStorage.pwa-dismissed` 미설정)
 *   3. 현재 경로가 ALLOWED 목록에 매칭 + HIDDEN 목록에 미매칭
 *   4. 플랫폼별 이벤트:
 *        - Android Chrome: `beforeinstallprompt` 이벤트 수신됨
 *        - iOS Safari: UA 에서 iPhone/iPad/iPod + Safari 감지됨
 *
 * 🔴 비노출 — 아래 중 하나라도(OR) 해당 시:
 *   1. 이미 PWA 로 실행 중 (`display-mode: standalone`)
 *   2. `localStorage.pwa-dismissed === '1'` (과거 × 클릭)
 *   3. 경로가 HIDDEN 에 해당 (`/map` · `/admin/*` · `/login` · `/signup`)
 *      - `/map`: BottomSheet / CafeOverlayCard 와 하단 UI 경쟁 회피
 *      - `/admin/*`: 관리자 도구 — PWA 권유 대상 아님
 *      - `/login`·`/signup`: 인증 플로우 중단 방지
 *   4. 경로가 ALLOWED 에 미매칭 (기타 내부/디버그 경로)
 *   5. Chrome `beforeinstallprompt` 미발동 (installability criteria 불충족)
 *   6. iOS 비Safari (Chrome for iOS / 인앱 브라우저 / 기타 WebView)
 *
 * 🔁 재노출 수단:
 *   - DevTools → Application → Local Storage → `pwa-dismissed` 항목 삭제
 *   - 또는 브라우저 데이터 초기화
 *   - (추가 TTL/자동만료는 현재 미적용 — 필요 시 확장)
 * ────────────────────────────────────────────────────────────────────────
 */

/**
 * 배너 노출 화이트리스트 — 이 경로들에서만 배너 노출. 각 항목은 exact-match
 * 또는 `${p}/...` 하위 경로까지 포함. (예: `/profile` 은 `/profile` 과
 * `/profile/favorites` 둘 다 매칭, `/profileSettings` 같은 유사 경로는 미매칭.)
 */
const ALLOWED_PATHS = ['/', '/profile', '/cafes', '/search'] as const;

/** 명시적 숨김 경로 — ALLOWED 보다 우선 적용. 이유는 상단 JSDoc 참조. */
const HIDDEN_PATHS = ['/map', '/admin', '/login', '/signup'] as const;

function matchesPathRoot(pathname: string, root: string): boolean {
  if (root === '/') return pathname === '/';
  return pathname === root || pathname.startsWith(`${root}/`);
}

function isAllowedPath(pathname: string): boolean {
  if (HIDDEN_PATHS.some((p) => matchesPathRoot(pathname, p))) return false;
  return ALLOWED_PATHS.some((p) => matchesPathRoot(pathname, p));
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 이미 설치됨 or 이전에 닫음
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-dismissed')) return;

    // Android Chrome: beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari 감지
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    if (isIos && isSafari) {
      setShowIosBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosBanner(false);
    localStorage.setItem('pwa-dismissed', '1');
  }, []);

  if (dismissed) return null;
  if (!isAllowedPath(pathname)) return null;

  // Android: 설치 버튼
  if (deferredPrompt) {
    return (
      <Banner>
        <BannerContent>
          <BannerIcon>
            <Coffee size={22} color={theme.colors.white} />
          </BannerIcon>
          <BannerText>
            <strong>Mooda 앱 설치</strong>
            <span>홈 화면에 추가하여 앱처럼 사용하세요</span>
          </BannerText>
        </BannerContent>
        <BannerActions>
          <InstallBtn onClick={handleInstall}>
            <Download size={14} />
            설치
          </InstallBtn>
          <CloseBtn onClick={handleDismiss} aria-label="닫기">
            <X size={16} />
          </CloseBtn>
        </BannerActions>
      </Banner>
    );
  }

  // iOS: 안내 배너
  if (showIosBanner) {
    return (
      <Banner>
        <BannerContent>
          <BannerIcon>
            <Coffee size={22} color={theme.colors.white} />
          </BannerIcon>
          <BannerText>
            <strong>Mooda 앱으로 사용하기</strong>
            <span>
              <Share size={12} style={{ verticalAlign: -2 }} /> 공유 →{' '}
              <strong>홈 화면에 추가</strong>를 눌러주세요
            </span>
          </BannerText>
        </BannerContent>
        <CloseBtn onClick={handleDismiss} aria-label="닫기">
          <X size={16} />
        </CloseBtn>
      </Banner>
    );
  }

  return null;
}

// ─── Styles ──────────────────────────────────────────────
const Banner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: ${theme.colors.white};
  border-top: 1px solid ${theme.colors.border};
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);

  /* iOS safe area */
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const BannerIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.md};
  /* primary(amber-700) → amber-600 그라데이션. 두 번째 색은 theme 외 tonal
     변화용으로 의도적 유지 (디자인 가이드). */
  background: linear-gradient(135deg, ${theme.colors.primary}, #d97706);
  flex-shrink: 0;
`;

const BannerText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: ${theme.fontSize.sm};
    font-weight: ${theme.fontWeight.semibold};
    color: ${theme.colors.text};
  }

  span {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const InstallBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${theme.borderRadius.full};
  background: transparent;
  color: ${theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;
