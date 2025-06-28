const express = require('express');
const router = express.Router();

class WebController {
    constructor(config, logger, arkChatManager) {
        this.config = config;
        this.logger = logger;
        this.arkChatManager = arkChatManager;
        this.setupRoutes();
    }

    setupRoutes() {
        // Sunucu durumu
        router.get('/servers/status', (req, res) => {
            const stats = this.arkChatManager.getStats();
            res.json(stats);
        });

        // Chat geçmişi
        router.get('/chat/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            const messages = this.arkChatManager.getRecentMessages(limit);
            res.json(messages);
        });

        // Admin mesajı gönder
        router.post('/admin/message', (req, res) => {
            const { message, serverId } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Mesaj gerekli' });
            }

            this.arkChatManager.sendAdminMessage(message, serverId)
                .then(() => {
                    res.json({ success: true });
                })
                .catch(error => {
                    res.status(500).json({ error: error.message });
                });
        });

        // Sunucu komutu çalıştır
        router.post('/admin/command', (req, res) => {
            const { serverId, command } = req.body;
            
            if (!serverId || !command) {
                return res.status(400).json({ error: 'Sunucu ID ve komut gerekli' });
            }

            this.arkChatManager.executeCommand(serverId, command)
                .then(result => {
                    res.json({ success: true, result });
                })
                .catch(error => {
                    res.status(500).json({ error: error.message });
                });
        });

        // Yapılandırma
        router.get('/config', (req, res) => {
            // Hassas bilgileri çıkar
            const safeConfig = { ...this.config };
            if (safeConfig.servers) {
                safeConfig.servers = safeConfig.servers.map(server => ({
                    ...server,
                    password: '***'
                }));
            }
            res.json(safeConfig);
        });

        // İstatistikler
        router.get('/stats', (req, res) => {
            const stats = this.arkChatManager.getStats();
            res.json(stats);
        });
    }

    handleAdminCommand(socket, data) {
        const { type, payload } = data;

        switch (type) {
            case 'sendMessage':
                this.handleSendMessage(socket, payload);
                break;
            case 'executeCommand':
                this.handleExecuteCommand(socket, payload);
                break;
            case 'getPlayerList':
                this.handleGetPlayerList(socket, payload);
                break;
            default:
                socket.emit('adminError', { message: 'Bilinmeyen komut türü' });
        }
    }

    async handleSendMessage(socket, payload) {
        try {
            const { message, serverId } = payload;
            await this.arkChatManager.sendAdminMessage(message, serverId);
            socket.emit('adminSuccess', { message: 'Mesaj gönderildi' });
        } catch (error) {
            socket.emit('adminError', { message: error.message });
        }
    }

    async handleExecuteCommand(socket, payload) {
        try {
            const { serverId, command } = payload;
            const result = await this.arkChatManager.executeCommand(serverId, command);
            socket.emit('commandResult', { serverId, command, result });
        } catch (error) {
            socket.emit('adminError', { message: error.message });
        }
    }

    async handleGetPlayerList(socket, payload) {
        try {
            const { serverId } = payload;
            const server = this.arkChatManager.servers.get(serverId);
            if (server) {
                const players = await server.getPlayerList();
                socket.emit('playerList', { serverId, players });
            } else {
                socket.emit('adminError', { message: 'Sunucu bulunamadı' });
            }
        } catch (error) {
            socket.emit('adminError', { message: error.message });
        }
    }

    getRouter() {
        return router;
    }
}

module.exports = WebController;
