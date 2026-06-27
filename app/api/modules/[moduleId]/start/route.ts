import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { startModule } from '@/lib/adaptation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  await requireSession();
  const { moduleId } = await params;
  await startModule(moduleId);
  return NextResponse.json({ ok: true });
}
