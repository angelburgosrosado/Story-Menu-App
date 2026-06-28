const fs = require('fs');
fetch('http://localhost:3001/api/gemini/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'leonardo',
    finalImagePrompt: 'A test prompt',
    heroRef: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', desc: 'test' }
  })
}).then(r => r.text()).then(console.log).catch(console.error);
