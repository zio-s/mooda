'use client';

import { useEffect, useState } from 'react';

type LoadState = { loading: boolean; error: Error | null };

const SCRIPT_ID = 'naver-maps-sdk';

declare global {
  interface Window {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    naver?: any;
  }
}

/**
 * Naver Maps JS v3 SDK 로더. 중복 주입 방지 + 이미 로드돼 있으면 즉시 resolve.
 * 스크립트 onerror 시 error 반환. submodules는 필요한 것만 요청.
 */
export function useNaverMapsLoader(params: {
  clientId: string;
  submodules?: Array<'geocoder' | 'drawing' | 'panorama' | 'visualization' | 'marker-tools'>;
}): LoadState {
  const { clientId, submodules = [] } = params;
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!clientId) {
      setState({ loading: false, error: new Error('Naver Maps client ID missing') });
      return;
    }

    // 이미 로드됨
    if (window.naver?.maps) {
      setState({ loading: false, error: null });
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => setState({ loading: false, error: null });
    const onError = () => setState({ loading: false, error: new Error('Naver Maps SDK load failed') });

    if (existing) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      // 이미 로드된 경우 readyState 기반으로 즉시 resolve
      if (window.naver?.maps) onLoad();
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    const smQuery = submodules.length > 0 ? `&submodules=${submodules.join(',')}` : '';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}${smQuery}`;
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, [clientId, submodules.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
