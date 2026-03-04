'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, ChevronRight, Plus } from 'lucide-react';
import { PATHS } from '@/constants/paths';
import { CreateCollectionDialog } from '@/components/collection/CreateCollectionDialog';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  CreateBtn,
  CollectionList,
  CollectionCard,
  CollectionInfo,
  CollectionName,
  CollectionCount,
  EmptyState,
} from './page.styles';

interface CollectionItem {
  id: string;
  name: string;
  _count: { items: number };
}

interface Props {
  collections: CollectionItem[];
}

export function CollectionsPageClient({ collections }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>컬렉션</PageTitle>
        <CreateBtn type="button" onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          새 컬렉션
        </CreateBtn>
      </PageHeader>

      {collections.length === 0 ? (
        <EmptyState>
          <FolderOpen size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <p>아직 컬렉션이 없습니다.</p>
          <button
            onClick={() => setDialogOpen(true)}
            style={{
              marginTop: 12,
              padding: '8px 20px',
              borderRadius: 8,
              border: '1.5px solid #d97706',
              background: 'transparent',
              color: '#92400e',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            첫 컬렉션 만들기
          </button>
        </EmptyState>
      ) : (
        <CollectionList>
          {collections.map((col) => (
            <CollectionCard key={col.id} href={PATHS.CollectionDetail(col.id)}>
              <FolderOpen size={20} color="#d97706" />
              <CollectionInfo>
                <CollectionName>{col.name}</CollectionName>
                <CollectionCount>카페 {col._count.items}개</CollectionCount>
              </CollectionInfo>
              <ChevronRight size={16} color="#9ca3af" />
            </CollectionCard>
          ))}
        </CollectionList>
      )}

      <CreateCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.refresh()}
      />
    </PageContainer>
  );
}
