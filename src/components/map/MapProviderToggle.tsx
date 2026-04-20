'use client';

import { useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateMapProvider, setMapProvider } from '@/store/slices/mapSlice';
import { theme } from '@/styles/theme';

const NAVER_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim() ?? '';

/**
 * Kakao / Naver 지도 provider 토글. 선호도는 localStorage에 persist 되며 /map
 * 화면 toolbar에서 접근. Naver API key(NEXT_PUBLIC_NAVER_MAP_CLIENT_ID)가 안
 * 설정된 환경에서는 Naver 버튼이 disabled 로 노출된다.
 */
export function MapProviderToggle() {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((s) => s.map.provider);

  // 첫 마운트 시 localStorage에서 선호도 로드 (SSR/CSR mismatch 방지를 위해
  // 초기 state는 고정 'kakao' → 효과는 클라이언트에서만 발생).
  useEffect(() => {
    dispatch(hydrateMapProvider());
  }, [dispatch]);

  const naverAvailable = NAVER_CLIENT_ID.length > 0;

  return (
    <Wrap role="group" aria-label="지도 공급자 선택">
      <Btn
        type="button"
        $active={provider === 'kakao'}
        aria-pressed={provider === 'kakao'}
        onClick={() => dispatch(setMapProvider('kakao'))}
      >
        카카오맵
      </Btn>
      <Btn
        type="button"
        $active={provider === 'naver'}
        aria-pressed={provider === 'naver'}
        disabled={!naverAvailable}
        title={naverAvailable ? undefined : 'Naver 지도 API 키가 설정되지 않았어요'}
        onClick={() => {
          if (!naverAvailable) return;
          dispatch(setMapProvider('naver'));
        }}
      >
        네이버지도
      </Btn>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: inline-flex;
  padding: 3px;
  background: ${theme.colors.ink100};
  border-radius: 10px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? theme.colors.ink900 : theme.colors.ink500)};
  background: ${({ $active }) => ($active ? theme.colors.white : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? theme.shadows.sm : 'none')};
  transition: background 0.15s ease, color 0.15s ease;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${({ $active }) =>
    !$active &&
    css`
      &:hover:not(:disabled) {
        color: ${theme.colors.ink700};
      }
    `}
`;
