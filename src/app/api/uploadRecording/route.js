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
    const recordingType = formData.get('recordingType'); // 'call_recording' or 'voice_recording'
    const note = formData.get('note');
    const audioFile = formData.get('audio'); // should be a Blob/File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let evidenceId = `REC-${Date.now()}`;
    if (complaintId) {
      evidenceId = `REC-${complaintId}-${Date.now()}`;
      
      const complaint = db.findComplaintById(complaintId);
      if (!complaint) {
        return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
      }
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Hash for the 65B certificate
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileSizeBytes = buffer.length;

    // Get file extension from original name or default to mp3
    const originalName = audioFile.name || 'recording.mp3';
    const ext = path.extname(originalName) || '.mp3';
    const fileName = `${evidenceId}${ext}`;

    // Save audio to local public folder (For Hackathon/Demo)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    // Generate 65B Certificate
    const certContent = Buffer.from(
      JSON.stringify({ evidenceId, complaintId, fileHash, recordingType, timestamp: now }),
      'utf-8'
    );
    const certificate65B = generate65BCertificate({
      content: certContent,
      recordId: evidenceId,
      recordType: 'audio_evidence',
      sessionId: evidenceId,
      location: null
    });

    const evidenceItem = {
      id: evidenceId,
      type: 'audio',
      recordingType,
      fileName: originalName,
      fileUrl,
      fileHash,
      fileSizeBytes,
      note: note || '',
      uploadedAt: now,
      uploadedBy: 'worker', // Assuming worker session
      certificate65B
    };

    if (complaintId) {
      db.addEvidenceItem(complaintId, evidenceItem);
    }

    return NextResponse.json({
      success: true,
      evidenceId,
      fileUrl,
      timestamp: now,
      recordHash: certificate65B.sha256Hash
    });

  } catch (err) {
    console.error('[uploadRecording] Error:', err);
    return NextResponse.json({ error: 'Recording upload failed.' }, { status: 500 });
  }
}
