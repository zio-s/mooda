import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchCafes } from '@/lib/kakao';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    // 1. 카카오 키워드 검색 (카페 카테고리)
    const kakaoResult = await searchCafes(query);

    // 2. 카카오 결과의 place_id들로 DB 매칭
    const kakaoPlaceIds = kakaoResult.documents.map((d) => d.id);
    const existingCafes = await prisma.cafe.findMany({
      where: { kakaoPlaceId: { in: kakaoPlaceIds } },
      select: { id: true, kakaoPlaceId: true },
    });
    const existingMap = new Map(existingCafes.map((c) => [c.kakaoPlaceId, c.id]));

    // 3. 결과 조합
    const results = kakaoResult.documents.map((place) => ({
      kakaoPlaceId: place.id,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      phone: place.phone || null,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      kakaoUrl: place.place_url,
      category: place.category_name,
      // DB에 있으면 cafeId, 없으면 null
      cafeId: existingMap.get(place.id) ?? null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('GET /api/cafes/keyword-search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// 검색 결과에서 카페 선택 → DB에 없으면 자동 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kakaoPlaceId, name, address, lat, lng, phone, kakaoUrl } = body;

    if (!kakaoPlaceId || !name || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 이미 있으면 기존 카페 반환
    const existing = await prisma.cafe.findUnique({
      where: { kakaoPlaceId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ cafeId: existing.id, created: false });
    }

    // 주소에서 구/동 추출
    const districtMatch = address?.match(/(\S+구)/);
    const neighborhoodMatch = address?.match(/(\S+동\d*)/);

    // 새 카페 등록
    const cafe = await prisma.cafe.create({
      data: {
        name,
        address: address || '',
        lat,
        lng,
        phone: phone || null,
        kakaoPlaceId,
        kakaoUrl: kakaoUrl || null,
        district: districtMatch?.[1] ?? null,
        neighborhood: neighborhoodMatch?.[1] ?? null,
      },
    });

    return NextResponse.json({ cafeId: cafe.id, created: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/cafes/keyword-search error:', error);
    return NextResponse.json({ error: 'Failed to register cafe' }, { status: 500 });
  }
}
