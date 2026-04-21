import styled, { css } from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';
import { CATEGORY_META } from '@/constants/moods';

/**
 * CafeDetailBody 공통 스타일 — CafeOverlayCard / (향후) CafeDetailClient /
 * BottomSheet 에서 공유. variant 로 padding 만 다르게 가져가고 내부 섹션 구조
 * 는 동일하게 유지.
 */

export type Variant = 'overlay' | 'page' | 'sheet';

const VARIANT_PADDING: Record<Variant, ReturnType<typeof css>> = {
  overlay: css`
    padding: 20px;
  `,
  page: css`
    padding: 16px 24px;
  `,
  sheet: css`
    padding: 16px 12px;
  `,
};

export const Body = styled.div<{ $variant: Variant }>`
  display: flex;
  flex-direction: column;
  gap: 18px;
  ${({ $variant }) => VARIANT_PADDING[$variant]}
`;

export const Section = styled.section``;

export const SectionTitle = styled.h3`
  margin: 0 0 10px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.ink900};
`;

// ─── Meta (name + rating + distance) ──────────────────────
export const MetaSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.ink500};
`;

export const CafeTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.ink900};
  letter-spacing: -0.01em;
`;

export const MetaInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.ink500};

  svg {
    vertical-align: middle;
  }
`;

export const MetaInlineItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

// ─── Actions (4-grid) ─────────────────────────────────────
export const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

export const ActionCell = styled.button`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.white};
  color: ${theme.colors.ink700};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;

  svg {
    color: ${theme.colors.ink700};
  }

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    svg {
      color: ${theme.colors.primary};
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

// ─── Moods ────────────────────────────────────────────────
export const MoodChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const MoodChip = styled.span<{ $category: keyof typeof CATEGORY_META }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $category }) =>
    CATEGORY_META[$category]?.bg ?? theme.colors.ink100};
  color: ${({ $category }) =>
    CATEGORY_META[$category]?.fg ?? theme.colors.ink700};
  font-size: 12px;
  font-weight: ${theme.fontWeight.medium};
`;

export const MoodCount = styled.span`
  opacity: 0.8;
  font-weight: ${theme.fontWeight.normal};
`;

// ─── Basic info ───────────────────────────────────────────
export const InfoList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: ${theme.colors.ink700};

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${theme.colors.ink500};
  }
`;

export const InfoLink = styled.a`
  color: ${theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// ─── Review preview ───────────────────────────────────────
export const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const ReviewAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const EmptyLine = styled.p`
  margin: 0;
  padding: 12px;
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.bg};
  color: ${theme.colors.ink500};
  font-size: ${theme.fontSize.xs};
  text-align: center;
`;
