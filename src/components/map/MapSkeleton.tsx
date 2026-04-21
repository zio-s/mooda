import { Map as MapIcon } from 'lucide-react';
import { theme } from '@/styles/theme';
import {
  SkeletonWrapper,
  SkeletonContent,
  SkeletonIcon,
  SkeletonText,
} from './MapSkeleton.styles';

export function MapSkeleton() {
  return (
    <SkeletonWrapper>
      <SkeletonContent>
        <SkeletonIcon aria-hidden>
          <MapIcon size={36} strokeWidth={1.5} color={theme.colors.ink300} />
        </SkeletonIcon>
        <SkeletonText>지도 불러오는 중...</SkeletonText>
      </SkeletonContent>
    </SkeletonWrapper>
  );
}
