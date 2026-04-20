'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';
import { Skeleton } from '@/components/ui/skeleton';

const Wrapper = styled.div`
  height: calc(100dvh - 56px);
  display: flex;
  flex-direction: column;
  background: ${theme.colors.bg};
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const FilterChip = styled(Skeleton)`
  height: 36px;
  border-radius: 999px;
`;

const MapStage = styled.div`
  flex: 1;
  position: relative;
`;

const MapFill = styled(Skeleton)`
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  border-radius: 0;
`;

const ListRows = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: ${theme.colors.card};
  box-shadow: ${theme.shadows.sm};
`;

const Thumb = styled(Skeleton)`
  width: 72px;
  height: 72px;
  border-radius: 12px;
  flex-shrink: 0;
`;

const RowBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LineWide = styled(Skeleton)`
  height: 16px;
  border-radius: 6px;
`;

const LineNarrow = styled(Skeleton)`
  height: 12px;
  width: 60%;
  border-radius: 6px;
`;

export default function MapLoading() {
  return (
    <Wrapper aria-busy>
      <FilterBar>
        <FilterChip style={{ width: 96 }} />
        <FilterChip style={{ flex: 1 }} />
        <FilterChip style={{ width: 68 }} />
      </FilterBar>
      <MapStage>
        <MapFill />
        <ListRows>
          {Array.from({ length: 3 }).map((_, i) => (
            <Row key={i}>
              <Thumb />
              <RowBody>
                <LineWide style={{ width: '70%' }} />
                <LineNarrow />
                <LineNarrow style={{ width: '40%' }} />
              </RowBody>
            </Row>
          ))}
        </ListRows>
      </MapStage>
    </Wrapper>
  );
}
