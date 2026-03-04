import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        cafe: {
          include: {
            photos: { where: { isMain: true }, take: 1 },
            moods: { include: { mood: true }, take: 3 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites.map((f) => f.cafe));
  } catch (error) {
    console.error('GET /api/users/me/favorites error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

const favoriteSchema = z.object({ cafeId: z.string() });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cafeId } = favoriteSchema.parse(await request.json());
    await prisma.userFavorite.upsert({
      where: { userId_cafeId: { userId: session.user.id, cafeId } },
      create: { userId: session.user.id, cafeId },
      update: {},
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users/me/favorites error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');
    if (!cafeId) {
      return NextResponse.json({ error: 'cafeId required' }, { status: 400 });
    }

    await prisma.userFavorite.deleteMany({
      where: { userId: session.user.id, cafeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/me/favorites error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
