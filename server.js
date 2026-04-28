const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const LOGINS_FILE = path.join(__dirname, 'logins.json');
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

function readLogins() {
    try {
        const data = fs.readFileSync(LOGINS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveLogins(logins) {
    fs.writeFileSync(LOGINS_FILE, JSON.stringify(logins, null, 2), 'utf8');
}

function readPedidos() {
    try {
        const data = fs.readFileSync(PEDIDOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function savePedidos(pedidos) {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2), 'utf8');
}

function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;

    if (url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { email, telefone, usuario, senha } = JSON.parse(body);
                if (!email || !telefone || !usuario || !senha) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Preencha todos os campos.' }));
                    return;
                }
                const logins = readLogins();
                if (logins.find(l => l.usuario === usuario || l.email === email)) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Usuário ou email já cadastrado.' }));
                    return;
                }
                logins.push({ email, telefone, usuario, senha });
                saveLogins(logins);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Conta criada com sucesso!' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Erro no servidor.' }));
            }
        });
        return;
    }

    if (url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { usuario, senha } = JSON.parse(body);
                const logins = readLogins();
                const user = logins.find(l => (l.usuario === usuario || l.email === usuario) && l.senha === senha);
                if (user) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Login realizado com sucesso!', usuario: user.usuario }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Credenciais inválidas.' }));
                }
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Erro no servidor.' }));
            }
        });
        return;
    }

    if (url === '/api/logins' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(readLogins()));
        return;
    }

    if (url === '/api/pedidos' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(readPedidos()));
        return;
    }

    if (url.startsWith('/api/pedido/') && req.method === 'DELETE') {
        try {
            const index = parseInt(url.split('/').pop());
            const pedidos = readPedidos();
            if (index < 0 || index >= pedidos.length) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Pedido não encontrado.' }));
                return;
            }
            pedidos.splice(index, 1);
            savePedidos(pedidos);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Pedido removido com sucesso!' }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro no servidor.' }));
        }
        return;
    }

    if (url === '/api/pedido' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { usuario, nome, email, telefone, pagamento, produto } = JSON.parse(body);
                if (!usuario || !nome || !pagamento || !produto) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Preencha todos os campos.' }));
                    return;
                }
                const pedidos = readPedidos();
                pedidos.push({ usuario, nome, email, telefone, pagamento, produto, data: new Date().toISOString() });
                savePedidos(pedidos);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Pedido realizado com sucesso!' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Erro no servidor.' }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';
    serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

