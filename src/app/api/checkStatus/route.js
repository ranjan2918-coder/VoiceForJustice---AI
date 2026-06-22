import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');
    const query = searchParams.get('query');

    // Ensure database is initialized/seeded
    db.seedTestData();

    let complaint = null;

    if (rawId) {
      // Clean spoken IDs: remove spaces, punctuation, extract digits
      const cleanId = rawId.replace(/\D/g, '');
      if (cleanId) {
        complaint = db.findComplaintById(cleanId);
      }
    } else if (query) {
      // LLM Semantic Search across all complaints
      const allComplaints = db.getComplaints();
      
      // Build a minimal catalog to fit context window
      const catalog = allComplaints.map(c => 
        `ID: ${c.id} | Name: ${c.structuredFields?.workerName} | Loc: ${c.structuredFields?.location} | Contractor: ${c.structuredFields?.contractorName} | Desc: ${c.englishSummary}`
      ).join('\n');

      const prompt = `You are a search matching agent. A worker provided this spoken information to find their complaint: "${query}".
Review the following database of complaints:
${catalog}

Return ONLY the numeric ID of the complaint that is the best match. If no reasonable match is found, return "NONE". Do not include any other text.`;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
          temperature: 0,
        });
        
        const matchedId = completion.choices[0]?.message?.content?.trim();
        if (matchedId && matchedId !== "NONE") {
          complaint = db.findComplaintById(matchedId);
        }
      } catch (e) {
        console.error('LLM search failed:', e);
      }
    } else {
      return NextResponse.json(
        { error: 'Provide id or query parameter' },
        { status: 400 }
      );
    }

    if (!complaint) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      complaint
    });
  } catch (error) {
    console.error('Error in /api/checkStatus:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

