const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});
req.end();
