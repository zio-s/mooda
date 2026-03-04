import type { Metadata } from 'next';
import { HomeClient } from './HomeClient';

export const metadata: Metadata = {
  title: 'Mooda — 분위기로 찾는 카페',
  description: '원하는 분위기와 목적에 맞는 카페를 찾아보세요. 데이트, 사진 촬영, 혼카공, 모임까지.',
};

export default function HomePage() {
  return <HomeClient />;
}
