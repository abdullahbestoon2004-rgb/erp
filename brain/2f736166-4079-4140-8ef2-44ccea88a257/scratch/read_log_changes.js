import fs from 'fs';
import path from 'path';

const logPath = 'C:/Users/IT LAND/.gemini/antigravity-ide/brain/2f736166-4079-4140-8ef2-44ccea88a257/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log("Log file not found!");
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
const fileEdits = {};

lines.forEach(line => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
          const args = tc.args || tc.arguments;
          if (args && args.TargetFile) {
            // Normalize path to forward slashes for cross-platform matching
            const file = args.TargetFile.replace(/"/g, '').replace(/\\/g, '/');
            if (file.includes('client/src') && !file.includes('scratch') && !file.includes('verify_dialogs')) {
              if (!fileEdits[file]) {
                fileEdits[file] = [];
              }
              fileEdits[file].push({
                type: tc.name,
                args: args,
                step: obj.step_index
              });
            }
          }
        }
      });
    }
  } catch (e) {
    // Ignore parse errors
  }
});

console.log("Found edits for files:");
Object.keys(fileEdits).forEach(f => {
  console.log(`- ${f} (${fileEdits[f].length} edits)`);
});

// Save to JSON
fs.writeFileSync(
  'C:/Users/IT LAND/.gemini/antigravity-ide/brain/2f736166-4079-4140-8ef2-44ccea88a257/scratch/extracted_edits.json',
  JSON.stringify(fileEdits, null, 2),
  'utf-8'
);
console.log("Saved extracted edits to scratch/extracted_edits.json");
