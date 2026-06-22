import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generate65BCertificate } from '@/lib/certificate65B';

export async function POST(request) {
  try {
    const { complaintId, witnessName, witnessPhone, relationship, duration, sameSite, contractorName } = await request.json();

    if (!complaintId || !witnessName) {
      return NextResponse.json({ error: 'complaintId and witnessName are required.' }, { status: 400 });
    }

    const complaint = db.findComplaintById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    const now       = new Date().toISOString();
    const witnessId = `WIT-${complaintId}-${Date.now()}`;

    // 65B certificate for the witness registration record
    const certContent = Buffer.from(
      JSON.stringify({ witnessId, complaintId, witnessName, witnessPhone: witnessPhone || 'not provided', timestamp: now }),
      'utf-8'
    );
    const certificate65B = generate65BCertificate({
      content:    certContent,
      recordId:   witnessId,
      recordType: 'witness_registration',
      sessionId:  witnessId,
    });

    const witness = {
      id:           witnessId,
      complaintId,
      witnessName,
      witnessPhone: witnessPhone || null,
      relationship: relationship || 'co-worker',
      duration:     duration || null,
      sameSite:     sameSite ?? null,
      contractorName: contractorName || null,
      registeredAt: now,
      consentGiven: true,  // They are registering voluntarily
      ivrCallStatus: 'pending',
      ivrCallTimestamp: null,
      ivrTranscript: null,
      certificate65B,
    };

    const updated = db.addWitness(complaintId, witness);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to register witness.' }, { status: 500 });
    }

    return NextResponse.json({
      success:   true,
      witnessId,
      timestamp: now,
      totalWitnesses: updated.witnesses?.length || 1,
    });

  } catch (err) {
    console.error('[witness] Error:', err);
    return NextResponse.json({ error: 'Witness registration failed.' }, { status: 500 });
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
    witnesses: (complaint.witnesses || []).map(w => ({
      ...w,
      witnessPhone: w.witnessPhone ? '****' + w.witnessPhone.slice(-4) : null, // mask for privacy
    })),
    total: (complaint.witnesses || []).length,
  });
}
