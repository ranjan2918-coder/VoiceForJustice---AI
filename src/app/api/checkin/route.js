import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generate65BCertificate } from '@/lib/certificate65B';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const complaintId = formData.get('complaintId');
    const language    = (formData.get('language') || 'en').toLowerCase();
    const transcript  = formData.get('transcript') || '';
    const audioFile   = formData.get('audio'); // may be null if text-only

    if (!complaintId) {
      return NextResponse.json({ error: 'complaintId is required.' }, { status: 400 });
    }

    // Verify complaint exists
    const complaint = db.findComplaintById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    const now       = new Date().toISOString();
    const checkinId = `CHK-${complaintId}-${Date.now()}`;

    // Build audio hash if audio provided
    let audioHash = null;
    let audioSizeBytes = 0;
    if (audioFile && typeof audioFile !== 'string') {
      const arrayBuffer = await audioFile.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      audioHash = crypto.createHash('sha256').update(buf).digest('hex');
      audioSizeBytes = buf.length;
    }

    // Generate 65B certificate for this check-in record
    const certContent = Buffer.from(
      JSON.stringify({ checkinId, complaintId, transcript, audioHash, timestamp: now }),
      'utf-8'
    );
    const certificate65B = generate65BCertificate({
      content:    certContent,
      recordId:   checkinId,
      recordType: 'daily_checkin',
      sessionId:  checkinId,
    });

    // Build check-in record
    const checkin = {
      id:           checkinId,
      complaintId,
      timestamp:    now,
      language,
      transcript,
      audioHash,
      audioSizeBytes,
      certificate65B,
    };

    // Store in DB
    const updated = db.addCheckin(complaintId, checkin);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to save check-in.' }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      checkinId,
      timestamp:  now,
      recordHash: certificate65B.sha256Hash,
      totalCheckins: updated.checkins?.length || 1,
    });

  } catch (err) {
    console.error('[checkin] Error:', err);
    return NextResponse.json({ error: 'Check-in failed.' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const complaintId = searchParams.get('id');

  if (!complaintId) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }

  const complaint = db.findComplaintById(complaintId);
  if (!complaint) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  return NextResponse.json({
    checkins: complaint.checkins || [],
    total:    (complaint.checkins || []).length,
  });
}
