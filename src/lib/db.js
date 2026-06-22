import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure DB file exists
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      complaints: [],
      // Seed some initial complaints for demonstration / testing
      config: {
        lastId: 1000
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Read database
function readDb() {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database file, resetting:', error);
    return { complaints: [], config: { lastId: 1000 } };
  }
}

// Write database
function writeDb(data) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
}

export const db = {
  // Get all complaints
  getComplaints: () => {
    const data = readDb();
    return data.complaints || [];
  },

  // Find a complaint by ID (numeric string or number)
  findComplaintById: (id) => {
    const data = readDb();
    const targetId = String(id).trim();
    return data.complaints.find(c => String(c.id) === targetId) || null;
  },

  // Create a new complaint
  createComplaint: ({
    workerLanguage,
    originalTranscript,
    englishSummary,
    workerSummaryLocal = '',
    structuredFields = {},
    status = 'Filed',
    phoneNumber = null,
    audioPath = null
  }) => {
    const data = readDb();
    
    // Increment numeric ID
    const nextId = (data.config.lastId || 1000) + 1;
    data.config.lastId = nextId;
    
    const newComplaint = {
      id: String(nextId),
      workerLanguage,
      originalTranscript,
      englishSummary,
      workerSummaryLocal,
      structuredFields,
      status, // Filed, PENDING, UNDER_REVIEW, RESOLVED, REJECTED
      phoneNumber,
      audioPath,
      certificate65B: null,   // set after creation by caller
      validationResult: null, // LLM validation snapshot
      checkins:  [],          // daily attendance check-ins
      witnesses: [],          // registered witness records
      evidenceItems: [],      // photos, UPI screenshots, etc.
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.complaints.push(newComplaint);
    writeDb(data);
    
    return newComplaint;
  },

  // Update status of a complaint
  updateComplaintStatus: (id, status) => {
    const data = readDb();
    const targetId = String(id).trim();
    const complaint = data.complaints.find(c => String(c.id) === targetId);
    
    if (complaint) {
      complaint.status = status;
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    
    return null;
  },

  // Attach 65B certificate to a complaint
  setCertificate: (id, cert) => {
    const data = readDb();
    const complaint = data.complaints.find(c => String(c.id) === String(id).trim());
    if (complaint) {
      complaint.certificate65B = cert;
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    return null;
  },

  // Save LLM validation result to complaint
  setValidationResult: (id, result) => {
    const data = readDb();
    const complaint = data.complaints.find(c => String(c.id) === String(id).trim());
    if (complaint) {
      complaint.validationResult = result;
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    return null;
  },

  // Add a daily check-in record to a complaint
  addCheckin: (id, checkin) => {
    const data = readDb();
    const complaint = data.complaints.find(c => String(c.id) === String(id).trim());
    if (complaint) {
      if (!complaint.checkins) complaint.checkins = [];
      complaint.checkins.push(checkin);
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    return null;
  },

  // Add a witness record to a complaint
  addWitness: (id, witness) => {
    const data = readDb();
    const complaint = data.complaints.find(c => String(c.id) === String(id).trim());
    if (complaint) {
      if (!complaint.witnesses) complaint.witnesses = [];
      complaint.witnesses.push(witness);
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    return null;
  },

  // Add an evidence item (photo, screenshot, etc.)
  addEvidenceItem: (id, item) => {
    const data = readDb();
    const complaint = data.complaints.find(c => String(c.id) === String(id).trim());
    if (complaint) {
      if (!complaint.evidenceItems) complaint.evidenceItems = [];
      complaint.evidenceItems.push({ ...item, addedAt: new Date().toISOString() });
      complaint.updatedAt = new Date().toISOString();
      writeDb(data);
      return complaint;
    }
    return null;
  },

  // Seed initial data for testing
  seedTestData: () => {
    const data = readDb();
    if (data.complaints.length === 0) {
      data.config.lastId = 1003;
      data.complaints = [
        {
          id: '1001',
          workerLanguage: 'es',
          originalTranscript: 'No me han pagado las últimas dos semanas de trabajo en la obra de la calle Main.',
          englishSummary: 'Worker reports unpaid wages for the last two weeks of work at the Main Street construction site.',
          workerSummaryLocal: 'Su queja ha sido registrada con el número 1001. Nos comunicaremos con usted pronto.',
          structuredFields: {
            workerName: 'Not mentioned',
            location: 'Main Street construction site',
            contractorName: 'Employer',
            wageAmount: 'Not specified',
            duePeriod: '2 weeks',
            daysWorked: 'Not specified',
            nonPaymentType: 'not paid',
            threats: 'None'
          },
          status: 'PENDING',
          phoneNumber: '5551234567',
          audioPath: null,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '1002',
          workerLanguage: 'hi',
          originalTranscript: 'ठेकेदार ने काम पूरा होने के बाद भी मेरी मजदूरी नहीं दी। बोल रहा है अगले हफ्ते आना।',
          englishSummary: 'Contractor did not pay wages after project completion. Told worker to come back next week.',
          workerSummaryLocal: 'आपकी शिकायत संख्या 1002 दर्ज कर ली गई है। ठेकेदार द्वारा मजदूरी न देने के संबंध में यह कार्रवाई की जा रही है।',
          structuredFields: {
            workerName: 'Not mentioned',
            location: 'Not specified',
            contractorName: 'Contractor',
            wageAmount: 'Not specified',
            duePeriod: 'Not specified',
            daysWorked: 'Not specified',
            nonPaymentType: 'not paid',
            threats: 'None'
          },
          status: 'UNDER_REVIEW',
          phoneNumber: '5559876543',
          audioPath: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '1003',
          workerLanguage: 'vi',
          originalTranscript: 'Tôi đã làm việc 40 giờ tuần trước nhưng chủ thầu chỉ trả tiền cho 20 giờ.',
          englishSummary: 'Worker worked 40 hours last week but the contractor only paid for 20 hours.',
          workerSummaryLocal: 'Khiếu nại số 1003 của bạn đã được ghi nhận. Chúng tôi sẽ giải quyết việc thiếu lương của bạn.',
          structuredFields: {
            workerName: 'Not mentioned',
            location: 'Not specified',
            contractorName: 'Contractor',
            wageAmount: 'Not specified',
            duePeriod: 'Last week',
            daysWorked: '40 hours',
            nonPaymentType: 'partial',
            threats: 'None'
          },
          status: 'RESOLVED',
          phoneNumber: null,
          audioPath: null,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          updatedAt: new Date().toISOString()
        }
      ];
      writeDb(data);
    }
  }
};
