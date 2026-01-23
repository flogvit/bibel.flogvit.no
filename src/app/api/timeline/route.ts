import { NextRequest, NextResponse } from 'next/server';
import { getFullTimeline, getTimelineEventsByPeriod } from '@/lib/bible';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get('period');

  if (periodId) {
    const events = getTimelineEventsByPeriod(periodId);
    return NextResponse.json({ events });
  }

  const timeline = getFullTimeline();
  return NextResponse.json(timeline);
}
