const fs = require('fs');

// We can just read the first part of i18n.ts to evaluate `en`
const content = fs.readFileSync('i18n.ts', 'utf8');

// The `const en = { ... };` block ends before `const es = {`
const enBlock = content.match(/const en = (\{[\s\S]*?\n\});\n\n\/\//)[1];

// Evaluate the string to a JS object
const enObj = eval('(' + enBlock + ')');

fs.writeFileSync('en_base.json', JSON.stringify(enObj.translation, null, 2));
console.log("Extracted en_base.json");
