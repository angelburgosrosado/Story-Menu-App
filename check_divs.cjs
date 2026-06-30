const fs = require('fs');

const content = fs.readFileSync('Setup.tsx', 'utf8');
const lines = content.split('\n');

let openCount = 0;
let closeCount = 0;
let fragmentOpen = 0;
let fragmentClose = 0;

for (let i = 1821; i <= 2284; i++) {
    const line = lines[i];
    if (line) {
        // Simple regex, not perfect but good enough for this
        const opens = (line.match(/<div/g) || []).length;
        const closes = (line.match(/<\/div>/g) || []).length;
        const fOpens = (line.match(/<>/g) || []).length;
        const fCloses = (line.match(/<\/>/g) || []).length;
        
        openCount += opens;
        closeCount += closes;
        fragmentOpen += fOpens;
        fragmentClose += fCloses;
        
        if (openCount - closeCount < 0) {
            console.log(`Mismatch at line ${i + 1}: opens=${openCount}, closes=${closeCount}`);
            break;
        }
    }
}

console.log(`Total Opens: ${openCount}`);
console.log(`Total Closes: ${closeCount}`);
