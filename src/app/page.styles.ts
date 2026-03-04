'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const PageWrapper = styled.div`
  min-height: calc(100vh - 56px);
`;

// ─── Hero ─────────────────────────────────────────────────
export const HeroSection = styled.section`
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #fffbeb 0%, #fff7ed 55%, #fef3c7 100%);
  padding: 80px 16px 64px;
  text-align: center;

  @media (min-width: ${theme.breakpoints.md}) {
    padding: 120px 16px 96px;
  }
`;

export const HeroDecorTop = styled.div`
  position: absolute;
  top: -120px;
  right: -120px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.09) 0%, transparent 70%);
  pointer-events: none;
`;

export const HeroDecorBottom = styled.div`
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.07) 0%, transparent 70%);
  pointer-events: none;
`;

export const HeroInner = styled.div`
  position: relative;
  max-width: 640px;
  margin: 0 auto;
`;

export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.full};
  background: rgba(217, 119, 6, 0.1);
  border: 1px solid rgba(217, 119, 6, 0.2);
  padding: 5px 14px;
  font-size: 13px;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.primaryText};
  margin-bottom: 20px;
`;

export const HeroTitle = styled.h1`
  margin: 0 0 18px;
  font-size: clamp(34px, 8vw, 56px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1c0a00;
  line-height: 1.18;
`;

export const HeroHighlight = styled.span`
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const HeroDesc = styled.p`
  margin: 0 0 36px;
  font-size: 17px;
  color: rgba(120, 53, 15, 0.72);
  line-height: 1.8;
  max-width: 460px;
  margin-left: auto;
  margin-right: auto;
`;

export const HeroCta = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 44px;
`;

export const PrimaryButtonLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 15px;
  font-weight: ${theme.fontWeight.semibold};
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(217, 119, 6, 0.38);

  &:hover {
    background: ${theme.colors.primaryDark};
    box-shadow: 0 6px 22px rgba(217, 119, 6, 0.48);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const HeroStats = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  justify-content: center;
  flex-wrap: wrap;
`;

export const StatItem = styled.div`
  text-align: center;
  padding: 0 20px;
`;

export const StatNumber = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${theme.colors.primaryText};
  line-height: 1;
  margin-bottom: 4px;
`;

export const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(120, 53, 15, 0.6);
`;

export const StatDivider = styled.div`
  width: 1px;
  height: 32px;
  background: rgba(217, 119, 6, 0.2);
`;

// ─── Mood Section ─────────────────────────────────────────
export const MoodSection = styled.section`
  padding: 72px 16px;
  background: ${theme.colors.bg};
`;

export const SectionInner = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

export const SectionTitle = styled.h2`
  margin: 0 0 8px;
  text-align: center;
  font-size: clamp(20px, 4vw, 26px);
  font-weight: 700;
  color: ${theme.colors.text};
  letter-spacing: -0.02em;
`;

export const SectionDesc = styled.p`
  margin: 0 0 36px;
  text-align: center;
  font-size: 14px;
  color: ${theme.colors.textMuted};
`;

export const MoodCategoriesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const MoodCategoryGroup = styled.div``;

export const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
`;

export const CategoryBadge = styled.span<{ $category: 'atmosphere' | 'purpose' | 'photo' }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: ${theme.borderRadius.full};
  font-size: 12px;
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: 0.04em;

  ${({ $category }) => {
    if ($category === 'atmosphere') {
      return `background: #fef3c7; color: #92400e; border: 1px solid #fde68a;`;
    }
    if ($category === 'purpose') {
      return `background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;`;
    }
    return `background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe;`;
  }}
`;

export const MoodTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const MoodTagLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bg};
  padding: 7px 16px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.text};
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primaryLight};
    color: ${theme.colors.primaryText};
    box-shadow: 0 1px 4px rgba(217, 119, 6, 0.15);
    transform: translateY(-1px);
  }
`;

export const MoodTagEmoji = styled.span`
  font-size: 15px;
  line-height: 1;
`;

// ─── How It Works ─────────────────────────────────────────
export const HowSection = styled.section`
  background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
  padding: 72px 16px;
`;

export const HowGrid = styled.div`
  display: grid;
  gap: 16px;
  position: relative;

  @media (min-width: ${theme.breakpoints.sm}) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
`;

export const HowItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.bg};
  border: 1px solid ${theme.colors.borderLight};
  box-shadow: ${theme.shadows.sm};
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${theme.shadows.md};
  }

  @media (min-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px;
    gap: 0;
  }
`;

export const HowIconWrap = styled.div`
  width: 52px;
  height: 52px;
  border-radius: ${theme.borderRadius.xl};
  background: ${theme.colors.primaryLight};
  border: 1px solid ${theme.colors.primaryMid};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;

  @media (min-width: ${theme.breakpoints.sm}) {
    width: 60px;
    height: 60px;
    font-size: 28px;
    margin-bottom: 16px;
  }
`;

export const HowContent = styled.div`
  flex: 1;
`;

export const HowStepLabel = styled.span`
  display: block;
  font-size: 11px;
  font-weight: ${theme.fontWeight.semibold};
  letter-spacing: 0.1em;
  color: ${theme.colors.primary};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

export const HowTitle = styled.h3`
  margin: 0 0 6px;
  font-size: ${theme.fontSize.md};
  font-weight: 700;
  color: ${theme.colors.text};
  letter-spacing: -0.01em;
`;

export const HowDesc = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  line-height: 1.65;
`;

// ─── CTA ──────────────────────────────────────────────────
export const CtaSection = styled.section`
  padding: 72px 16px;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  text-align: center;
`;

export const CtaInner = styled.div`
  max-width: 560px;
  margin: 0 auto;
`;

export const CtaTitle = styled.h2`
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 800;
  color: #fff;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
`;

export const CtaDesc = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.82);
  margin: 0 0 32px;
  line-height: 1.6;
`;

export const CtaButtonLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: ${theme.borderRadius.full};
  background: #fff;
  color: ${theme.colors.primaryDark};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  &:hover {
    background: #fffbeb;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
