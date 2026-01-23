import { NextResponse } from 'next/server';
import { getPersonData, getRelatedPersonsData } from '@/lib/bible';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const person = getPersonData(id);

  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  // Optionally include related persons data
  const { searchParams } = new URL(request.url);
  const includeRelated = searchParams.get('includeRelated') === 'true';

  if (includeRelated) {
    const relatedPersons = getRelatedPersonsData(id);
    return NextResponse.json({ ...person, relatedPersonsData: relatedPersons });
  }

  return NextResponse.json(person);
}
