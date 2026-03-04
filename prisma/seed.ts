import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MOODS = [
  { key: 'quiet', label: '조용한', category: 'atmosphere', emoji: '🤫', sortOrder: 0 },
  { key: 'lively', label: '활기찬', category: 'atmosphere', emoji: '⚡', sortOrder: 1 },
  { key: 'romantic', label: '로맨틱', category: 'atmosphere', emoji: '💕', sortOrder: 2 },
  { key: 'vintage', label: '빈티지', category: 'atmosphere', emoji: '🎞️', sortOrder: 3 },
  { key: 'modern', label: '모던', category: 'atmosphere', emoji: '🏙️', sortOrder: 4 },
  { key: 'cafe_vibe', label: '카페감성', category: 'atmosphere', emoji: '☕', sortOrder: 5 },
  { key: 'nature', label: '자연친화', category: 'atmosphere', emoji: '🌿', sortOrder: 6 },
  { key: 'cozy', label: '아늑한', category: 'atmosphere', emoji: '🕯️', sortOrder: 7 },
  { key: 'date', label: '데이트', category: 'purpose', emoji: '👫', sortOrder: 8 },
  { key: 'study', label: '공부/작업', category: 'purpose', emoji: '💻', sortOrder: 9 },
  { key: 'photo', label: '사진촬영', category: 'purpose', emoji: '📸', sortOrder: 10 },
  { key: 'gathering', label: '모임', category: 'purpose', emoji: '👥', sortOrder: 11 },
  { key: 'solo', label: '혼카공', category: 'purpose', emoji: '🧘', sortOrder: 12 },
  { key: 'natural_light', label: '자연광', category: 'photo', emoji: '☀️', sortOrder: 13 },
  { key: 'large_window', label: '통창', category: 'photo', emoji: '🪟', sortOrder: 14 },
  { key: 'sponsored', label: '협찬가능', category: 'photo', emoji: '🤝', sortOrder: 15 },
  { key: 'photo_spot', label: '감성배경', category: 'photo', emoji: '🎨', sortOrder: 16 },
];

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
  for (const mood of MOODS) {
    await prisma.mood.upsert({
      where: { key: mood.key },
      update: mood,
      create: mood,
    });
  }
  console.log(`  ✅ ${MOODS.length} moods seeded`);

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
