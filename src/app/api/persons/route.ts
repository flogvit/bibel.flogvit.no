import { NextResponse } from 'next/server';
import { getAllPersonsData, getPersonsByRole, getPersonsByEra } from '@/lib/bible';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const era = searchParams.get('era');

  let persons;

  if (role) {
    persons = getPersonsByRole(role);
  } else if (era) {
    persons = getPersonsByEra(era);
  } else {
    persons = getAllPersonsData();
  }

  return NextResponse.json(persons);
}
