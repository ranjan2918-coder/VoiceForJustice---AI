import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { contractorName, companyName, siteLocation } = await request.json();

    if (!contractorName && !siteLocation) {
      return NextResponse.json({ match: false, error: 'Provide at least contractor or site location.' }, { status: 400 });
    }

    db.seedTestData();
    const complaints = db.getComplaints();

    let match = false;

    // A very simple heuristic: see if any existing complaint shares the same contractor or location
    for (const c of complaints) {
      const dbContractor = c.structuredFields?.contractorName?.toLowerCase() || '';
      const dbLocation = c.structuredFields?.location?.toLowerCase() || '';

      const searchContractor = (contractorName || '').toLowerCase();
      const searchLocation = (siteLocation || '').toLowerCase();

      if (searchContractor && dbContractor.includes(searchContractor)) {
        match = true;
        break;
      }
      if (searchLocation && dbLocation.includes(searchLocation)) {
        match = true;
        break;
      }
    }

    return NextResponse.json({
      match,
      success: true
    });

  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json({ error: 'Validation failed.' }, { status: 500 });
  }
}
