/**
 * 카카오 로컬 API로 서울 주요 지역 카페 대량 수집
 * 실행: DATABASE_URL="..." KAKAO_REST_API_KEY="..." npx tsx scripts/seed-cafes.ts
 *
 * - 20개 지역, 지역당 최대 45페이지 (= 675개) × 최대 중복 제거
 * - 예상 수집량: 500~1,000개 고유 카페
 * - Kakao 무료 쿼터: 일 300,000건 (충분)
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const isSupabase = (process.env.DATABASE_URL ?? '').includes('supabase.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY ?? process.env.KAKAO_CLIENT_ID!;

// 서울 + 경기 주요 카페 밀집 지역
const TARGET_AREAS = [
  // ─── 서울 강남/서초권 ─────────────────────────────────────
  { name: '강남역', lat: 37.4979, lng: 127.0276, radius: 1500 },
  { name: '서초', lat: 37.4836, lng: 127.0326, radius: 1200 },
  { name: '청담', lat: 37.5224, lng: 127.0479, radius: 1000 },
  { name: '가로수길', lat: 37.5195, lng: 127.0228, radius: 800 },
  { name: '압구정', lat: 37.5269, lng: 127.0283, radius: 1000 },
  { name: '도곡/개포', lat: 37.4882, lng: 127.0456, radius: 1000 },

  // ─── 서울 마포/홍대권 ─────────────────────────────────────
  { name: '홍대', lat: 37.5563, lng: 126.9238, radius: 1200 },
  { name: '연남동', lat: 37.5605, lng: 126.9233, radius: 800 },
  { name: '합정', lat: 37.5498, lng: 126.9143, radius: 1000 },
  { name: '망원', lat: 37.5558, lng: 126.9027, radius: 900 },
  { name: '망리단길', lat: 37.5560, lng: 126.9010, radius: 700 },
  { name: '상수동', lat: 37.5484, lng: 126.9226, radius: 700 },
  { name: '신촌', lat: 37.5552, lng: 126.9368, radius: 1000 },

  // ─── 서울 성동/광진권 ─────────────────────────────────────
  { name: '성수', lat: 37.5446, lng: 127.0558, radius: 1200 },
  { name: '서울숲', lat: 37.5443, lng: 127.0374, radius: 900 },
  { name: '뚝섬', lat: 37.5468, lng: 127.0502, radius: 900 },
  { name: '건대', lat: 37.5403, lng: 127.0693, radius: 1000 },
  { name: '왕십리', lat: 37.5612, lng: 127.0372, radius: 900 },

  // ─── 서울 용산/이태원권 ───────────────────────────────────
  { name: '이태원', lat: 37.5345, lng: 126.9942, radius: 1000 },
  { name: '경리단길', lat: 37.5348, lng: 126.9936, radius: 700 },
  { name: '해방촌', lat: 37.5416, lng: 126.9884, radius: 700 },
  { name: '한남동', lat: 37.5350, lng: 127.0033, radius: 900 },
  { name: '용산', lat: 37.5298, lng: 126.9647, radius: 1000 },

  // ─── 서울 종로/중구권 ─────────────────────────────────────
  { name: '을지로', lat: 37.5660, lng: 126.9947, radius: 1000 },
  { name: '익선동', lat: 37.5738, lng: 126.9938, radius: 600 },
  { name: '삼청동', lat: 37.5837, lng: 126.9817, radius: 700 },
  { name: '북촌', lat: 37.5819, lng: 126.9849, radius: 700 },
  { name: '혜화', lat: 37.5825, lng: 127.0020, radius: 900 },
  { name: '광화문', lat: 37.5760, lng: 126.9768, radius: 900 },
  { name: '인사동', lat: 37.5745, lng: 126.9857, radius: 700 },

  // ─── 서울 강북/노원권 ─────────────────────────────────────
  { name: '노원', lat: 37.6542, lng: 127.0568, radius: 1200 },
  { name: '도봉/창동', lat: 37.6477, lng: 127.0474, radius: 1000 },
  { name: '수유', lat: 37.6390, lng: 127.0253, radius: 1000 },
  { name: '미아사거리', lat: 37.6128, lng: 127.0278, radius: 900 },
  { name: '상계동', lat: 37.6582, lng: 127.0730, radius: 1000 },

  // ─── 서울 동작/관악권 ─────────────────────────────────────
  { name: '사당', lat: 37.4762, lng: 126.9817, radius: 1000 },
  { name: '신림', lat: 37.4844, lng: 126.9294, radius: 1000 },
  { name: '서울대입구', lat: 37.4813, lng: 126.9528, radius: 900 },
  { name: '흑석/노량진', lat: 37.5099, lng: 126.9399, radius: 900 },

  // ─── 서울 강서/양천권 ─────────────────────────────────────
  { name: '여의도', lat: 37.5219, lng: 126.9245, radius: 1200 },
  { name: '목동', lat: 37.5272, lng: 126.8752, radius: 1100 },
  { name: '강서/마곡', lat: 37.5601, lng: 126.8283, radius: 1200 },
  { name: '당산', lat: 37.5338, lng: 126.8978, radius: 900 },

  // ─── 서울 송파/강동권 ─────────────────────────────────────
  { name: '잠실', lat: 37.5131, lng: 127.1000, radius: 1200 },
  { name: '석촌/송리단길', lat: 37.5043, lng: 127.1043, radius: 900 },
  { name: '방이동', lat: 37.5106, lng: 127.1229, radius: 900 },
  { name: '강동', lat: 37.5302, lng: 127.1238, radius: 1100 },
  { name: '천호', lat: 37.5384, lng: 127.1237, radius: 1000 },

  // ─── 경기 ─────────────────────────────────────────────────
  { name: '모란', lat: 37.4385, lng: 127.1292, radius: 1000 },
  { name: '성남', lat: 37.4501, lng: 127.1472, radius: 1200 },
  { name: '분당 서현', lat: 37.3797, lng: 127.1243, radius: 1200 },
  { name: '분당 정자', lat: 37.3595, lng: 127.1086, radius: 1000 },
  { name: '판교', lat: 37.3951, lng: 127.1107, radius: 1200 },
  { name: '경기광주', lat: 37.4296, lng: 127.2552, radius: 1200 },
  { name: '수원 인계동', lat: 37.2643, lng: 127.0277, radius: 1200 },
  { name: '수원 영통', lat: 37.2569, lng: 127.0552, radius: 1100 },
  { name: '용인 수지', lat: 37.3232, lng: 127.0970, radius: 1200 },
  { name: '의정부', lat: 37.7382, lng: 127.0337, radius: 1200 },
  { name: '고양 일산', lat: 37.6583, lng: 126.7786, radius: 1500 },
  { name: '부천', lat: 37.5034, lng: 126.7660, radius: 1200 },
];

interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string; // lng
  y: string; // lat
}

interface KakaoResponse {
  documents: KakaoPlace[];
  meta: { total_count: number; pageable_count: number; is_end: boolean };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCafes(
  area: typeof TARGET_AREAS[0],
  page: number,
  retry = 0
): Promise<KakaoResponse> {
  // 카테고리 검색(CE7)이 키워드 검색보다 결과가 더 안정적 (특히 경기도)
  const params = new URLSearchParams({
    category_group_code: 'CE7',
    x: String(area.lng),
    y: String(area.lat),
    radius: String(area.radius),
    page: String(page),
    size: '15',
    sort: 'distance',
  });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
  );

  // 429 Rate Limit: 대기 후 재시도 (최대 3회)
  if (res.status === 429) {
    if (retry >= 3) throw new Error(`Kakao API 429: rate limit exceeded after ${retry} retries`);
    const waitMs = 2000 * (retry + 1);
    console.log(`  ⏳ 429 rate limit, ${waitMs / 1000}초 대기 후 재시도...`);
    await sleep(waitMs);
    return fetchCafes(area, page, retry + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kakao API ${res.status}: ${text}`);
  }
  return res.json() as Promise<KakaoResponse>;
}

function parseDistrict(address: string): string {
  // "서울 강남구 역삼동 ..."
  const parts = address.split(' ');
  return parts[1] ?? '';
}

async function main() {
  if (!KAKAO_REST_API_KEY) {
    console.error('❌ KAKAO_REST_API_KEY 또는 KAKAO_CLIENT_ID 환경변수가 없습니다.');
    process.exit(1);
  }

  console.log('🌱 분위기 마스터 데이터 삽입...');

  const moodData = [
    // 분위기
    { key: 'quiet',        label: '조용한',        category: 'atmosphere', emoji: '🤫', sortOrder: 1 },
    { key: 'lively',       label: '활기찬',        category: 'atmosphere', emoji: '⚡', sortOrder: 2 },
    { key: 'romantic',     label: '로맨틱',        category: 'atmosphere', emoji: '💕', sortOrder: 3 },
    { key: 'cozy',         label: '아늑한',        category: 'atmosphere', emoji: '🕯️', sortOrder: 4 },
    { key: 'modern',       label: '모던/세련',     category: 'atmosphere', emoji: '🏙️', sortOrder: 5 },
    { key: 'nature',       label: '자연친화',      category: 'atmosphere', emoji: '🌿', sortOrder: 6 },
    { key: 'luxury',       label: '럭셔리',        category: 'atmosphere', emoji: '✨', sortOrder: 7 },
    { key: 'minimal',      label: '미니멀',        category: 'atmosphere', emoji: '⬜', sortOrder: 8 },
    { key: 'nordic',       label: '북유럽감성',    category: 'atmosphere', emoji: '🌨️', sortOrder: 9 },
    { key: 'industrial',   label: '인더스트리얼',  category: 'atmosphere', emoji: '🏭', sortOrder: 10 },
    { key: 'traditional',  label: '한옥/전통',     category: 'atmosphere', emoji: '🏯', sortOrder: 11 },
    { key: 'art_gallery',  label: '아트갤러리',    category: 'atmosphere', emoji: '🖼️', sortOrder: 12 },
    // 씬/감성
    { key: 'cafe_vibe',    label: '카페감성',      category: 'scene', emoji: '☕', sortOrder: 13 },
    { key: 'vintage',      label: '빈티지/레트로', category: 'scene', emoji: '🎞️', sortOrder: 14 },
    { key: 'hiphop',       label: '힙합감성',      category: 'scene', emoji: '🎤', sortOrder: 15 },
    { key: 'indie',        label: '인디감성',      category: 'scene', emoji: '🎸', sortOrder: 16 },
    { key: 'jazz',         label: '재즈바',        category: 'scene', emoji: '🎷', sortOrder: 17 },
    { key: 'local',        label: '로컬감성',      category: 'scene', emoji: '📍', sortOrder: 18 },
    { key: 'trendy',       label: '힙한/트렌디',   category: 'scene', emoji: '🔥', sortOrder: 19 },
    { key: 'aesthetic',    label: '감성카페',      category: 'scene', emoji: '🌸', sortOrder: 20 },
    { key: 'bookish',      label: '책방느낌',      category: 'scene', emoji: '📚', sortOrder: 21 },
    { key: 'lounge',       label: '라운지바',      category: 'scene', emoji: '🍸', sortOrder: 22 },
    // 목적
    { key: 'date',         label: '데이트',        category: 'purpose', emoji: '👫', sortOrder: 23 },
    { key: 'study',        label: '공부/작업',     category: 'purpose', emoji: '💻', sortOrder: 24 },
    { key: 'gathering',    label: '모임',          category: 'purpose', emoji: '👥', sortOrder: 25 },
    { key: 'solo',         label: '혼카공',        category: 'purpose', emoji: '🧘', sortOrder: 26 },
    { key: 'laptop',       label: '노트북작업',    category: 'purpose', emoji: '🖥️', sortOrder: 27 },
    { key: 'business',     label: '비즈니스미팅',  category: 'purpose', emoji: '💼', sortOrder: 28 },
    { key: 'anniversary',  label: '기념일',        category: 'purpose', emoji: '🎂', sortOrder: 29 },
    { key: 'pet_friendly', label: '반려동물동반',  category: 'purpose', emoji: '🐶', sortOrder: 30 },
    { key: 'brunch',       label: '브런치',        category: 'purpose', emoji: '🥞', sortOrder: 31 },
    { key: 'first_meet',   label: '첫만남/소개팅', category: 'purpose', emoji: '🤝', sortOrder: 32 },
    // 인테리어
    { key: 'rooftop',      label: '루프탑',        category: 'interior', emoji: '🌇', sortOrder: 33 },
    { key: 'terrace',      label: '테라스/정원',   category: 'interior', emoji: '🌳', sortOrder: 34 },
    { key: 'large_window', label: '통창/뷰맛집',   category: 'interior', emoji: '🪟', sortOrder: 35 },
    { key: 'hanok',        label: '한옥카페',      category: 'interior', emoji: '🏠', sortOrder: 36 },
    { key: 'warehouse',    label: '창고형카페',    category: 'interior', emoji: '🏗️', sortOrder: 37 },
    { key: 'forest',       label: '숲속카페',      category: 'interior', emoji: '🌲', sortOrder: 38 },
    { key: 'underground',  label: '지하/비밀공간', category: 'interior', emoji: '🕳️', sortOrder: 39 },
    // 음료/메뉴
    { key: 'specialty',    label: '스페셜티커피',  category: 'menu', emoji: '☕', sortOrder: 40 },
    { key: 'non_coffee',   label: '논커피/티',     category: 'menu', emoji: '🍵', sortOrder: 41 },
    { key: 'dessert',      label: '디저트맛집',    category: 'menu', emoji: '🍰', sortOrder: 42 },
    { key: 'signature',    label: '시그니처음료',  category: 'menu', emoji: '🥤', sortOrder: 43 },
    { key: 'vegan',        label: '비건/건강',     category: 'menu', emoji: '🥗', sortOrder: 44 },
    // 편의시설
    { key: 'parking',      label: '주차가능',      category: 'facility', emoji: '🅿️', sortOrder: 45 },
    { key: 'open24',       label: '24시간',        category: 'facility', emoji: '🌙', sortOrder: 46 },
    { key: 'plug',         label: '콘센트많음',    category: 'facility', emoji: '🔌', sortOrder: 47 },
    { key: 'group_seat',   label: '단체석',        category: 'facility', emoji: '🪑', sortOrder: 48 },
    { key: 'drive_thru',   label: '드라이브스루',  category: 'facility', emoji: '🚗', sortOrder: 49 },
    // 촬영특성
    { key: 'photo',        label: '사진촬영',      category: 'photo', emoji: '📸', sortOrder: 50 },
    { key: 'natural_light', label: '자연광',       category: 'photo', emoji: '☀️', sortOrder: 51 },
    { key: 'photo_spot',   label: '감성배경',      category: 'photo', emoji: '🎨', sortOrder: 52 },
    { key: 'sponsored',    label: '협찬가능',      category: 'photo', emoji: '🤝', sortOrder: 53 },
  ];

  for (const mood of moodData) {
    await prisma.mood.upsert({ where: { key: mood.key }, create: mood, update: mood });
  }
  console.log(`✅ ${moodData.length}개 분위기 태그 준비 완료\n`);

  const allMoods = await prisma.mood.findMany();

  console.log('☕ 카페 데이터 수집 시작...');
  const seen = new Set<string>(); // 중복 제거
  let totalNew = 0;
  let totalUpdated = 0;

  for (const area of TARGET_AREAS) {
    console.log(`\n📍 [${area.name}] 수집 중...`);
    let areaCount = 0;

    for (let page = 1; page <= 45; page++) {
      try {
        const data = await fetchCafes(area, page);

        for (const place of data.documents) {
          if (seen.has(place.id)) continue;
          seen.add(place.id);

          const existing = await prisma.cafe.findUnique({ where: { kakaoPlaceId: place.id } });
          const district = parseDistrict(place.address_name);

          await prisma.cafe.upsert({
            where: { kakaoPlaceId: place.id },
            create: {
              kakaoPlaceId: place.id,
              name: place.place_name,
              address: place.road_address_name || place.address_name,
              lat: parseFloat(place.y),
              lng: parseFloat(place.x),
              phone: place.phone || null,
              kakaoUrl: place.place_url || null,
              district,
              neighborhood: area.name,
              avgRating: 0,
              reviewCount: 0,
            },
            update: {
              name: place.place_name,
              address: place.road_address_name || place.address_name,
              lat: parseFloat(place.y),
              lng: parseFloat(place.x),
              phone: place.phone || null,
              kakaoUrl: place.place_url || null,
              district,
            },
          });

          // 신규 카페에만 랜덤 분위기 태그 5~8개 부여
          if (!existing) {
            totalNew++;
            const shuffled = [...allMoods].sort(() => Math.random() - 0.5);
            const picked = shuffled.slice(0, Math.floor(Math.random() * 4) + 5);
            const cafeId = (await prisma.cafe.findUnique({ where: { kakaoPlaceId: place.id }, select: { id: true } }))!.id;
            await prisma.cafeMood.createMany({
              data: picked.map((m) => ({
                cafeId,
                moodId: m.id,
                voteCount: Math.floor(Math.random() * 30),
              })),
              skipDuplicates: true,
            });
          } else {
            totalUpdated++;
          }

          areaCount++;
        }

        if (data.meta.is_end || data.documents.length === 0) break;

        await sleep(300); // API 레이트 리밋 방지 (초당 3건 이하)
      } catch (err) {
        console.error(`  ⚠️  페이지 ${page} 오류:`, err instanceof Error ? err.message : err);
        await sleep(500);
        break;
      }
    }

    console.log(`  ✅ ${area.name}: ${areaCount}개 수집`);
  }

  const total = await prisma.cafe.count();
  console.log('\n========================================');
  console.log(`✅ 수집 완료!`);
  console.log(`  신규: ${totalNew}개`);
  console.log(`  업데이트: ${totalUpdated}개`);
  console.log(`  DB 전체 카페 수: ${total}개`);
  console.log('========================================');
}

main()
  .catch((e) => { console.error('❌ 오류:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
