import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ReadingChapter {
  bookId: number;
  chapter: number;
}

export interface DayReading {
  day: number;
  chapters: ReadingChapter[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  category: 'kort' | 'middels' | 'lang';
  days: number;
  readings: DayReading[];
}

const READING_PLANS_PATH = path.join(process.cwd(), 'data', 'reading_plans');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const planPath = path.join(READING_PLANS_PATH, `${id}.json`);

    if (!fs.existsSync(planPath)) {
      return NextResponse.json({ error: 'Reading plan not found' }, { status: 404 });
    }

    const data = fs.readFileSync(planPath, 'utf-8');
    const plan: ReadingPlan = JSON.parse(data);
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to load reading plan:', error);
    return NextResponse.json({ error: 'Failed to load reading plan' }, { status: 500 });
  }
}
