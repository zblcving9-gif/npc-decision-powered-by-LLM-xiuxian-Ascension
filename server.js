const http = require('http');
const fs   = require('fs');
const path = require('path');
const mime = { html:'text/html', js:'application/javascript', css:'text/css', md:'text/plain' };

http.createServer((req, res) => {
  let fp = path.join('.', req.url === '/' ? '/index.html' : req.url);
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end('not found'); }
    else {
      const ext = fp.split('.').pop();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end(d);
    }
  });
}).listen(7788, () => console.log('Server running at http://localhost:7788'));
