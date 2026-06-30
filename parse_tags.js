const fs = require('fs');

const content = fs.readFileSync('Setup.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

for (let i = 1820; i <= 2284; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Ignore comments
    if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;

    // simplistic parser
    const tagRegex = /<\/?([a-zA-Z0-9]+|)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        // skip self closing
        if (fullTag.endsWith('/>')) continue;
        
        const isClosing = fullTag.startsWith('</');
        const tagName = match[1];

        if (!isClosing) {
            stack.push({tag: tagName, line: i + 1});
        } else {
            if (stack.length === 0) {
                console.log(`Unmatched closing tag ${fullTag} on line ${i + 1}`);
            } else {
                const top = stack.pop();
                if (top.tag !== tagName) {
                    console.log(`Mismatch on line ${i + 1}: expected </${top.tag}> from line ${top.line}, found ${fullTag}`);
                    return;
                }
            }
        }
    }
}
console.log('Stack at 2284:', stack);
