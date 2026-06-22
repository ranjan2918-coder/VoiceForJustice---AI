import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generate65BCertificate } from '@/lib/certificate65B';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const complaintId = formData.get('complaintId');
    const lat = formData.get('lat');
    const lng = formData.get('lng');
    const photoFile = formData.get('photo'); // should be a Blob/File

    if (!photoFile) {
      return NextResponse.json({ error: 'Photo is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let evidenceId = `EVI-${Date.now()}`;
    if (complaintId) {
      evidenceId = `EVI-${complaintId}-${Date.now()}`;
      
      const complaint = db.findComplaintById(complaintId);
      if (!complaint) {
        return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
      }
    }

    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Hash for the 65B certificate
    const photoHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const photoSizeBytes = buffer.length;

    // Save photo to local public folder (For Hackathon/Demo)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileName = `${evidenceId}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const photoUrl = `/uploads/${fileName}`;

    // Generate 65B Certificate
    const certContent = Buffer.from(
      JSON.stringify({ evidenceId, complaintId, lat, lng, photoHash, timestamp: now }),
      'utf-8'
    );
    const certificate65B = generate65BCertificate({
      content: certContent,
      recordId: evidenceId,
      recordType: 'photo_evidence',
      sessionId: evidenceId,
      location: lat && lng ? { lat, lng } : null
    });

    const evidenceItem = {
      id: evidenceId,
      type: 'photo',
      photoUrl,
      photoHash,
      photoSizeBytes,
      lat: lat || null,
      lng: lng || null,
      timestamp: now,
      certificate65B
    };

    if (complaintId) {
      db.addEvidenceItem(complaintId, evidenceItem);
    }

    return NextResponse.json({
      success: true,
      evidenceId,
      photoUrl,
      timestamp: now,
      recordHash: certificate65B.sha256Hash
    });

  } catch (err) {
    console.error('[evidence] Error:', err);
    return NextResponse.json({ error: 'Evidence creation failed.' }, { status: 500 });
  }
}
