'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Heart,
  Star,
  MapPin,
  Phone,
  ExternalLink,
  Instagram,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { PATHS } from '@/constants/paths';
import type { Cafe } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useToggleVoteMutation,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetCafeBlogsQuery,
  useGetCafeGoogleReviewsQuery,
} from '@/store/api/cafesApi';
import { ReviewForm } from '@/components/review/ReviewForm';
import { toast } from 'sonner';
import {
  BackLink,
  DetailWrapper,
  HeroPhoto,
  PhotoPlaceholder,
  HeaderRow,
  HeaderLeft,
  CafeTitle,
  MetaRow,
  RatingItem,
  OpenTime,
  FavoriteButton,
  MoodSection,
  MoodSectionTitle,
  MoodTagsRow,
  MoodVoteButton,
  VoteCount,
  MoodHint,
  InfoList,
  InfoItem,
  InfoLink,
  HoursSection,
  HoursTitle,
  HourRow,
  DescSection,
  DescTitle,
  DescText,
  ReviewCard,
  ReviewHeader,
  ReviewerName,
  StarRow,
  ReviewDate,
  ReviewContent,
  EmptyMessage,
  BlogPost,
  BlogTitle,
  BlogDesc,
  BlogMeta,
  GoogleReviewCard,
  GoogleReviewHeader,
  GoogleAvatar,
  GoogleAuthorInfo,
  GoogleRatingBanner,
  GalleryGrid,
  GalleryItem,
  GalleryOverlay,
  GalleryNav,
  GalleryCounter,
} from './CafeDetail.styles';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  cafe: Cafe & {
    reviews: {
      id: string;
      userId: string;
      userName: string;
      userImage?: string;
      rating: number;
      content?: string;
      createdAt: string;
    }[];
    createdAt: string;
    updatedAt: string;
  };
}

