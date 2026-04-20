'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useRecentSearches, type RecentCafe } from '@/hooks/useRecentSearches';
import type { KeywordSearchResult } from '@/types';
import {
  Band,
  Body,
  BackButton,
  ClearAllButton,
  ClearButton,
  EmptyState,
  Header,
  HintCard,
  IconBox,
  InfoNote,
  Input,
  InputWrap,
  LoadingLine,
  MoodaChip,
  Row,
  RowBody,
  RowMeta,
  RowRemove,
  RowTitle,
  SectionTitle,
  Wrapper,
} from './page.styles';

const DEBOUNCE_MS = 200;
const MIN_QUERY_LEN = 2;

function highlight(text: string, keyword: string): ReactNode {
  const trimmed = keyword.trim();
  if (trimmed.length < 1) return text;
  const lower = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const nodes: ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(needle, cursor);
    if (idx === -1) {
      nodes.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) nodes.push(text.slice(cursor, idx));
    nodes.push(
      <mark key={`${idx}-${text.length}`}>{text.slice(idx, idx + trimmed.length)}</mark>,
    );
    cursor = idx + trimmed.length;
  }
  return <>{nodes}</>;
}

export function SearchClient() {
  const router = useRouter();
  const { items: recentItems, hydrated, add: addRecent, remove: removeRecent, clear: clearRecent } =
    useRecentSearches();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<KeywordSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchResults = useCallback(async (value: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cafes/keyword-search?q=${encodeURIComponent(value)}`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error('search failed');
      const data = (await res.json()) as { results?: KeywordSearchResult[] };
      setResults(data.results ?? []);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // 한글 IME 조합 중 불필요한 fetch 방지. "성수" 치는 중에도 매 자음/모음
  // 마다 쿼리 나가던 문제 완화. 조합 끝나면(compositionend) 한 번 더 실행.
  const composingRef = useRef(false);

  const scheduleFetch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = value.trim();
      if (trimmed.length < MIN_QUERY_LEN) {
        setResults([]);
        setLoading(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        fetchResults(trimmed);
      }, DEBOUNCE_MS);
    },
    [fetchResults],
  );

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (composingRef.current) return;
      scheduleFetch(value);
    },
    [scheduleFetch],
  );

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      composingRef.current = false;
      scheduleFetch(e.currentTarget.value);
    },
    [scheduleFetch],
  );

  // iOS/Android 모두 enterKeyHint="search"에서 "검색" 버튼을 노출하는데,
  // 기존에는 Enter가 no-op → 유저 피드백 공백. debounce 무시하고 즉시 fetch
  // + 키보드 dismiss.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      if (composingRef.current) return; // 한글 확정 중 Enter 무시
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = query.trim();
      if (trimmed.length >= MIN_QUERY_LEN) {
        fetchResults(trimmed);
      }
      inputRef.current?.blur();
    },
    [query, fetchResults],
  );

  const handleSelectResult = useCallback(
    async (result: KeywordSearchResult) => {
      if (result.cafeId) {
        addRecent({
          cafeId: result.cafeId,
          name: result.name,
          subtitle: result.address ?? undefined,
        });
        router.push(`/cafes/${result.cafeId}`);
        return;
      }
      // Unregistered Kakao place — upsert then navigate.
      setRegisteringId(result.kakaoPlaceId);
      try {
        const res = await fetch('/api/cafes/keyword-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kakaoPlaceId: result.kakaoPlaceId,
            name: result.name,
            address: result.address,
            lat: result.lat,
            lng: result.lng,
            phone: result.phone,
            kakaoUrl: result.kakaoUrl,
          }),
        });
        if (!res.ok) throw new Error('register failed');
        const data = (await res.json()) as { cafeId: string };
        addRecent({
          cafeId: data.cafeId,
          name: result.name,
          subtitle: result.address ?? undefined,
        });
        router.push(`/cafes/${data.cafeId}`);
      } catch {
        // Registration failed — keep user on the page; no silent nav.
        setRegisteringId(null);
      }
    },
    [addRecent, router],
  );

  const handleSelectRecent = useCallback(
    (item: RecentCafe) => {
      router.push(`/cafes/${item.cafeId}`);
    },
    [router],
  );

  const moodaResults = useMemo(() => results.filter((r) => r.cafeId), [results]);
  const kakaoResults = useMemo(() => results.filter((r) => !r.cafeId), [results]);

  const trimmed = query.trim();
  const showResults = trimmed.length >= MIN_QUERY_LEN;
  const showRecent = !showResults && hydrated && recentItems.length > 0;
  const showHint = !showResults && hydrated && recentItems.length === 0;

  return (
    <Wrapper>
      <Header>
        <BackButton onClick={() => router.back()} aria-label="뒤로가기">
          <ArrowLeft size={22} />
        </BackButton>
        <InputWrap $focused={focused}>
          <Search size={16} aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="성수동 조용한 카페"
            enterKeyHint="search"
            autoComplete="off"
            inputMode="search"
          />
          {query.length > 0 && (
            <ClearButton
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              aria-label="입력 지우기"
            >
              <X size={12} strokeWidth={3} />
            </ClearButton>
          )}
        </InputWrap>
      </Header>

      <Body>
        {showRecent && (
          <>
            <SectionTitle>
              <span>최근 본 카페</span>
              <ClearAllButton type="button" onClick={clearRecent}>
                전체 삭제
              </ClearAllButton>
            </SectionTitle>
            {recentItems.map((item) => (
              <Row key={item.cafeId} onClick={() => handleSelectRecent(item)}>
                <IconBox $variant="recent">
                  <Clock size={18} />
                </IconBox>
                <RowBody>
                  <RowTitle>{item.name}</RowTitle>
                  {item.subtitle && <RowMeta>{item.subtitle}</RowMeta>}
                </RowBody>
                <RowRemove
                  type="button"
                  aria-label={`${item.name} 최근 목록에서 삭제`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(item.cafeId);
                  }}
                >
                  <Trash2 size={16} />
                </RowRemove>
              </Row>
            ))}
            <Band />
          </>
        )}

        {showHint && (
          <HintCard>
            <h3>어떤 카페 분위기를 찾으세요?</h3>
            <p>
              동네 이름, 카페 이름, &ldquo;조용한&rdquo; 같은 분위기 키워드로 검색해보세요.
              Mooda에 등록된 카페와 Kakao 지도의 장소를 함께 보여드려요.
            </p>
          </HintCard>
        )}

        {showResults && (
          <>
            {loading && results.length === 0 ? (
              <LoadingLine>검색 중…</LoadingLine>
            ) : results.length === 0 ? (
              <EmptyState>
                &ldquo;{trimmed}&rdquo;에 대한 결과가 없어요.
                <br />
                다른 키워드로 시도해보세요.
              </EmptyState>
            ) : (
              <>
                {moodaResults.length > 0 && (
                  <>
                    <SectionTitle>
                      <span>Mooda 등록 카페</span>
                    </SectionTitle>
                    {moodaResults.map((result) => (
                      <Row
                        key={result.kakaoPlaceId}
                        onClick={() => handleSelectResult(result)}
                      >
                        <IconBox $variant="mooda">
                          <Sparkles size={18} />
                        </IconBox>
                        <RowBody>
                          <RowTitle>
                            {highlight(result.name, trimmed)}
                            <MoodaChip>MOODA</MoodaChip>
                          </RowTitle>
                          {result.address && <RowMeta>{result.address}</RowMeta>}
                        </RowBody>
                      </Row>
                    ))}
                  </>
                )}
                {kakaoResults.length > 0 && (
                  <>
                    <SectionTitle>
                      <span>Kakao Local 검색</span>
                    </SectionTitle>
                    {kakaoResults.map((result) => (
                      <Row
                        key={result.kakaoPlaceId}
                        onClick={() => handleSelectResult(result)}
                        disabled={registeringId === result.kakaoPlaceId}
                      >
                        <IconBox $variant="generic">
                          <MapPin size={18} />
                        </IconBox>
                        <RowBody>
                          <RowTitle>{highlight(result.name, trimmed)}</RowTitle>
                          {result.address && <RowMeta>{result.address}</RowMeta>}
                          {registeringId === result.kakaoPlaceId && (
                            <RowMeta>Mooda에 등록하는 중…</RowMeta>
                          )}
                        </RowBody>
                      </Row>
                    ))}
                    <InfoNote>
                      Kakao Local 검색 기반 · 등록되지 않은 카페는 선택 시 Mooda에 자동
                      등록됩니다.
                    </InfoNote>
                  </>
                )}
              </>
            )}
          </>
        )}
      </Body>
    </Wrapper>
  );
}
