'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowUpRight,
  Coffee,
  Heart,
  Share2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { CafeDetailBody } from '@/components/cafe/CafeDetailBody';
import {
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from '@/store/api/cafesApi';
import { theme } from '@/styles/theme';
import { PATHS } from '@/constants/paths';
import type { Cafe } from '@/types';
import {
  OverlayWrap,
  TopNav,
  TopActions,
  IconBtn,
  HeroArea,
  HeroImage,
  HeroPlaceholder,
  PhotoCounter,
} from './CafeOverlayCard.styles';

interface Props {
  cafe: Cafe;
  onClose: () => void;
}

async function shareCafe(cafe: Cafe): Promise<void> {
  if (typeof window === 'undefined') return;
  const url = `${window.location.origin}${PATHS.CafeDetail(cafe.id)}`;
  const data = { title: cafe.name, text: `${cafe.name} · Mooda`, url };
  if (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    navigator.canShare?.(data)
  ) {
    try {
      await navigator.share(data);
      return;
    } catch {
      /* 사용자 취소 → 클립보드 폴백 */
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('링크를 복사했어요');
  } catch {
    toast.error('공유에 실패했어요');
  }
}

export function CafeOverlayCard({ cafe, onClose }: Props) {
  const { data: session } = useSession();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isFav = cafe.isFavorited ?? false;

  // QA-2: 열릴 때 이전 focus 보관 + × 버튼으로 이동, 언마운트 시 원래 요소로 복귀.
  // focus trap 없이도 ESC/×/딥링크 닫기 후 Tab 키 탐색 위치가 유지됨.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }
    closeBtnRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [cafe.id]);

  // ESC 키 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const heroUrl = cafe.mainPhoto ?? cafe.photos?.[0]?.url ?? null;
  const photoCount = cafe.photos?.length ?? 0;

  async function handleFavorite() {
    if (!session) {
      toast.error('로그인이 필요합니다', {
        action: {
          label: '로그인',
          onClick: () => (window.location.href = PATHS.Login),
        },
      });
      return;
    }
    try {
      if (isFav) {
        await removeFavorite(cafe.id).unwrap();
        toast.success('즐겨찾기 해제');
      } else {
        await addFavorite(cafe.id).unwrap();
        toast.success('즐겨찾기 추가');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    }
  }

  return (
    <OverlayWrap
      role="dialog"
      aria-label={`${cafe.name} 상세 정보`}
      aria-modal="false"
    >
      <TopNav>
        <IconBtn
          aria-label="새 탭에서 상세 페이지 열기"
          onClick={() =>
            window.open(PATHS.CafeDetail(cafe.id), '_blank', 'noopener')
          }
        >
          <ArrowUpRight size={18} />
        </IconBtn>
        <TopActions>
          <IconBtn
            aria-label={isFav ? '즐겨찾기 제거' : '즐겨찾기 추가'}
            onClick={handleFavorite}
          >
            <Heart
              size={18}
              fill={isFav ? theme.colors.err : 'none'}
              color={isFav ? theme.colors.err : 'currentColor'}
            />
          </IconBtn>
          <IconBtn aria-label="공유" onClick={() => shareCafe(cafe)}>
            <Share2 size={18} />
          </IconBtn>
          <IconBtn ref={closeBtnRef} aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </TopActions>
      </TopNav>

      <HeroArea>
        {heroUrl ? (
          <HeroImage src={heroUrl} alt="" />
        ) : (
          <HeroPlaceholder aria-hidden>
            <Coffee size={48} strokeWidth={1.5} />
          </HeroPlaceholder>
        )}
        {photoCount > 1 && <PhotoCounter>1 / {photoCount}</PhotoCounter>}
      </HeroArea>

      <CafeDetailBody cafe={cafe} variant="overlay" />
    </OverlayWrap>
  );
}
