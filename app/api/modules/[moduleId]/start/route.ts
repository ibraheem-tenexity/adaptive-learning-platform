import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { startModule } from '@/lib/adaptation';

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  await requireSession();
  await startModule(params.moduleId);
  return NextResponse.json({ ok: true });
}
