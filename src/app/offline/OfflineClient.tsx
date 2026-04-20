'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Clock, RefreshCw, WifiOff } from 'lucide-react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';
import { useRecentSearches } from '@/hooks/useRecentSearches';

const Wrapper = styled.div`
  min-height: 100dvh;
  background: ${theme.colors.bg};
  padding: calc(env(safe-area-inset-top, 0px) + 24px) 20px
    calc(env(safe-area-inset-bottom, 0px) + 32px);
`;

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0 28px;
  text-align: center;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: ${theme.colors.ink100};
  color: ${theme.colors.ink700};
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${theme.colors.ink900};
  letter-spacing: -0.01em;
`;

const Desc = styled.p`
  font-size: 13.5px;
  color: ${theme.colors.ink500};
  line-height: 1.5;
  max-width: 320px;
`;

const RetryButton = styled.button`
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  height: ${theme.touch.md};
  border-radius: 12px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 14px;
  font-weight: 600;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.primaryHover};
  }
`;

const Section = styled.section`
  margin-top: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.ink500};
  padding: 16px 4px 8px;
  letter-spacing: 0.02em;
`;

const EmptyNote = styled.p`
  padding: 24px 12px;
  text-align: center;
  color: ${theme.colors.ink500};
  font-size: 13px;
  line-height: 1.5;
`;

const Row = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
  color: inherit;
  text-decoration: none;
  margin-bottom: 8px;
  transition: transform 0.12s ease, box-shadow 0.15s ease;

  &:active {
    transform: scale(0.99);
    box-shadow: ${theme.shadows.md};
  }
`;

const RowIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 12px;
  background: ${theme.colors.ink50};
  color: ${theme.colors.ink500};
`;

const RowBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowName = styled.div`
  font-size: 14.5px;
  font-weight: 600;
  color: ${theme.colors.ink900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowMeta = styled.div`
  margin-top: 2px;
  font-size: 12.5px;
  color: ${theme.colors.ink500};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function OfflineClient() {
  const { items: recent, hydrated } = useRecentSearches();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  function handleRetry() {
    if (typeof window === 'undefined') return;
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  }

  return (
    <Wrapper>
      <Hero>
        <Badge aria-hidden>
          <WifiOff size={24} />
        </Badge>
        <Title>오프라인 상태예요</Title>
        <Desc>
          {isOnline
            ? '다시 연결됐어요. 홈으로 이동해보세요.'
            : '최근에 봤던 카페는 아래에서 열람할 수 있어요. 연결이 돌아오면 전체 기능을 쓸 수 있어요.'}
        </Desc>
        <RetryButton type="button" onClick={handleRetry}>
          <RefreshCw size={14} aria-hidden />
          {isOnline ? '홈으로' : '다시 시도'}
        </RetryButton>
      </Hero>

      <Section aria-labelledby="offline-recent-title">
        <SectionTitle id="offline-recent-title">최근 본 카페</SectionTitle>
        {!hydrated ? (
          <EmptyNote>불러오는 중…</EmptyNote>
        ) : recent.length === 0 ? (
          <EmptyNote>
            저장된 기록이 없어요. 한 번 방문한 카페는 오프라인에서도 다시 열 수 있어요.
          </EmptyNote>
        ) : (
          <div role="list">
            {recent.map((item) => (
              <Row key={item.cafeId} href={`/cafes/${item.cafeId}`} role="listitem">
                <RowIcon aria-hidden>
                  <Clock size={18} />
                </RowIcon>
                <RowBody>
                  <RowName>{item.name}</RowName>
                  {item.subtitle && <RowMeta>{item.subtitle}</RowMeta>}
                </RowBody>
              </Row>
            ))}
          </div>
        )}
      </Section>
    </Wrapper>
  );
}
