import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const district = searchParams.get('district');

    const where = district ? { district } : {};

    const [cafes, total] = await prisma.$transaction([
      prisma.cafe.findMany({
        where,
        include: {
          photos: { where: { isMain: true }, take: 1 },
          moods: { include: { mood: true }, take: 3 },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { avgRating: 'desc' },
      }),
      prisma.cafe.count({ where }),
    ]);

    return NextResponse.json({ cafes, total, page, limit });
  } catch (error) {
    console.error('GET /api/cafes error:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const cafe = await prisma.cafe.create({ data: body });
    return NextResponse.json(cafe, { status: 201 });
  } catch (error) {
    console.error('POST /api/cafes error:', error);
    return NextResponse.json({ error: 'Failed to create cafe' }, { status: 500 });
  }
}
