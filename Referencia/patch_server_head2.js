const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

if (!code.includes("if (req.method === 'HEAD') {")) {
    code = code.replace(
        "if (req.method === 'OPTIONS') {",
        `if (req.method === 'HEAD') {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(PUBLIC_DIR, reqPath);
    fs.stat(filePath, (err, stats) => {
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
