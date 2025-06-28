const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const bodyParser = require('body-parser');
const chalk = require('chalk');
require('dotenv').config();

const ArkChatManager = require('./src/arkChatManager');
const WebController = require('./src/webController');
const Logger = require('./src/logger');

class ArkChatServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.config = this.loadConfig();
        this.logger = new Logger(this.config.logLevel || 'info');
        this.arkChatManager = new ArkChatManager(this.config, this.logger, this.io);
        this.webController = new WebController(this.config, this.logger, this.arkChatManager);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketEvents();
    }

    loadConfig() {
        try {
            if (!fs.existsSync('config.json')) {
                this.logger?.warn('config.json bulunamadı, örnek dosyadan kopyalanıyor...');
                fs.copyFileSync('config.example.json', 'config.json');
            }
            return JSON.parse(fs.readFileSync('config.json', 'utf8'));
        } catch (error) {
            console.error(chalk.red('Yapılandırma dosyası yüklenirken hata:', error.message));
            process.exit(1);
        }
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
    }

    setupRoutes() {
        // Ana sayfa
        this.app.get('/', (req, res) => {
            res.render('index', {
                title: 'Ark Cross-Server Chat',
                servers: this.config.servers,
                stats: this.arkChatManager.getStats()
            });
        });

        // API rotaları
        this.app.use('/api', this.webController.getRouter());

        // Admin panel
        this.app.get('/admin', (req, res) => {
            res.render('admin', {
                title: 'Admin Panel',
                servers: this.config.servers,
                stats: this.arkChatManager.getStats(),
                config: this.config
            });
        });
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            this.logger.info(`Web istemcisi bağlandı: ${socket.id}`);
            
            // Son mesajları gönder
            const recentMessages = this.arkChatManager.getRecentMessages(50);
            socket.emit('chatHistory', recentMessages);
            
            // İstatistikleri gönder
            socket.emit('serverStats', this.arkChatManager.getStats());

            // Sunucu durumlarını gönder
            this.config.servers.forEach(server => {
                const arkServer = this.arkChatManager.servers.get(server.id);
                const status = arkServer && arkServer.isConnected() ? 'connected' : 'disconnected';
                socket.emit('serverStatusChange', {
                    serverId: server.id,
                    status: status,
                    timestamp: new Date()
                });
            });

            socket.on('disconnect', () => {
                this.logger.info(`Web istemcisi ayrıldı: ${socket.id}`);
            });

            // Admin komutları
            socket.on('adminCommand', (data) => {
                this.webController.handleAdminCommand(socket, data);
            });
        });
    }

    async start() {
        try {
            // Chat yöneticisini başlat
            await this.arkChatManager.start();
            
            // Web sunucusunu başlat
            const port = this.config.port || process.env.PORT || 3000;
            this.server.listen(port, () => {
                console.log(chalk.green(`
╔══════════════════════════════════════════╗
║        ARK CROSS-SERVER CHAT             ║
║                                          ║
║  🌐 Web Arayüzü: http://localhost:${port}    ║
║  🎮 Aktif Sunucular: ${this.config.servers.filter(s => s.enabled).length}               ║
║  📊 Admin Panel: http://localhost:${port}/admin ║
╚══════════════════════════════════════════╝
                `));
                
                this.logger.info(`Sunucu ${port} portunda başlatıldı`);
            });

        } catch (error) {
            this.logger.error('Sunucu başlatılırken hata:', error);
            process.exit(1);
        }
    }

    async stop() {
        this.logger.info('Sunucu kapatılıyor...');
        await this.arkChatManager.stop();
        this.server.close();
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nKapatma sinyali alındı...'));
    if (global.arkChatServer) {
        await global.arkChatServer.stop();
    }
    process.exit(0);
});

// Sunucuyu başlat
const server = new ArkChatServer();
global.arkChatServer = server;
server.start();

module.exports = ArkChatServer;
