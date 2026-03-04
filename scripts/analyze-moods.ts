/**
 * 네이버 블로그 API로 카페 분위기 태그 자동 분석
 *
 * 동작 방식:
 *   1. 각 카페명 + 지역으로 네이버 블로그 검색 (최대 100건)
 *   2. 블로그 제목/본문에서 분위기 키워드 출현 빈도 집계
 *   3. 기존 랜덤 분위기 태그 전부 삭제
 *   4. 블로그 근거가 있는 태그만 voteCount와 함께 저장
 *
 * 실행:
 *   NAVER_CLIENT_ID="..." NAVER_CLIENT_SECRET="..." \
 *   DATABASE_URL="postgresql://..." \
 *   npx tsx scripts/analyze-moods.ts
 *
 * 옵션 플래그:
 *   --dry-run   DB 변경 없이 분석 결과만 출력
 *   --limit=50  처리할 카페 수 제한 (테스트용)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

const IS_DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : undefined;

// ─── 분위기 키워드 사전 ────────────────────────────────────────────────────
// 각 mood key에 해당하는 한국어 키워드 목록
// 가중치: title 매칭 = 3점, description 매칭 = 1점
const MOOD_KEYWORDS: Record<string, { words: string[]; titleBonus?: string[] }> = {
  // ── 분위기 ──
  quiet: {
    words: ['조용', '소음없', '집중하기', '조용히', '고요', '잔잔한', '소음 없', '조용한 카페'],
    titleBonus: ['조용한', '혼자 공부', '카공'],
  },
  lively: {
    words: ['활기', '왁자', '북적', '시끌', '활발', '생동감', '왁자지껄'],
    titleBonus: ['활기찬', '북적'],
  },
  romantic: {
    words: ['로맨틱', '연인', '커플', '분위기 좋', '고급스', '이색적', '특별한 날'],
    titleBonus: ['로맨틱', '연인', '데이트 카페'],
  },
  cozy: {
    words: ['아늑', '포근', '따뜻한 분위기', '편안', '안락', '편한', '아늑한', '힐링'],
    titleBonus: ['아늑', '포근', '힐링'],
  },
  modern: {
    words: ['모던', '깔끔한', '세련된', '현대적', '심플한', '화이트톤', '인테리어 예쁜'],
    titleBonus: ['모던', '세련'],
  },
  nature: {
    words: ['자연', '식물', '초록', '정원', '녹음', '테라스', '야외 좌석', '나무', '숲속'],
    titleBonus: ['자연', '정원', '테라스'],
  },
  luxury: {
    words: ['럭셔리', '고급', '프리미엄', '호텔 카페', '파인', '퀄리티 높', '비싼데 맛있'],
    titleBonus: ['럭셔리', '고급 카페', '프리미엄'],
  },
  minimal: {
    words: ['미니멀', '심플', '화이트', '군더더기 없', '깔끔', '절제된', '모노톤'],
    titleBonus: ['미니멀', '심플한'],
  },
  nordic: {
    words: ['북유럽', '스칸디나비아', '내추럴한', '우드톤', '원목', '따뜻한 우드', '스웨덴풍'],
    titleBonus: ['북유럽', '우드톤'],
  },
  industrial: {
    words: ['인더스트리얼', '공장', '철제', '빈티지 인테리어', '창고', '노출 콘크리트', '파이프'],
    titleBonus: ['인더스트리얼', '공장 카페', '창고형'],
  },
  traditional: {
    words: ['한옥', '전통', '고풍스', '기와', '대청마루', '한국 전통', '한국적'],
    titleBonus: ['한옥 카페', '전통 카페'],
  },
  art_gallery: {
    words: ['갤러리', '전시', '예술', '아트', '작품', '미술관 느낌', '전시회'],
    titleBonus: ['갤러리 카페', '아트 카페', '전시'],
  },
  // ── 씬/감성 ──
  cafe_vibe: {
    words: ['감성', '예쁜 카페', '이쁜 카페', '인스타 카페', '포토제닉', '꾸안꾸', '분위기 있'],
    titleBonus: ['감성 카페', '인스타', '예쁜'],
  },
  vintage: {
    words: ['빈티지', '레트로', '복고', '앤틱', '클래식한', '올드한', '빈티지 감성'],
    titleBonus: ['빈티지', '레트로'],
  },
  hiphop: {
    words: ['힙합', '랩', 'hiphop', 'hip-hop', '스트릿', '스트리트', 'urban', '어반', 'graffiti', '그래피티', '비트', 'beat'],
    titleBonus: ['힙합', '힙', '스트릿'],
  },
  indie: {
    words: ['인디', 'indie', '독립', '언더그라운드', '인디밴드', '이너뷰티', '서브컬처'],
    titleBonus: ['인디 카페', '인디 음악'],
  },
  jazz: {
    words: ['재즈', 'jazz', '재즈바', '라이브 재즈', '재즈 음악', '색소폰', '트럼펫'],
    titleBonus: ['재즈바', '재즈 카페'],
  },
  local: {
    words: ['로컬', '동네 카페', '소규모', '독립 카페', '개인 카페', '동네 맛집', '숨은 카페'],
    titleBonus: ['로컬', '동네 카페', '숨은'],
  },
  trendy: {
    words: ['힙', '트렌디', '핫플', '핫 플레이스', '인기 많은', '줄서는', '요즘 뜨는'],
    titleBonus: ['핫플', '힙한', '트렌디'],
  },
  aesthetic: {
    words: ['감성 사진', '무드', '분위기 있는', '드라마 촬영지', '영화 같은', '로맨틱한 분위기'],
    titleBonus: ['감성', '무드'],
  },
  bookish: {
    words: ['책', '서재', '도서관', '독서', '서점 카페', '책 카페', '문학'],
    titleBonus: ['책 카페', '서재', '도서관'],
  },
  lounge: {
    words: ['라운지', '바', '칵테일', '와인', '바 카페', '분위기 있는 바'],
    titleBonus: ['라운지', '바 카페'],
  },
  // ── 목적 ──
  date: {
    words: ['데이트', '남자친구', '여자친구', '기념일', '소개팅', '애인', '커플석'],
    titleBonus: ['데이트', '커플', '기념일'],
  },
  study: {
    words: ['공부', '카공', '노트북', '와이파이', '콘센트', '스터디', '집중', '작업하기'],
    titleBonus: ['카공', '공부', '스터디'],
  },
  gathering: {
    words: ['모임', '미팅', '단체', '소모임', '파티', '회의', '그룹', '단체석'],
    titleBonus: ['모임', '단체'],
  },
  solo: {
    words: ['혼자', '혼카', '혼카공', '1인석', '혼자 오기', '솔로', '1인용'],
    titleBonus: ['혼카', '혼자'],
  },
  laptop: {
    words: ['노트북 하기 좋', '노트북 카페', '작업하기 좋', '업무', '리모트워크', '재택'],
    titleBonus: ['노트북', '작업 카페'],
  },
  business: {
    words: ['비즈니스', '미팅 카페', '업무 미팅', '회의실', '클라이언트', '비즈니스 미팅'],
    titleBonus: ['비즈니스', '미팅'],
  },
  anniversary: {
    words: ['기념일', '생일', '프로포즈', '특별한 날', '이벤트', '서프라이즈'],
    titleBonus: ['기념일', '생일 카페', '프로포즈'],
  },
  pet_friendly: {
    words: ['반려동물', '강아지', '고양이', '펫', '애견 동반', '애완동물', '펫 카페'],
    titleBonus: ['강아지', '반려동물', '펫 프렌들리'],
  },
  brunch: {
    words: ['브런치', '아침식사', '베이글', '에그베네딕트', '샐러드', '식사 가능', '브런치 카페'],
    titleBonus: ['브런치', '베이글'],
  },
  first_meet: {
    words: ['소개팅', '첫만남', '처음 만나는', '어색한', '설레는', '부담없는'],
    titleBonus: ['소개팅', '첫만남'],
  },
  // ── 인테리어 ──
  rooftop: {
    words: ['루프탑', '옥상', '하늘', '야외 루프탑', '루프탑 뷰', '옥상 카페'],
    titleBonus: ['루프탑', '옥상 카페'],
  },
  terrace: {
    words: ['테라스', '야외 테라스', '정원', '야외 좌석', '마당', '야외 공간'],
    titleBonus: ['테라스', '정원 카페'],
  },
  large_window: {
    words: ['통창', '큰 창문', '전면 유리', '뷰가 좋', '전망', '창문이 큰', '뷰맛집'],
    titleBonus: ['통창', '뷰 맛집'],
  },
  hanok: {
    words: ['한옥', '기와', '한옥 카페', '전통 건물', '대청마루'],
    titleBonus: ['한옥 카페'],
  },
  warehouse: {
    words: ['창고형', '공장형', '대형 공간', '넓은 카페', '인더스트리얼 인테리어'],
    titleBonus: ['창고형', '공장 카페'],
  },
  forest: {
    words: ['숲속', '나무 많은', '자연 속', '산속 카페', '森', '숲 카페', '나무 카페'],
    titleBonus: ['숲속 카페', '자연 속'],
  },
  underground: {
    words: ['지하 카페', '비밀 공간', '숨겨진', '아지트', '지하실 느낌', '비밀 카페'],
    titleBonus: ['지하 카페', '숨은 카페', '아지트'],
  },
  // ── 음료/메뉴 ──
  specialty: {
    words: ['스페셜티', 'specialty', '싱글오리진', '핸드드립', '에스프레소 바', '커피 맛집', '원두'],
    titleBonus: ['스페셜티', '핸드드립', '커피 맛집'],
  },
  non_coffee: {
    words: ['논커피', '차', '허브티', '과일 에이드', '주스', '디카페인', '커피 안 좋아'],
    titleBonus: ['논커피', '차 카페'],
  },
  dessert: {
    words: ['케이크', '디저트', '마카롱', '크로플', '브리오슈', '타르트', '디저트 맛집'],
    titleBonus: ['디저트', '케이크 맛집'],
  },
  signature: {
    words: ['시그니처', '특이한 음료', '독특한', '메뉴가 특이', '시즌 메뉴', '독창적'],
    titleBonus: ['시그니처', '특이한 메뉴'],
  },
  vegan: {
    words: ['비건', '건강식', '채식', '오가닉', '유기농', '글루텐프리', '건강한'],
    titleBonus: ['비건 카페', '건강'],
  },
  // ── 편의시설 ──
  parking: {
    words: ['주차', '주차 가능', '주차장', '주차 공간', '주차 편리'],
    titleBonus: ['주차'],
  },
  open24: {
    words: ['24시간', '새벽에도', '밤새', '심야 카페', '24시 영업'],
    titleBonus: ['24시간', '심야'],
  },
  plug: {
    words: ['콘센트', '충전', '플러그', '전기', '배터리 충전', '노트북 충전'],
    titleBonus: ['콘센트', '충전 가능'],
  },
  group_seat: {
    words: ['단체석', '대형 테이블', '넓은 좌석', '단체로', '많이 앉을 수', '큰 테이블'],
    titleBonus: ['단체석', '단체 카페'],
  },
  drive_thru: {
    words: ['드라이브스루', '드라이브 스루', 'drive thru', '차에서', '주문하고 이동'],
    titleBonus: ['드라이브스루'],
  },
  // ── 촬영특성 ──
  photo: {
    words: ['사진', '포토', '촬영', '인증샷', '포토존', '사진 맛집', '찍기 좋은'],
    titleBonus: ['사진 맛집', '포토존', '인증샷'],
  },
  natural_light: {
    words: ['자연광', '햇살', '채광', '밝은 카페', '빛이 잘', '햇빛', '일조량', '창가'],
    titleBonus: ['자연광', '채광 좋'],
  },
  photo_spot: {
    words: ['배경으로', '포토존', '감성 사진', '브이로그', '유튜브 촬영', '배경이 예쁜'],
    titleBonus: ['포토존', '감성 사진'],
  },
  sponsored: {
    words: ['협찬', '제공받았', '지원받아', '무료로 제공', '협찬을 받'],
    titleBonus: ['협찬'],
  },
};

// ─── 유틸 함수 ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── 네이버 블로그 검색 ────────────────────────────────────────────────────

interface NaverBlogItem {
  title: string;
  description: string;
  bloggername: string;
  postdate: string;
  link: string;
}

async function searchNaverBlogs(cafeName: string, neighborhood: string): Promise<NaverBlogItem[]> {
  // 검색어: "지역 카페이름 카페" — 너무 흔한 이름은 지역명으로 좁혀줌
  const query = encodeURIComponent(`${neighborhood} ${cafeName}`);
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=100&sort=sim`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Naver API ${res.status}: ${msg}`);
  }

  const json = await res.json() as { items?: NaverBlogItem[] };
  return json.items ?? [];
}

// ─── 키워드 점수 계산 ──────────────────────────────────────────────────────

function scoreMoods(items: NaverBlogItem[]): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const moodKey of Object.keys(MOOD_KEYWORDS)) {
    scores[moodKey] = 0;
  }

  for (const item of items) {
    const title = stripHtml(item.title).toLowerCase();
    const desc = stripHtml(item.description).toLowerCase();
    const combined = `${desc} ${desc}`; // desc를 2번 넣어 가중치 유지하면서 반복검색

    for (const [moodKey, { words, titleBonus }] of Object.entries(MOOD_KEYWORDS)) {
      // 본문 키워드: 출현 시 +1점
      for (const word of words) {
        if (combined.includes(word)) {
          scores[moodKey] += 1;
        }
      }

      // 제목 키워드: 출현 시 +3점 (제목 언급은 훨씬 의미 있음)
      if (titleBonus) {
        for (const word of titleBonus) {
          if (title.includes(word)) {
            scores[moodKey] += 3;
          }
        }
      }
    }
  }

  return scores;
}

// ─── 임계값 계산 ───────────────────────────────────────────────────────────
// 블로그 건수에 따라 동적 임계값: 블로그가 적으면 기준 낮춤
function getThreshold(blogCount: number): number {
  if (blogCount >= 50) return 5;
  if (blogCount >= 20) return 3;
  if (blogCount >= 5) return 2;
  return 1;
}

// ─── 메인 ─────────────────────────────────────────────────────────────────

async function main() {
  if (!NAVER_CLIENT_ID || NAVER_CLIENT_ID === 'your_naver_client_id') {
    console.error('❌ NAVER_CLIENT_ID 환경변수를 설정해주세요.');
    console.error('   https://developers.naver.com/apps 에서 발급 후:');
    console.error('   NAVER_CLIENT_ID="..." NAVER_CLIENT_SECRET="..." npx tsx scripts/analyze-moods.ts');
    process.exit(1);
  }

  console.log(IS_DRY_RUN ? '🧪 DRY RUN 모드 (DB 변경 없음)\n' : '🚀 네이버 블로그 분위기 분석 시작\n');

  // 모든 카페 로드
  const cafes = await prisma.cafe.findMany({
    select: { id: true, name: true, neighborhood: true, district: true },
    orderBy: { name: 'asc' },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(`📋 총 ${cafes.length}개 카페 분석 예정`);
  console.log(`⏱  예상 소요 시간: 약 ${Math.ceil(cafes.length * 0.35 / 60)}분\n`);

  // 분위기 마스터 데이터 로드
  const allMoods = await prisma.mood.findMany();
  const moodByKey = Object.fromEntries(allMoods.map((m) => [m.key, m]));

  if (!IS_DRY_RUN) {
    // 기존 랜덤 분위기 데이터 전부 삭제
    const deleted = await prisma.cafeMood.deleteMany({});
    console.log(`🗑  기존 분위기 태그 ${deleted.count}개 삭제 완료\n`);
  }

  let processed = 0;
  let tagged = 0;
  let noData = 0;
  const moodFrequency: Record<string, number> = {};

  for (const cafe of cafes) {
    processed++;
    const neighborhood = cafe.neighborhood ?? cafe.district ?? '';

    try {
      const items = await searchNaverBlogs(cafe.name, neighborhood);
      const scores = scoreMoods(items);
      const threshold = getThreshold(items.length);

      // 임계값 이상인 무드만 선택 + 점수 높은 순으로 정렬
      const qualified = Object.entries(scores)
        .filter(([, score]) => score >= threshold)
        .sort(([, a], [, b]) => b - a);

      if (qualified.length === 0) {
        noData++;
        console.log(`  [${processed}/${cafes.length}] ${cafe.name} — 블로그 ${items.length}건, 태그 없음`);
      } else {
        tagged++;
        const tagNames = qualified.map(([k]) => moodByKey[k]?.label ?? k).join(', ');
        console.log(`  [${processed}/${cafes.length}] ${cafe.name} — 블로그 ${items.length}건 → ${tagNames}`);

        if (!IS_DRY_RUN) {
          await prisma.cafeMood.createMany({
            data: qualified.map(([moodKey, score]) => ({
              cafeId: cafe.id,
              moodId: moodByKey[moodKey].id,
              // voteCount: 블로그 언급 빈도 기반 (최대 99)
              voteCount: Math.min(score * 2, 99),
            })),
            skipDuplicates: true,
          });
        }

        // 통계용
        for (const [moodKey] of qualified) {
          moodFrequency[moodKey] = (moodFrequency[moodKey] ?? 0) + 1;
        }
      }
    } catch (err) {
      console.error(`  ⚠️  [${processed}/${cafes.length}] ${cafe.name} 오류: ${err instanceof Error ? err.message : err}`);
    }

    // Naver API 레이트 리밋 (초당 10건 이하 권장 → 150ms 간격)
    await sleep(150);

    // 100건마다 중간 통계 출력
    if (processed % 100 === 0) {
      console.log(`\n  ── 중간 통계 (${processed}/${cafes.length}) ──`);
      console.log(`  태그 부여됨: ${tagged}개 / 데이터 없음: ${noData}개\n`);
    }
  }

  // ─── 최종 통계 ───────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('✅ 분석 완료!');
  console.log(`  처리: ${processed}개 카페`);
  console.log(`  태그 부여: ${tagged}개`);
  console.log(`  데이터 없음: ${noData}개`);

  if (Object.keys(moodFrequency).length > 0) {
    console.log('\n📊 분위기 태그 분포:');
    const sorted = Object.entries(moodFrequency).sort(([, a], [, b]) => b - a);
    for (const [key, count] of sorted) {
      const label = moodByKey[key]?.label ?? key;
      const bar = '█'.repeat(Math.round(count / cafes.length * 20));
      console.log(`  ${label.padEnd(10)} ${bar} ${count}개 (${Math.round(count / cafes.length * 100)}%)`);
    }
  }
  console.log('========================================');
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
