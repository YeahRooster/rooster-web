const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

if (!code.includes('if (req.method === \\'HEAD\\') {')) {
    code = code.replace(
        "if (req.method === 'OPTIONS') {",
        `if (req.method === 'HEAD') {
    fs.stat(path.join(PUBLIC_DIR, decodeURI(req.url.split('?')[0]) === '/' ? '/index.html' : decodeURI(req.url.split('?')[0])), (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end();
        } else {
            res.writeHead(200, {
                'Content-Length': stats.size,
                'Content-Type': MIME_TYPES[path.extname(req.url).toLowerCase()] || 'application/octet-stream'
            });
            res.end();
        }
    });
    return;
  }
  
  if (req.method === 'OPTIONS') {`
    );
    fs.writeFileSync('server.js', code);
}
