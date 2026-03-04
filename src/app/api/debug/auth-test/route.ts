import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // Test 1: Basic user query
    const userCount = await prisma.user.count();
    results.userCount = userCount;
  } catch (e) {
    results.userError = String(e);
  }

  try {
    // Test 2: user.findUnique (what PrismaAdapter uses)
    const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } });
    results.userFindUnique = user ? 'found' : 'not found (ok)';
  } catch (e) {
    results.userFindUniqueError = String(e);
  }

  try {
    // Test 3: account query
    const accountCount = await prisma.account.count();
    results.accountCount = accountCount;
  } catch (e) {
    results.accountError = String(e);
  }

  try {
    // Test 4: Create and delete a test user (simulates what PrismaAdapter does)
    const testUser = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@debug.local`,
        name: 'Debug Test',
      },
    });
    results.createUser = 'success: ' + testUser.id;
    await prisma.user.delete({ where: { id: testUser.id } });
    results.deleteUser = 'success';
  } catch (e) {
    results.createUserError = String(e);
  }

  return NextResponse.json(results);
}
