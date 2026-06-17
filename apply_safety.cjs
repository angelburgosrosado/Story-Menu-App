const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const response = await ai\.models\.generateContent\(\{/g;
// actually there's a couple of variants:
// const resObj = await ai.models.generateContent({
// const response = await ai.models.generateContent({

code = code.replace(/await ai\.models\.generateContent\(\{/g, `await callGeminiSafely({\n                safetySettings: applyModeration(req, req.body ? JSON.stringify(req.body) : ""),`);

fs.writeFileSync('server.ts', code);
