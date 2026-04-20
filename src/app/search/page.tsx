import type { Metadata } from 'next';
import { SearchClient } from './SearchClient';

export const metadata: Metadata = {
  title: '카페 검색',
  description: '동네·이름·분위기 키워드로 카페를 찾아보세요.',
};

export default function SearchPage() {
  return <SearchClient />;
}
