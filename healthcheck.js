const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/stats',
    method: 'GET',
    timeout: 2000
};

const healthCheck = http.request(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

healthCheck.on('error', () => {
    process.exit(1);
});

healthCheck.on('timeout', () => {
    process.exit(1);
});

healthCheck.end();
