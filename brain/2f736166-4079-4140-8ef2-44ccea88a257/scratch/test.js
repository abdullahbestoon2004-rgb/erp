import fs from 'fs';

const logPath = 'C:/Users/IT LAND/.gemini/antigravity-ide/brain/2f736166-4079-4140-8ef2-44ccea88a257/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf-8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (obj.tool_calls) {
    for (const tc of obj.tool_calls) {
      const args = tc.args || tc.arguments;
      if (args && args.TargetFile) {
        const fileRaw = args.TargetFile;
        // Strip quotes, replace backslashes, and compress double slashes
        const file = fileRaw.replace(/"/g, '').replace(/\\/g, '/').replace(/\/\//g, '/').toLowerCase();
        const matches = file.includes('client/src');
        if (matches) {
          console.log(`Raw: ${fileRaw} -> Normalized: ${file} (Match: ${matches})`);
        }
      }
    }
  }
}
