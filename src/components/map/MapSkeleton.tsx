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
        <SkeletonIcon>🗺️</SkeletonIcon>
        <SkeletonText>지도 불러오는 중...</SkeletonText>
      </SkeletonContent>
    </SkeletonWrapper>
  );
}
