const fs = require('fs');
let code = fs.readFileSync('src/app/page.js', 'utf8');

// Fix imports
code = code.replace(
  "import { speakText, stopSpeaking, startRecording as startRecordingAction, stopRecording as stopRecordingAction } from '@/lib/kioskUtils';",
  "import { speakText, stopSpeaking, AudioRecorder } from '@/lib/kioskUtils';"
);

// We need a global or state variable for recorder, or better yet just use a module-level variable to hold it since it's only active one at a time.
const recorderCode = `
let globalRecorder = null;
const startRecordingAction = async () => {
  if (!globalRecorder) globalRecorder = new AudioRecorder();
  await globalRecorder.start();
};
const stopRecordingAction = async () => {
  if (globalRecorder) {
    const blob = await globalRecorder.stop();
    globalRecorder = null;
    return blob;
  }
  return null;
};
`;

code = code.replace(
  "export default function KioskPage() {",
  recorderCode + "\\nexport default function KioskPage() {"
);

fs.writeFileSync('src/app/page.js', code, 'utf8');
console.log('Fixed recording imports in page.js');
