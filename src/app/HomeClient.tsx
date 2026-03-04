'use client';

import { PATHS } from '@/constants/paths';
import { MOODS, MOOD_CATEGORIES } from '@/constants/moods';
import { ArrowRight, Map, Sparkles } from 'lucide-react';
import {
  PageWrapper,
  HeroSection,
  HeroDecorTop,
  HeroDecorBottom,
  HeroInner,
  HeroBadge,
  HeroTitle,
  HeroHighlight,
  HeroDesc,
  HeroCta,
  PrimaryButtonLink,
  HeroStats,
  StatItem,
  StatNumber,
  StatLabel,
  StatDivider,
  MoodSection,
  SectionInner,
  SectionTitle,
  SectionDesc,
  MoodCategoriesWrapper,
  MoodCategoryGroup,
  CategoryHeader,
  CategoryBadge,
  MoodTagsRow,
  MoodTagLink,
  MoodTagEmoji,
  HowSection,
  HowGrid,
  HowItem,
  HowIconWrap,
  HowContent,
  HowStepLabel,
  HowTitle,
  HowDesc,
  CtaSection,
  CtaInner,
  CtaTitle,
  CtaDesc,
  CtaButtonLink,
} from './page.styles';

const CATEGORY_ORDER = ['atmosphere', 'purpose', 'photo'] as const;

const HOW_IT_WORKS = [
  {
    step: 'STEP 01',
    icon: '🎯',
    title: '분위기 선택',
    desc: '조용한, 로맨틱, 빈티지 등 원하는 분위기나 목적을 선택하세요. 16가지 태그 중 복수 선택도 가능해요.',
  },
  {
    step: 'STEP 02',
    icon: '🗺️',
    title: '지도로 탐색',
    desc: '실시간 지도에서 주변 카페를 한눈에 확인하세요. 지도를 움직이면 해당 영역 카페가 자동으로 표시돼요.',
  },
  {
    step: 'STEP 03',
    icon: '✨',
    title: '카페 발견',
    desc: '블로그 후기, 별점, 운영시간까지. 딱 맞는 카페를 찾아 바로 길 안내를 받을 수 있어요.',
  },
] as const;

export function HomeClient() {
  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <HeroSection>
        <HeroDecorTop />
        <HeroDecorBottom />
        <HeroInner>
          <HeroBadge>
            <Sparkles size={13} />
            분위기로 찾는 카페
          </HeroBadge>
          <HeroTitle>
            오늘, 어떤 카페에
            <br />
            <HeroHighlight>가고 싶으세요?</HeroHighlight>
          </HeroTitle>
          <HeroDesc>
            카페 이름 몰라도 괜찮아요.
            <br />
            원하는 분위기만 선택하면 딱 맞는 카페를 찾아드려요.
          </HeroDesc>
          <HeroCta>
            <PrimaryButtonLink href={PATHS.Map}>
              <Map size={18} />
              카페 찾으러 가기
              <ArrowRight size={18} />
            </PrimaryButtonLink>
          </HeroCta>
          <HeroStats>
            <StatItem>
              <StatNumber>200+</StatNumber>
              <StatLabel>등록 카페</StatLabel>
            </StatItem>
            <StatDivider />
            <StatItem>
              <StatNumber>16가지</StatNumber>
              <StatLabel>분위기 태그</StatLabel>
            </StatItem>
            <StatDivider />
            <StatItem>
              <StatNumber>무료</StatNumber>
              <StatLabel>서비스</StatLabel>
            </StatItem>
          </HeroStats>
        </HeroInner>
      </HeroSection>

      {/* ── 분위기 태그 (전체 16개, 카테고리별) ── */}
      <MoodSection>
        <SectionInner>
          <SectionTitle>찾고 싶은 분위기가 있나요?</SectionTitle>
          <SectionDesc>16가지 분위기 태그로 원하는 카페를 빠르게 찾아보세요</SectionDesc>
          <MoodCategoriesWrapper>
            {CATEGORY_ORDER.map((cat) => {
              const moods = MOODS.filter((m) => m.category === cat);
              return (
                <MoodCategoryGroup key={cat}>
                  <CategoryHeader>
                    <CategoryBadge $category={cat}>{MOOD_CATEGORIES[cat]}</CategoryBadge>
                  </CategoryHeader>
                  <MoodTagsRow>
                    {moods.map((mood) => (
                      <MoodTagLink key={mood.key} href={`${PATHS.Map}?moods=${mood.key}`}>
                        <MoodTagEmoji>{mood.emoji}</MoodTagEmoji>
                        {mood.label}
                      </MoodTagLink>
                    ))}
                  </MoodTagsRow>
                </MoodCategoryGroup>
              );
            })}
          </MoodCategoriesWrapper>
        </SectionInner>
      </MoodSection>

      {/* ── 이렇게 사용해요 ── */}
      <HowSection>
        <SectionInner>
          <SectionTitle>이렇게 사용해요</SectionTitle>
          <SectionDesc>3단계로 완벽한 카페를 찾아보세요</SectionDesc>
          <HowGrid>
            {HOW_IT_WORKS.map((item, i) => (
              <HowItem key={i}>
                <HowIconWrap>{item.icon}</HowIconWrap>
                <HowContent>
                  <HowStepLabel>{item.step}</HowStepLabel>
                  <HowTitle>{item.title}</HowTitle>
                  <HowDesc>{item.desc}</HowDesc>
                </HowContent>
              </HowItem>
            ))}
          </HowGrid>
        </SectionInner>
      </HowSection>

      {/* ── CTA ── */}
      <CtaSection>
        <CtaInner>
          <CtaTitle>지금 바로 찾아보세요</CtaTitle>
          <CtaDesc>서울 강남 · 홍대 · 성수 200개+ 카페가 기다리고 있어요</CtaDesc>
          <CtaButtonLink href={PATHS.Map}>
            <Map size={18} />
            지도로 탐색하기
          </CtaButtonLink>
        </CtaInner>
      </CtaSection>
    </PageWrapper>
  );
}
