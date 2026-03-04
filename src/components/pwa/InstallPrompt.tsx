'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
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

  // Android: 설치 버튼
  if (deferredPrompt) {
    return (
      <Banner>
        <BannerContent>
          <BannerIcon>☕</BannerIcon>
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
          <BannerIcon>☕</BannerIcon>
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.md};
  background: linear-gradient(135deg, #d97706, #f59e0b);
  font-size: 22px;
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
    background: ${theme.colors.primaryDark};
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
