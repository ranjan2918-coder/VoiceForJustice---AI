const fs = require('fs');

const transcriptPath = 'C:\\Users\\mitran\\.gemini\\antigravity\\brain\\7a8b3439-119a-430d-a5fc-43d77259d5ea\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let latestPageJsContent = '';

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    // Look for a replace_file_content or write_to_file call that targeted page.js
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        if (call.name === 'write_to_file' && call.arguments.TargetFile && call.arguments.TargetFile.endsWith('page.js')) {
          latestPageJsContent = call.arguments.CodeContent;
        }
      }
    }
  } catch (e) {}
}

if (latestPageJsContent) {
  fs.writeFileSync('src/app/page.js.backup', latestPageJsContent);
  console.log('Restored page.js from transcript to src/app/page.js.backup');
} else {
  console.log('Could not find full page.js in transcript.');
}
