'use client';

import { MOODS, MOOD_CATEGORIES } from '@/constants/moods';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMoodFilter, clearMoodFilters } from '@/store/slices/mapSlice';
import { Button } from '@/components/ui/button';
import {
  FilterWrapper,
  CategoryGroup,
  CategoryLabel,
  MoodButtonsRow,
  MoodButton,
  ClearRow,
  SelectionCount,
  ChipsWrapper,
  Chip,
} from './MoodFilter.styles';

const CATEGORY_ORDER = ['atmosphere', 'scene', 'purpose', 'interior', 'menu', 'facility', 'photo'] as const;

export function MoodFilter() {
  const dispatch = useAppDispatch();
  const selectedMoods = useAppSelector((s) => s.map.filters.moods);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: MOOD_CATEGORIES[cat],
    moods: MOODS.filter((m) => m.category === cat),
  }));

  return (
    <FilterWrapper>
      {grouped.map(({ category, label, moods }) => (
        <CategoryGroup key={category}>
          <CategoryLabel>{label}</CategoryLabel>
          <MoodButtonsRow>
            {moods.map((mood) => {
              const selected = selectedMoods.includes(mood.key);
              return (
                <MoodButton
                  key={mood.key}
                  $selected={selected}
                  onClick={() => dispatch(toggleMoodFilter(mood.key))}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </MoodButton>
              );
            })}
          </MoodButtonsRow>
        </CategoryGroup>
      ))}

      {selectedMoods.length > 0 && (
        <ClearRow>
          <SelectionCount>{selectedMoods.length}개 선택됨</SelectionCount>
          <Button variant="ghost" size="sm" onClick={() => dispatch(clearMoodFilters())}>
            전체 해제
          </Button>
        </ClearRow>
      )}
    </FilterWrapper>
  );
}

export function MoodFilterChips() {
  const dispatch = useAppDispatch();
  const selectedMoods = useAppSelector((s) => s.map.filters.moods);
  const moodMap = new Map(MOODS.map((m) => [m.key as string, m]));

  if (selectedMoods.length === 0) return null;

  return (
    <ChipsWrapper>
      {selectedMoods.map((key) => {
        const mood = moodMap.get(key);
        if (!mood) return null;
        return (
          <Chip key={key} onClick={() => dispatch(toggleMoodFilter(key))}>
            {mood.emoji} {mood.label} ×
          </Chip>
        );
      })}
    </ChipsWrapper>
  );
}
