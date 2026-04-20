import type { Metadata } from 'next';
import { OfflineClient } from './OfflineClient';

export const metadata: Metadata = {
  title: '오프라인',
  description: '네트워크 연결이 없을 때 최근 본 카페를 볼 수 있어요.',
};

export default function OfflinePage() {
  return <OfflineClient />;
}
