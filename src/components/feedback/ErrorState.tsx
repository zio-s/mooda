'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import styled, { css } from 'styled-components';
import { theme } from '@/styles/theme';

type Variant = 'banner' | 'block';

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  variant?: Variant;
  retryLabel?: string;
  className?: string;
};

const Banner = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${theme.colors.errBg};
  color: ${theme.colors.err};
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: ${theme.shadows.md};
`;

const Block = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  background: ${theme.colors.card};
  border-radius: 16px;
  color: ${theme.colors.ink700};
`;

const Wrapper = styled.div<{ $variant: Variant }>`
  ${({ $variant }) => ($variant === 'banner' ? Banner : Block)}
`;

const IconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: ${theme.colors.errBg};
  color: ${theme.colors.err};
`;

const Title = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.ink900};
`;

const Description = styled.p`
  font-size: 13px;
  color: ${theme.colors.ink500};
  line-height: 1.5;
  max-width: 320px;
`;

const RetryBanner = styled.button`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  background: ${theme.colors.err};
  color: ${theme.colors.white};
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #991b1b;
  }
`;

const RetryBlock = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 0 16px;
  height: ${theme.touch.md};
  border-radius: 12px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const DEFAULT_TITLES: Record<Variant, string> = {
  banner: '불러오지 못했어요',
  block: '정보를 불러올 수 없어요',
};

export function ErrorState({
  title,
  description,
  onRetry,
  variant = 'block',
  retryLabel = '다시 시도',
  className,
}: Props) {
  const resolvedTitle = title ?? DEFAULT_TITLES[variant];

  if (variant === 'banner') {
    return (
      <Wrapper $variant="banner" role="alert" className={className}>
        <AlertTriangle size={16} aria-hidden />
        <span>{resolvedTitle}</span>
        {onRetry && (
          <RetryBanner type="button" onClick={onRetry}>
            <RefreshCw size={12} aria-hidden />
            {retryLabel}
          </RetryBanner>
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper $variant="block" role="alert" className={className}>
      <IconCircle>
        <AlertTriangle size={22} aria-hidden />
      </IconCircle>
      <Title>{resolvedTitle}</Title>
      {description && <Description>{description}</Description>}
      {onRetry && (
        <RetryBlock type="button" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden />
          {retryLabel}
        </RetryBlock>
      )}
    </Wrapper>
  );
}
