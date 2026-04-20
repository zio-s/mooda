'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styled, { css, keyframes } from 'styled-components';
import { Check } from 'lucide-react';
import { MOODS, MOOD_CATEGORIES } from '@/constants/moods';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearMoodFilters, toggleMoodFilter } from '@/store/slices/mapSlice';
import { useCountCafesQuery } from '@/store/api/cafesApi';
import { theme } from '@/styles/theme';

const CATEGORY_ORDER = [
  'atmosphere',
  'scene',
  'purpose',
  'interior',
  'menu',
  'facility',
  'photo',
] as const;

type CategoryKey = (typeof CATEGORY_ORDER)[number];

const MATCH_COUNT_DEBOUNCE = 200;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function MoodFilterSheet({ open, onOpenChange, trigger }: Props) {
  const dispatch = useAppDispatch();
  const committedMoods = useAppSelector((s) => s.map.filters.moods);
  const openNow = useAppSelector((s) => s.map.filters.openNow);
  const bounds = useAppSelector((s) => s.map.bounds);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('atmosphere');
  // Seed draft from committed each time the sheet opens.
  const [draft, setDraft] = useState<string[]>(committedMoods);
  useEffect(() => {
    if (open) {
      setDraft(committedMoods);
      setActiveCategory('atmosphere');
    }
  }, [open, committedMoods]);

  // 시트 open 동안 body scroll lock — Radix Dialog는 focus trap만 담당.
  // 이걸 안 걸면 시트 내부 스크롤이 배경 지도로 번지고, 모바일에서 당김 제스처
  // 때 body가 같이 움직임.
  useEffect(() => {
    if (typeof document === 'undefined' || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounce draft → count query params
  const [debouncedDraft, setDebouncedDraft] = useState<string[]>(draft);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedDraft(draft), MATCH_COUNT_DEBOUNCE);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft]);

  const { data: countData, isFetching: countFetching } = useCountCafesQuery(
    {
      moods: debouncedDraft,
      openNow,
      swLat: bounds?.swLat,
      swLng: bounds?.swLng,
      neLat: bounds?.neLat,
      neLng: bounds?.neLng,
    },
    { skip: !open },
  );

  type MoodEntry = (typeof MOODS)[number];
  const moodsByCategory = useMemo(() => {
    const map: Record<CategoryKey, MoodEntry[]> = {
      atmosphere: [],
      scene: [],
      purpose: [],
      interior: [],
      menu: [],
      facility: [],
      photo: [],
    };
    for (const mood of MOODS) {
      const cat = mood.category as CategoryKey;
      if (map[cat]) map[cat].push(mood);
    }
    return map;
  }, []);

  const currentMoods = moodsByCategory[activeCategory] ?? [];

  const toggleDraft = useCallback((key: string) => {
    setDraft((curr) =>
      curr.includes(key) ? curr.filter((k) => k !== key) : [...curr, key],
    );
  }, []);

  const handleClearAll = useCallback(() => setDraft([]), []);

  const handleApply = useCallback(() => {
    // Apply diff via toggleMoodFilter (simpler than adding a setMoods reducer).
    const toAdd = draft.filter((k) => !committedMoods.includes(k));
    const toRemove = committedMoods.filter((k) => !draft.includes(k));
    for (const k of toRemove) dispatch(toggleMoodFilter(k));
    for (const k of toAdd) dispatch(toggleMoodFilter(k));
    if (draft.length === 0 && committedMoods.length === 0) {
      dispatch(clearMoodFilters());
    }
    onOpenChange(false);
  }, [draft, committedMoods, dispatch, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <OverlayStyled />
        <SheetStyled aria-describedby={undefined}>
          <Dialog.Title asChild>
            <VisuallyHidden>분위기 필터</VisuallyHidden>
          </Dialog.Title>
          <Handle aria-hidden />
          <Header>
            <div>
              <Title>분위기 필터</Title>
              <Sub>
                선택 <Accent>{draft.length}</Accent>개 · 매칭 카페{' '}
                <Accent>
                  {countFetching && countData == null
                    ? '…'
                    : (countData?.count ?? 0).toLocaleString()}
                </Accent>
                곳
              </Sub>
            </div>
            <ClearBtn type="button" onClick={handleClearAll} disabled={draft.length === 0}>
              전체 해제
            </ClearBtn>
          </Header>
          <Tabs role="tablist">
            {CATEGORY_ORDER.map((cat) => {
              const selectedInCat = draft.filter(
                (k) => moodsByCategory[cat]?.some((m) => m.key === k),
              ).length;
              return (
                <TabBtn
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  $active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                >
                  {MOOD_CATEGORIES[cat]}
                  {selectedInCat > 0 && <TabBadge>{selectedInCat}</TabBadge>}
                </TabBtn>
              );
            })}
          </Tabs>
          <Body>
            <Grid>
              {currentMoods.map((mood) => {
                const selected = draft.includes(mood.key);
                return (
                  <Cell
                    key={mood.key}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    $selected={selected}
                    onClick={() => toggleDraft(mood.key)}
                  >
                    <CellIcon aria-hidden>{mood.emoji}</CellIcon>
                    <CellLabel>{mood.label}</CellLabel>
                    {selected && (
                      <CellCheck aria-hidden>
                        <Check size={12} strokeWidth={3} />
                      </CellCheck>
                    )}
                  </Cell>
                );
              })}
            </Grid>
            <Hint>
              💡 여러 카테고리에서 선택 가능해요. 선택한 태그 중 하나라도 매칭되는
              카페가 나옵니다.
            </Hint>
          </Body>
          <Footer>
            <ApplyBtn type="button" onClick={handleApply}>
              {(countData?.count ?? 0).toLocaleString()}곳 카페 보기
            </ApplyBtn>
          </Footer>
          {/* 닫기 X 버튼은 "전체 해제"와 위치/역할이 겹치는 데다 오버레이 탭·
              ESC·물리 back으로 이미 닫을 수 있으므로 제거. */}
        </SheetStyled>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── styles ───────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

/**
 * Naver/Kakao 지도 SDK가 내부적으로 zoom/type control에 z-index 100~300
 * 대를 부여함. theme.z.bottomSheet(25)로는 sheet가 그 아래로 깔림.
 * 9999로 강제 상향해 어떤 SDK UI 위에도 올라오도록.
 */
const SHEET_Z = 9999;

const OverlayStyled = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: ${theme.colors.overlay};
  z-index: ${SHEET_Z};
  animation: ${fadeIn} 0.18s ease-out;
`;

const SheetStyled = styled(Dialog.Content)`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* 탭 전환마다 컨텐츠 수가 달라 시트 높이가 튀지 않도록 고정 비율로 잡음.
     max-height는 극단 상한. min(80dvh, 720px)로 데스크톱 과도한 확대 방지. */
  height: min(80dvh, 720px);
  max-height: 88dvh;
  background: ${theme.colors.card};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: ${theme.shadows.sheet};
  z-index: ${SHEET_Z + 1};
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  animation: ${slideUp} 0.22s cubic-bezier(0.32, 0.72, 0, 1);
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${theme.colors.ink300};
  margin: 10px auto 4px;
  flex-shrink: 0;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 20px 8px;
`;

const Title = styled.h2`
  font-size: 19px;
  font-weight: 700;
  color: ${theme.colors.ink900};
  margin-bottom: 2px;
`;

const Sub = styled.p`
  font-size: 12.5px;
  color: ${theme.colors.ink500};
  line-height: 1.4;
`;

const Accent = styled.strong`
  color: ${theme.colors.primary};
  font-weight: 700;
`;

const ClearBtn = styled.button`
  background: ${theme.colors.ink100};
  color: ${theme.colors.ink700};
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${theme.colors.ink200};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Tabs = styled.div`
  position: sticky;
  top: 0;
  background: ${theme.colors.card};
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 0 20px;
  border-bottom: 1px solid ${theme.colors.ink100};
  flex-shrink: 0;
  z-index: 2;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 14px 6px;
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active }) => ($active ? theme.colors.ink900 : theme.colors.ink500)};
  white-space: nowrap;
  position: relative;

  ${({ $active }) =>
    $active &&
    css`
      &::after {
        content: '';
        position: absolute;
        left: 4px;
        right: 4px;
        bottom: 0;
        height: 2px;
        background: ${theme.colors.primary};
        border-radius: 2px 2px 0 0;
      }
    `}
`;

const TabBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 10.5px;
  font-weight: 700;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  /* bottom 0이면 마지막 Grid row가 sticky Footer 바로 아래에 붙음. */
  padding: 16px 20px;
  -webkit-overflow-scrolling: touch;
  /* 시트 내부에서만 스크롤이 일어나도록 — body까지 번짐 방지(2차 방어선). */
  overscroll-behavior: contain;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const Cell = styled.button<{ $selected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1.5px solid
    ${({ $selected }) => ($selected ? theme.colors.primary : theme.colors.ink200)};
  background: ${({ $selected }) =>
    $selected ? theme.colors.primaryLight : theme.colors.white};
  color: ${theme.colors.ink900};
  font-weight: 500;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;

  &:active {
    transform: scale(0.98);
  }
`;

const CellIcon = styled.span`
  font-size: 20px;
  flex-shrink: 0;
`;

const CellLabel = styled.span`
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CellCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  flex-shrink: 0;
`;

const Hint = styled.p`
  margin: 16px 0 20px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${theme.colors.ink50};
  color: ${theme.colors.ink500};
  font-size: 12px;
  line-height: 1.5;
`;

const Footer = styled.div`
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid ${theme.colors.ink100};
  background: ${theme.colors.card};
  flex-shrink: 0;
`;

const ApplyBtn = styled.button`
  width: 100%;
  height: 52px;
  border-radius: 14px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  font-size: 15px;
  font-weight: 700;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

