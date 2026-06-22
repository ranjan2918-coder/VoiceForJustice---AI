const fs = require('fs');

const transcriptPath = 'C:\\Users\\mitran\\.gemini\\antigravity\\brain\\7a8b3439-119a-430d-a5fc-43d77259d5ea\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let foundContent = null;

for (const line of lines) {
  if (line.includes('export default function KioskPage')) {
    try {
      const entry = JSON.parse(line);
      if (entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.arguments.CodeContent && call.arguments.CodeContent.includes('export default function KioskPage')) {
            foundContent = call.arguments.CodeContent;
            break;
          }
        }
      }
    } catch(e) {}
  }
}

if (foundContent) {
  fs.writeFileSync('src/app/page.js.original', foundContent);
  console.log('Successfully wrote original page.js to src/app/page.js.original');
} else {
  console.log('Not found in any CodeContent block.');
}
