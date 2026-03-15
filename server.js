// server.js - супер-легкий
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Раздаем файлы из папки public
    let filePath = req.url === '/' ? '/index.html' : req.url;
    let fullPath = path.join(__dirname, 'public', filePath);

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200);
            res.end(content);
        }
    });
});

server.listen(process.env.PORT || 3000);
