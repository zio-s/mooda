import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { MOODS } from '../src/constants/moods-data';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// sortOrder 는 MOODS 배열 순서(1-based)로 파생. emoji 필드는 제거 — Phase 6
// 이모지 전면 제거 이후 DB 차원에서도 더 이상 쓰지 않음(Mood.emoji 컬럼 drop
// 은 T7-3 사용자 결정 대기).
const MOOD_ROWS = MOODS.map((m, i) => ({
  key: m.key,
  label: m.label,
  category: m.category,
  sortOrder: i + 1,
}));

// 강남/홍대/성수 테스트 카페 데이터
const TEST_CAFES = [
  {
    name: '어니언 성수',
    address: '서울 성동구 아차산로9길 8',
    lat: 37.5448,
    lng: 127.0557,
    district: '성수',
    avgRating: 4.5,
    reviewCount: 312,
    isVerified: true,
    moods: ['vintage', 'cafe_vibe', 'photo_spot', 'natural_light'],
  },
  {
    name: '블루보틀 성수',
    address: '서울 성동구 왕십리로2길 20-12',
    lat: 37.5443,
    lng: 127.0551,
    district: '성수',
    avgRating: 4.3,
    reviewCount: 198,
    isVerified: true,
    moods: ['modern', 'quiet', 'study', 'large_window'],
  },
  {
    name: '카페 드 파리',
    address: '서울 성동구 서울숲2길 32-14',
    lat: 37.5436,
    lng: 127.0444,
    district: '성수',
    avgRating: 4.7,
    reviewCount: 87,
    isVerified: true,
    moods: ['romantic', 'cafe_vibe', 'date', 'photo_spot'],
  },
  {
    name: '앤트러사이트 홍대',
    address: '서울 마포구 토정로 5',
    lat: 37.5507,
    lng: 126.9215,
    district: '홍대',
    avgRating: 4.4,
    reviewCount: 256,
    isVerified: true,
    moods: ['vintage', 'cozy', 'date', 'natural_light'],
  },
  {
    name: '카페 드 플뢰르',
    address: '서울 마포구 와우산로 21',
    lat: 37.5516,
    lng: 126.9232,
    district: '홍대',
    avgRating: 4.2,
    reviewCount: 143,
    isVerified: true,
    moods: ['romantic', 'cafe_vibe', 'photo_spot', 'large_window'],
  },
  {
    name: '테라로사 강남',
    address: '서울 강남구 강남대로 390',
    lat: 37.5046,
    lng: 127.0245,
    district: '강남',
    avgRating: 4.6,
    reviewCount: 421,
    isVerified: true,
    moods: ['modern', 'quiet', 'study', 'solo'],
  },
  {
    name: '스탠다드 커피',
    address: '서울 강남구 신사동 543-1',
    lat: 37.5234,
    lng: 127.0231,
    district: '강남',
    avgRating: 4.1,
    reviewCount: 89,
    isVerified: true,
    moods: ['modern', 'lively', 'gathering', 'date'],
  },
  {
    name: '루프탑 카페 성수',
    address: '서울 성동구 성수이로 78',
    lat: 37.5439,
    lng: 127.0562,
    district: '성수',
    avgRating: 4.8,
    reviewCount: 176,
    isVerified: true,
    moods: ['nature', 'lively', 'photo', 'photo_spot'],
  },
  {
    name: '커피 한잔',
    address: '서울 마포구 홍익로6길 7',
    lat: 37.5498,
    lng: 126.9241,
    district: '홍대',
    avgRating: 3.9,
    reviewCount: 64,
    isVerified: false,
    moods: ['cozy', 'quiet', 'solo', 'study'],
  },
  {
    name: '노티드 도넛 강남',
    address: '서울 강남구 강남대로102길 36',
    lat: 37.5098,
    lng: 127.0275,
    district: '강남',
    avgRating: 4.5,
    reviewCount: 534,
    isVerified: true,
    moods: ['lively', 'cafe_vibe', 'date', 'photo_spot'],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 분위기 마스터 데이터
  console.log('  → Seeding moods...');
  for (const mood of MOOD_ROWS) {
    await prisma.mood.upsert({
      where: { key: mood.key },
      update: mood,
      create: mood,
    });
  }
  console.log(`  ✅ ${MOOD_ROWS.length} moods seeded`);

  const allMoods = await prisma.mood.findMany();
  const moodMap = new Map(allMoods.map((m) => [m.key, m.id]));

  // 2. 테스트 카페 데이터
  console.log('  → Seeding test cafes...');
  for (const cafe of TEST_CAFES) {
    const { moods, ...cafeData } = cafe;
    const created = await prisma.cafe.create({
      data: {
        ...cafeData,
        moods: {
          create: moods.map((key, i) => ({
            moodId: moodMap.get(key)!,
            voteCount: Math.floor(Math.random() * 50) + 5,
          })),
        },
      },
    });
    console.log(`    ✓ ${created.name}`);
  }
  console.log(`  ✅ ${TEST_CAFES.length} cafes seeded`);

  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
