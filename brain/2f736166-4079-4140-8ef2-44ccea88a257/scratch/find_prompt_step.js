import fs from 'fs';

const logPath = 'C:/Users/IT LAND/.gemini/antigravity-ide/brain/2f736166-4079-4140-8ef2-44ccea88a257/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf-8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  const obj = JSON.parse(line);
  if (obj.type === 'USER_INPUT' && obj.content.includes('Full UI Redesign Prompt')) {
    console.log(`Found Second Prompt at Step: ${obj.step_index}`);
    console.log(obj.content.substring(0, 200));
    break;
  }
}
