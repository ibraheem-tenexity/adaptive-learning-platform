import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { generatePathPlanStream } from '@/lib/planner';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { goal, weeklyMinutes, level, goalId } = await req.json();

  if (!goal || !weeklyMinutes || !level) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generatePathPlanStream(goal, weeklyMinutes, level)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
