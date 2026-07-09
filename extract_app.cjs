const fs = require('fs');
const lines = fs.readFileSync('/Users/ABGlobalCEO/.gemini/antigravity-ide/brain/3df3a83e-31ca-4ba6-a23e-57a33d10c549/.system_generated/logs/transcript_full.jsonl', 'utf-8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'default_api:multi_replace_file_content' || call.name === 'default_api:replace_file_content') {
            const target = call.arguments.TargetFile || '';
            if (target.includes('App.tsx')) {
                console.log(`Found edit at step ${obj.step_index}`);
            }
        }
      }
    }
  } catch (e) {}
}
