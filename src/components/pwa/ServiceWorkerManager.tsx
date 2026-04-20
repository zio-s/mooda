'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * SW 등록 + 업데이트 토스트. Dev에서는 기존에 설치돼 있던 SW/캐시를 싹 정리
 * (이전 번들이 캐시돼서 새 코드가 안 도는 증상 방지).
 */
export function ServiceWorkerManager() {
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    if (!IS_PROD) {
      // dev: 기존 SW/캐시 전량 정리
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if (typeof window !== 'undefined' && window.caches) {
            window.caches
              .keys()
              .then((keys) => Promise.all(keys.map((k) => window.caches.delete(k))));
          }
        })
        .catch(() => {});
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    function notifyUpdate(worker: ServiceWorker) {
      if (toastShownRef.current) return;
      toastShownRef.current = true;
      toast('새 버전이 준비됐어요', {
        description: '탭을 새로고침하면 업데이트가 적용돼요.',
        duration: Infinity,
        action: {
          label: '새로고침',
          onClick: () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
      });
    }

    function watchWaiting(reg: ServiceWorkerRegistration) {
      if (reg.waiting) notifyUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            notifyUpdate(installing);
          }
        });
      });
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;
        watchWaiting(reg);
      })
      .catch(() => {
        // 등록 실패해도 조용히 넘어감 — SW는 enhancement.
      });

    const onControllerChange = () => {
      // SKIP_WAITING으로 새 SW가 take over 했을 때 리로드.
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // 1시간마다 업데이트 체크 (장시간 켜둔 탭 대응)
    const intervalId = window.setInterval(() => {
      registration?.update().catch(() => {});
    }, 60 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
