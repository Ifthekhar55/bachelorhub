const http = require('http');
const data = JSON.stringify({
  authorId: 'test-user',
  author: 'Test User',
  avatar: 'https://example.com/avatar.png',
  title: 'Test Post',
  content: 'This is a test community post.',
  tag: 'Community',
});
const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/community',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  res.on('data', (chunk) => process.stdout.write(chunk));
  res.on('end', () => process.exit(res.statusCode === 200 ? 0 : 1));
});
req.on('error', (e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});
req.write(data);
req.end();
