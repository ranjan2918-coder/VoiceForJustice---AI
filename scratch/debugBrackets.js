const fs = require('fs');
const lines = fs.readFileSync('src/app/page.js', 'utf8').split('\n');

let curly = 0;
let paren = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') curly++;
    if (line[j] === '}') curly--;
    if (line[j] === '(') paren++;
    if (line[j] === ')') paren--;
    
    // Check if it drops below 1 after the initial function declaration
    if (i > 10 && curly === 0) {
      console.log(`Curly reached 0 at line ${i + 1}, char ${j + 1}`);
      return;
    }
  }
}
