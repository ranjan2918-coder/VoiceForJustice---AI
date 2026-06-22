import crypto from 'crypto';

/**
 * Generates a Section 65B-compliant electronic evidence certificate
 * for any electronic record stored by this system.
 *
 * Based on: Indian Evidence Act, 1872 — Section 65B
 * Mandatory per Supreme Court ruling in Arjun Panditrao Khotkar v Kailash Kushanrao Gorantyal (2020)
 *
 * @param {object} params
 * @param {Buffer|string} params.content   — The raw content (audio blob, transcript text, etc.)
 * @param {string}        params.recordId  — Unique ID of the record
 * @param {string}        params.recordType — e.g. 'voice_complaint', 'checkin_audio', 'witness_call'
 * @param {string}        params.deviceId  — Kiosk/server ID
 * @param {string}        params.sessionId — Session or request ID
 * @param {object}        [params.location] — { lat, lng, address } if available
 * @returns {object} certificate65B object
 */
export function generate65BCertificate({
  content,
  recordId,
  recordType,
  deviceId = 'VOICEFORJUSTICE-AI-SERVER-01',
  sessionId = '',
  location = null,
}) {
  const timestamp = new Date().toISOString();

  // SHA-256 hash of the content — proves non-tampering
  const contentBuffer = typeof content === 'string'
    ? Buffer.from(content, 'utf-8')
    : content;
  const sha256Hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

  // Build certificate object
  const certificate = {
    certificateVersion: '1.0',
    recordId,
    recordType,
    sha256Hash,
    fileSizeBytes: contentBuffer.length,
    timestamp,
    serverTimeSource: 'NTP-synced system clock',
    deviceId,
    sessionId,
    location: location || null,

    // System details (for 65B "responsible official" requirement)
    systemName: 'VoiceForJustice Kiosk Platform',
    systemVersion: '3.0.0',
    responsibleOfficer: 'System Administrator — VoiceForJustice',
    declaration:
      'I hereby certify that the electronic record identified above was produced by the computer ' +
      'system described herein, which was operating properly at the time of generation. ' +
      'The information contained therein was fed into the computer in the ordinary course of ' +
      'activities. The computer was operating properly throughout the relevant period. ' +
      'This certificate is issued under Section 65B of the Indian Evidence Act, 1872.',

    // Integrity signature (HMAC over core fields using server secret)
    integritySignature: _signCertificate({
      recordId, sha256Hash, timestamp, deviceId, recordType,
    }),
  };

  return certificate;
}

/**
 * Verifies that a 65B certificate has not been tampered with.
 * @param {object} cert — The certificate object returned by generate65BCertificate
 * @returns {boolean}
 */
export function verify65BCertificate(cert) {
  try {
    const expected = _signCertificate({
      recordId:   cert.recordId,
      sha256Hash: cert.sha256Hash,
      timestamp:  cert.timestamp,
      deviceId:   cert.deviceId,
      recordType: cert.recordType,
    });
    return cert.integritySignature === expected;
  } catch {
    return false;
  }
}

/**
 * Format a certificate as a human-readable text block suitable for printing
 * or attaching to a complaint PDF.
 * @param {object} cert
 * @returns {string}
 */
export function formatCertificateText(cert) {
  return `
══════════════════════════════════════════════════════════════
  CERTIFICATE UNDER SECTION 65B — INDIAN EVIDENCE ACT, 1872
══════════════════════════════════════════════════════════════
System Name    : ${cert.systemName}
System Version : ${cert.systemVersion}
Record ID      : ${cert.recordId}
Record Type    : ${cert.recordType}
Timestamp (UTC): ${cert.timestamp}
Device ID      : ${cert.deviceId}
Session ID     : ${cert.sessionId || 'N/A'}
Location       : ${cert.location ? `${cert.location.address || ''} (${cert.location.lat},${cert.location.lng})` : 'Kiosk — fixed location on record'}
File Size      : ${cert.fileSizeBytes} bytes
SHA-256 Hash   : ${cert.sha256Hash}
Integrity Sig  : ${cert.integritySignature}

DECLARATION:
${cert.declaration}

Responsible Officer: ${cert.responsibleOfficer}
Certificate Version: ${cert.certificateVersion}
══════════════════════════════════════════════════════════════
`.trim();
}

// ── Internal: HMAC signing ─────────────────────────────────────────────────

function _signCertificate({ recordId, sha256Hash, timestamp, deviceId, recordType }) {
  const secret = process.env.CERT_SECRET || 'voiceforjustice-65b-secret-change-in-production';
  const payload = `${recordId}|${sha256Hash}|${timestamp}|${deviceId}|${recordType}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
