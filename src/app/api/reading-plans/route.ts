import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ReadingPlanSummary {
  id: string;
  name: string;
  description: string;
  category: 'kort' | 'middels' | 'lang';
  days: number;
}

const READING_PLANS_PATH = path.join(process.cwd(), 'data', 'reading_plans');

export async function GET() {
  try {
    const indexPath = path.join(READING_PLANS_PATH, 'index.json');
    const data = fs.readFileSync(indexPath, 'utf-8');
    const plans: ReadingPlanSummary[] = JSON.parse(data);
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to load reading plans:', error);
    return NextResponse.json({ error: 'Failed to load reading plans' }, { status: 500 });
  }
}