export function CafeDetailClient({ cafe }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  // ── 즐겨찾기 상태 ──────────────────────────────────────────────────────────
  const [isFav, setIsFav] = useState(cafe.isFavorited ?? false);
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // ── 분위기 투표 상태 ───────────────────────────────────────────────────────
  const [moods, setMoods] = useState(cafe.moods);
  const [votedMoods, setVotedMoods] = useState<Set<string>>(
    new Set(cafe.myVotes ?? [])
  );
  const [toggleVote] = useToggleVoteMutation();

  const { data: blogData } = useGetCafeBlogsQuery(cafe.id);
  const { data: googleData } = useGetCafeGoogleReviewsQuery(cafe.id);

  // ── 갤러리 라이트박스 ──────────────────────────────────────────────────
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const allPhotos = useMemo(() => [
    ...cafe.photos.map((p) => p.url),
    ...(googleData?.photos?.map((p) => p.url) ?? []),
  ], [cafe.photos, googleData?.photos]);

  const myExistingReview = session?.user?.id
    ? cafe.reviews.find((r) => r.userId === session.user!.id)
    : undefined;

  // ── 즐겨찾기 토글 ─────────────────────────────────────────────────────────
  async function handleFavorite() {
    if (!session) { toast.error('로그인이 필요합니다'); return; }
    // 낙관적 업데이트
    setIsFav((prev) => !prev);
    try {
      if (isFav) {
        await removeFavorite(cafe.id).unwrap();
        toast.success('즐겨찾기 해제');
      } else {
        await addFavorite(cafe.id).unwrap();
        toast.success('즐겨찾기 추가');
      }
    } catch {
      // 롤백
      setIsFav((prev) => !prev);
      toast.error('오류가 발생했습니다');
    }
  }

  // ── 분위기 투표 토글 ──────────────────────────────────────────────────────
  async function handleVote(moodId: string) {
    if (!session) { toast.error('로그인이 필요합니다'); return; }

    const isVoted = votedMoods.has(moodId);
    const delta = isVoted ? -1 : 1;

    // 낙관적 업데이트
    setVotedMoods((prev) => {
      const next = new Set(prev);
      if (isVoted) next.delete(moodId);
      else next.add(moodId);
      return next;
    });
    setMoods((prev) =>
      prev.map((m) => m.moodId === moodId ? { ...m, voteCount: m.voteCount + delta } : m)
    );

    try {
      const result = await toggleVote({ cafeId: cafe.id, moodId }).unwrap();
      // 서버 응답과 낙관적 업데이트가 다를 경우 동기화
      if (result.voted !== !isVoted) {
        setVotedMoods((prev) => {
          const next = new Set(prev);
          if (result.voted) next.add(moodId);
          else next.delete(moodId);
          return next;
        });
        setMoods((prev) =>
          prev.map((m) =>
            m.moodId === moodId ? { ...m, voteCount: m.voteCount + (result.voted ? 1 : -1) - delta } : m
          )
        );
      }
      toast.success(result.voted ? '투표했습니다' : '투표를 취소했습니다');
    } catch {
      // 롤백
      setVotedMoods((prev) => {
        const next = new Set(prev);
        if (isVoted) next.add(moodId);
        else next.delete(moodId);
        return next;
      });
      setMoods((prev) =>
        prev.map((m) => m.moodId === moodId ? { ...m, voteCount: m.voteCount - delta } : m)
      );
      toast.error('오류가 발생했습니다');
    }
  }

  const topMoods = useMemo(() => [...moods].sort((a, b) => b.voteCount - a.voteCount), [moods]);
  const todayDay = new Date().getDay();
  const todayHours = cafe.hours.find((h) => h.dayOfWeek === todayDay);

  return (
    <DetailWrapper>
      <BackLink href={PATHS.Map}>
        <ChevronLeft size={16} />
        지도로 돌아가기
      </BackLink>

      {/* 대표 사진 */}
      <HeroPhoto>
        {cafe.mainPhoto ? (
          <Image
            src={cafe.mainPhoto}
            alt={cafe.name}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : (
          <PhotoPlaceholder>☕</PhotoPlaceholder>
        )}
      </HeroPhoto>

      {/* 헤더 */}
      <HeaderRow>
        <HeaderLeft>
          <CafeTitle>{cafe.name}</CafeTitle>
          <MetaRow>
            <RatingItem>
              <Star size={16} fill="#fbbf24" color="#fbbf24" />
              {cafe.avgRating.toFixed(1)}
              <span>({cafe.reviewCount}개 리뷰)</span>
            </RatingItem>
            {todayHours && !todayHours.isClosed && (
              <OpenTime>
                <Clock size={12} />
                {todayHours.openTime} - {todayHours.closeTime}
              </OpenTime>
            )}
          </MetaRow>
        </HeaderLeft>
        <FavoriteButton $active={isFav} onClick={handleFavorite}>
          <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
          {isFav ? '저장됨' : '저장'}
        </FavoriteButton>
      </HeaderRow>

      {/* 분위기 태그 */}
      {topMoods.length > 0 && (
        <MoodSection>
          <MoodSectionTitle>분위기 태그</MoodSectionTitle>
          <MoodTagsRow>
            {topMoods.map((mood) => (
              <MoodVoteButton
                key={mood.moodId}
                $voted={votedMoods.has(mood.moodId)}
                onClick={() => handleVote(mood.moodId)}
              >
                {mood.moodLabel}
                {mood.voteCount > 0 && <VoteCount>{mood.voteCount}</VoteCount>}
              </MoodVoteButton>
            ))}
          </MoodTagsRow>
          <MoodHint>태그를 눌러 분위기에 투표해보세요</MoodHint>
        </MoodSection>
      )}

      <Separator style={{ marginBottom: 24 }} />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">정보</TabsTrigger>
          <TabsTrigger value="reviews">
            리뷰{cafe.reviewCount > 0 ? ` ${cafe.reviewCount}` : ''}
          </TabsTrigger>
          <TabsTrigger value="blogs">블로그</TabsTrigger>
          {googleData && googleData.reviews.length > 0 && (
            <TabsTrigger value="google">
              Google {googleData.reviews.length}
            </TabsTrigger>
          )}
          {allPhotos.length > 0 && (
            <TabsTrigger value="gallery">
              갤러리 {allPhotos.length}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info" style={{ marginTop: 16 }}>
          <InfoList>
            <InfoItem>
              <MapPin size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{cafe.address}</span>
            </InfoItem>
            {cafe.phone && (
              <InfoItem>
                <Phone size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                <InfoLink href={`tel:${cafe.phone}`}>{cafe.phone}</InfoLink>
              </InfoItem>
            )}
            {cafe.kakaoUrl && (
              <InfoItem>
                <ExternalLink size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                <InfoLink href={cafe.kakaoUrl} target="_blank" rel="noopener noreferrer">
                  카카오맵에서 보기
                </InfoLink>
              </InfoItem>
            )}
            {cafe.instagramUrl && (
              <InfoItem>
                <Instagram size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
                <InfoLink href={cafe.instagramUrl} target="_blank" rel="noopener noreferrer">
                  인스타그램
                </InfoLink>
              </InfoItem>
            )}
          </InfoList>

          {cafe.hours.length > 0 && (
            <HoursSection>
              <HoursTitle>운영시간</HoursTitle>
              {cafe.hours.map((hour) => (
                <HourRow key={hour.dayOfWeek} $today={hour.dayOfWeek === todayDay}>
                  <span>{DAY_NAMES[hour.dayOfWeek]}</span>
                  <span>
                    {hour.isClosed
                      ? '휴무'
                      : `${hour.openTime ?? '?'} - ${hour.closeTime ?? '?'}`}
                  </span>
                </HourRow>
              ))}
            </HoursSection>
          )}

          {cafe.description && (
            <DescSection>
              <DescTitle>소개</DescTitle>
              <DescText>{cafe.description}</DescText>
            </DescSection>
          )}
        </TabsContent>

        <TabsContent value="reviews" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ── 리뷰 작성 / 내 리뷰 ──────────────────────────────────── */}
            <ReviewForm
              cafeId={cafe.id}
              cafeName={cafe.name}
              existingReview={
                myExistingReview
                  ? { rating: myExistingReview.rating, content: myExistingReview.content }
                  : undefined
              }
              compact={!myExistingReview}
              onSuccess={() => router.refresh()}
            />

            {/* ── 전체 리뷰 목록 ────────────────────────────────────────── */}
            {cafe.reviews.length === 0 ? (
              <EmptyMessage>아직 작성된 리뷰가 없습니다.</EmptyMessage>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cafe.reviews
                  // 내 리뷰는 위에서 이미 표시했으므로 목록에서 제외
                  .filter((r) => r.userId !== session?.user?.id)
                  .map((review) => (
                    <ReviewCard key={review.id}>
                      <ReviewHeader>
                        <ReviewerName>{review.userName}</ReviewerName>
                        <StarRow>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < review.rating ? '#fbbf24' : 'none'}
                              color={i < review.rating ? '#fbbf24' : '#d1d5db'}
                            />
                          ))}
                        </StarRow>
                        <ReviewDate>
                          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                        </ReviewDate>
                      </ReviewHeader>
                      {review.content && (
                        <ReviewContent>{review.content}</ReviewContent>
                      )}
                    </ReviewCard>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="blogs" style={{ marginTop: 16 }}>
          {!blogData?.items?.length ? (
            <EmptyMessage>블로그 후기를 불러오는 중입니다...</EmptyMessage>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(blogData.items as {
                title: string;
                link: string;
                description: string;
                bloggername: string;
                postdate: string;
              }[]).map((post, i) => (
                <BlogPost
                  key={i}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BlogTitle dangerouslySetInnerHTML={{ __html: post.title }} />
                  <BlogDesc dangerouslySetInnerHTML={{ __html: post.description }} />
                  <BlogMeta>
                    <span>{post.bloggername}</span>
                    <span>·</span>
                    <span>
                      {post.postdate.slice(0, 4)}.{post.postdate.slice(4, 6)}.{post.postdate.slice(6, 8)}
                    </span>
                  </BlogMeta>
                </BlogPost>
              ))}
            </div>
          )}
        </TabsContent>

        {googleData && googleData.reviews.length > 0 && (
          <TabsContent value="google" style={{ marginTop: 16 }}>
            {googleData.googleRating && (
              <GoogleRatingBanner>
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
                Google 평점 {googleData.googleRating.toFixed(1)}
                {googleData.googleTotalRatings && (
                  <span style={{ fontWeight: 400, color: '#a16207' }}>
                    ({googleData.googleTotalRatings.toLocaleString()}개 평가)
                  </span>
                )}
              </GoogleRatingBanner>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {googleData.reviews.map((review, i) => (
                <GoogleReviewCard key={i}>
                  <GoogleReviewHeader>
                    {review.authorPhoto ? (
                      <GoogleAvatar
                        src={review.authorPhoto}
                        alt={review.authorName}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <GoogleAvatar
                        as="div"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, color: '#9ca3af', background: '#f3f4f6',
                        }}
                      >
                        {review.authorName.charAt(0)}
                      </GoogleAvatar>
                    )}
                    <GoogleAuthorInfo>
                      <ReviewerName>{review.authorName}</ReviewerName>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StarRow>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              size={11}
                              fill={j < review.rating ? '#fbbf24' : 'none'}
                              color={j < review.rating ? '#fbbf24' : '#d1d5db'}
                            />
                          ))}
                        </StarRow>
                        <ReviewDate>{review.relativeTime}</ReviewDate>
                      </div>
                    </GoogleAuthorInfo>
                  </GoogleReviewHeader>
                  {review.text && (
                    <ReviewContent>{review.text}</ReviewContent>
                  )}
                </GoogleReviewCard>
              ))}
            </div>
          </TabsContent>
        )}

        {allPhotos.length > 0 && (
          <TabsContent value="gallery" style={{ marginTop: 16 }}>
            <GalleryGrid>
              {allPhotos.map((url, i) => (
                <GalleryItem key={i} onClick={() => setLightboxIdx(i)}>
                  <Image
                    src={url}
                    alt={`${cafe.name} 사진 ${i + 1}`}
                    fill
                    unoptimized
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </GalleryItem>
              ))}
            </GalleryGrid>
          </TabsContent>
        )}
      </Tabs>

      {/* ── 갤러리 라이트박스 ─────────────────────────────────── */}
      {lightboxIdx !== null && (
        <GalleryOverlay onClick={() => setLightboxIdx(null)}>
          <GalleryNav
            style={{ left: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((prev) =>
                prev !== null ? (prev - 1 + allPhotos.length) % allPhotos.length : null
              );
            }}
          >
            <ChevronLeft size={24} />
          </GalleryNav>

          <Image
            src={allPhotos[lightboxIdx]}
            alt={`${cafe.name} 사진 ${lightboxIdx + 1}`}
            width={800}
            height={600}
            unoptimized
            style={{ objectFit: 'contain', maxHeight: '85vh', maxWidth: '90vw', borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />

          <GalleryNav
            style={{ right: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((prev) =>
                prev !== null ? (prev + 1) % allPhotos.length : null
              );
            }}
          >
            <ChevronRight size={24} />
          </GalleryNav>

          <GalleryCounter>
            {lightboxIdx + 1} / {allPhotos.length}
          </GalleryCounter>

          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <X size={20} />
          </button>
        </GalleryOverlay>
      )}
    </DetailWrapper>
  );
}
