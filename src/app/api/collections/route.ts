import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const createCollectionSchema = z.object({
  name: z.string().min(1, '컬렉션 이름을 입력해주세요').max(50),
  description: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = createCollectionSchema.parse(body);

    const collection = await prisma.collection.create({
      data: {
        userId: session.user.id,
        name,
        description: description ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('POST /api/collections error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
