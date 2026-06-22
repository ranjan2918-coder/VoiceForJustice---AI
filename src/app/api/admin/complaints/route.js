import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ensure database is initialized/seeded
    db.seedTestData();
    const complaints = db.getComplaints();
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }
    const updated = db.updateComplaintStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, complaint: updated });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return NextResponse.json({ error: 'Failed to update complaint status' }, { status: 500 });
  }
}
