import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchCafesByCategory } from '@/lib/kakao';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const radius = parseInt(searchParams.get('radius') ?? '50', 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat, lng required' }, { status: 400 });
    }

    // 1. 카카오 카테고리 검색 (카페, 반경 내, 거리순)
    const kakaoResult = await searchCafesByCategory(lat, lng, radius);

    if (kakaoResult.documents.length === 0) {
      return NextResponse.json({ cafe: null });
    }

    // 가장 가까운 카페 (distance 정렬이므로 첫 번째)
    const nearest = kakaoResult.documents[0];

    // 2. DB에서 기존 카페 확인
    const existing = await prisma.cafe.findUnique({
      where: { kakaoPlaceId: nearest.id },
      include: {
        photos: { where: { isMain: true }, take: 1 },
        moods: {
          include: { mood: true },
          orderBy: { voteCount: 'desc' },
          take: 5,
        },
      },
    });

    if (existing) {
      const cafe = {
        id: existing.id,
        name: existing.name,
        address: existing.address,
        lat: existing.lat,
        lng: existing.lng,
        phone: existing.phone,
        kakaoPlaceId: existing.kakaoPlaceId,
        kakaoUrl: existing.kakaoUrl,
        avgRating: existing.avgRating,
        reviewCount: existing.reviewCount,
        mainPhoto: existing.photos[0]?.url ?? null,
        photos: existing.photos,
        moods: existing.moods.map((cm) => ({
          moodId: cm.moodId,
          moodKey: cm.mood.key,
          moodLabel: cm.mood.label,
          moodCategory: cm.mood.category,
          voteCount: cm.voteCount,
        })),
        hours: [],
      };
      return NextResponse.json({ cafe, created: false });
    }

    // 3. DB에 없으면 자동 등록
    const address = nearest.road_address_name || nearest.address_name;
    const districtMatch = address.match(/(\S+구)/);
    const neighborhoodMatch = address.match(/(\S+동\d*)/);

    const newCafe = await prisma.cafe.create({
      data: {
        name: nearest.place_name,
        address,
        lat: parseFloat(nearest.y),
        lng: parseFloat(nearest.x),
        phone: nearest.phone || null,
        kakaoPlaceId: nearest.id,
        kakaoUrl: nearest.place_url || null,
        district: districtMatch?.[1] ?? null,
        neighborhood: neighborhoodMatch?.[1] ?? null,
      },
    });

    const cafe = {
      id: newCafe.id,
      name: newCafe.name,
      address: newCafe.address,
      lat: newCafe.lat,
      lng: newCafe.lng,
      phone: newCafe.phone,
      kakaoPlaceId: newCafe.kakaoPlaceId,
      kakaoUrl: newCafe.kakaoUrl,
      avgRating: 0,
      reviewCount: 0,
      mainPhoto: null,
      photos: [],
      moods: [],
      hours: [],
    };

    return NextResponse.json({ cafe, created: true });
  } catch (error) {
    console.error('GET /api/cafes/nearby error:', error);
    return NextResponse.json({ error: 'Nearby search failed' }, { status: 500 });
  }
}
