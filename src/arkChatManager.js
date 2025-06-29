const ArkServer = require('./arkServer');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class ArkChatManager {
    constructor(config, logger, io) {
        this.config = config;
        this.logger = logger;
        this.io = io;
        this.servers = new Map();
        this.chatHistory = [];
        this.stats = {
            totalMessages: 0,
            totalPlayers: 0,
            serversOnline: 0,
            uptime: Date.now()
        };
        
        this.initializeChatHistory();
    }

    initializeChatHistory() {
        // Chat geçmişini dosyadan yükle
        const historyFile = path.join(process.cwd(), 'data', 'chat-history.json');
        
        if (fs.existsSync(historyFile)) {
            try {
                const data = fs.readFileSync(historyFile, 'utf8');
                this.chatHistory = JSON.parse(data);
                this.logger.info(`${this.chatHistory.length} chat mesajı yüklendi`);
            } catch (error) {
                this.logger.error('Chat geçmişi yüklenirken hata:', error.message);
                this.chatHistory = [];
            }
        }
    }

    saveChatHistory() {
        if (!this.config.chatHistory?.saveToFile) return;

        try {
            const dataDir = path.join(process.cwd(), 'data');
            fs.ensureDirSync(dataDir);
            
            const historyFile = path.join(dataDir, 'chat-history.json');
            
            // Sadece son N mesajı sakla
            const maxMessages = this.config.chatHistory?.maxMessages || 1000;
            const messagesToSave = this.chatHistory.slice(-maxMessages);
            
            fs.writeFileSync(historyFile, JSON.stringify(messagesToSave, null, 2));
        } catch (error) {
            this.logger.error('Chat geçmişi kaydedilirken hata:', error.message);
        }
    }

    async start() {
        this.logger.info('Ark Chat Manager başlatılıyor...');
        
        // Tüm sunucuları başlat
        for (const serverConfig of this.config.servers) {
            if (serverConfig.enabled) {
                await this.addServer(serverConfig);
            }
        }

        // Periyodik kaydetme
        this.saveInterval = setInterval(() => {
            this.saveChatHistory();
        }, 30000); // 30 saniyede bir kaydet

        this.logger.success('Ark Chat Manager başlatıldı');
    }

    async addServer(serverConfig) {
        const server = new ArkServer(serverConfig, this.logger);
        
        // Event listeners
        server.on('connected', (serverId) => {
            this.stats.serversOnline++;
            this.broadcastServerStatus(serverId, 'connected');
            this.updateStats();
        });

        server.on('disconnected', (serverId) => {
            this.stats.serversOnline = Math.max(0, this.stats.serversOnline - 1);
            this.broadcastServerStatus(serverId, 'disconnected');
            this.updateStats();
        });

        server.on('chatMessage', (message) => {
            this.handleChatMessage(message);
        });

        server.on('playerListUpdated', (serverId, playerList) => {
            this.handlePlayerListUpdate(serverId, playerList);
        });

        this.servers.set(serverConfig.id, server);
        
        // Bağlantıyı başlat
        await server.connect();
    }

    handleChatMessage(message) {
        // Filtreleme uygula
        if (!this.isMessageAllowed(message)) {
            return;
        }

        // Chat geçmişine ekle
        this.chatHistory.push(message);
        this.stats.totalMessages++;

        // Maksimum mesaj sayısını kontrol et
        const maxMessages = this.config.chatHistory?.maxMessages || 1000;
        if (this.chatHistory.length > maxMessages) {
            this.chatHistory = this.chatHistory.slice(-maxMessages);
        }

        this.logger.info(`[${message.serverName}] ${message.playerName}: ${message.message}`);

        // Cross-server chat ayarlarını kontrol et
        const crossServerConfig = this.config.chatFormatting?.crossServerChat;
        
        // Mesajı diğer sunuculara ilet (hem web hem oyun içi mesajlar için)
        if (crossServerConfig?.enabled && crossServerConfig?.broadcastToGameServers) {
            // Oyun içi mesajları da iletmek istiyorsak veya web'den gelen mesajsa
            if (!crossServerConfig.excludeOwnMessages || !message.isFromGame) {
                this.broadcastMessage(message);
            }
        }

        // Web istemcilerine her zaman gönder (oyun içi + web mesajları)
        this.io.emit('newChatMessage', message);
    }

    isMessageAllowed(message) {
        // Maksimum uzunluk kontrolü
        const maxLength = this.config.filters?.maxMessageLength || 200;
        if (message.message.length > maxLength) {
            return false;
        }

        // Küfür filtresi
        if (this.config.filters?.enableProfanityFilter) {
            const blockedWords = this.config.filters.blockedWords || [];
            const messageWords = message.message.toLowerCase().split(' ');
            
            for (const word of blockedWords) {
                if (messageWords.includes(word.toLowerCase())) {
                    return false;
                }
            }
        }

        return true;
    }

    async broadcastMessage(originalMessage) {
        // Cross-server chat ayarlarını kontrol et
        const crossServerConfig = this.config.chatFormatting?.crossServerChat;
        if (!crossServerConfig?.enabled || !crossServerConfig?.broadcastToGameServers) {
            return;
        }

        // Oyun içinden gelen mesajları diğer sunuculara iletmeyi kontrol et
        if (originalMessage.isFromGame && crossServerConfig.excludeOwnMessages) {
            return;
        }

        // Tüm sunuculara (orijinal hariç) mesajı bot karakteri aracılığıyla gönder
        for (const [serverId, server] of this.servers) {
            if (serverId !== originalMessage.serverId && server.isConnected()) {
                try {
                    // Hedef sunucunun bot ayarlarını al
                    const targetServerConfig = this.config.servers.find(s => s.id === serverId);
                    if (!targetServerConfig?.crossServerBot?.enabled) {
                        continue;
                    }

                    const botConfig = targetServerConfig.crossServerBot;
                    
                    // Mesaj formatını oluştur
                    let formattedMessage = crossServerConfig.messageFormat || "{prefix} {playerName}: {message}";
                    formattedMessage = formattedMessage
                        .replace('{prefix}', botConfig.messagePrefix || '🌍')
                        .replace('{playerName}', originalMessage.playerName)
                        .replace('{message}', originalMessage.message)
                        .replace('{serverName}', originalMessage.serverName);

                    // Mesaj uzunluğunu kontrol et
                    const maxLength = crossServerConfig.maxMessageLength || 150;
                    if (formattedMessage.length > maxLength) {
                        formattedMessage = formattedMessage.substring(0, maxLength - 3) + '...';
                    }

                    // Bot karakteri olarak mesaj gönder
                    await server.sendChatMessage(formattedMessage, botConfig.botName);
                    
                    this.logger.debug(`Cross-server mesaj gönderildi: ${serverId} -> "${formattedMessage}"`);
                    
                } catch (error) {
                    this.logger.error(`${serverId} sunucusuna cross-server mesaj gönderilemedi:`, error.message);
                }
            }
        }
    }

    handlePlayerListUpdate(serverId, playerList) {
        // Toplam oyuncu sayısını güncelle
        let totalPlayers = 0;
        for (const [, server] of this.servers) {
            totalPlayers += server.playerList.length;
        }
        this.stats.totalPlayers = totalPlayers;

        // Web istemcilerine gönder
        this.io.emit('playerListUpdate', {
            serverId,
            players: playerList,
            totalPlayers: this.stats.totalPlayers
        });

        this.updateStats();
    }

    broadcastServerStatus(serverId, status) {
        this.io.emit('serverStatusChange', {
            serverId,
            status,
            timestamp: new Date()
        });
    }

    updateStats() {
        const stats = this.getStats();
        this.io.emit('statsUpdate', stats);
    }

    async sendAdminMessage(message, serverId = null) {
        const adminMessage = {
            id: `admin_${Date.now()}`,
            serverId: 'admin',
            serverName: 'ADMIN',
            playerName: 'ADMIN',
            message: message,
            timestamp: new Date(),
            time: moment().format('HH:mm:ss'),
            isFromGame: false // Web'den gelen mesaj işareti
        };

        if (serverId) {
            // Belirli bir sunucuya gönder
            const server = this.servers.get(serverId);
            if (server && server.isConnected()) {
                await server.sendChatMessage(message, 'ADMIN');
            }
        } else {
            // Tüm sunuculara gönder
            for (const [, server] of this.servers) {
                if (server.isConnected()) {
                    try {
                        await server.sendChatMessage(message, 'ADMIN');
                    } catch (error) {
                        this.logger.error('Admin mesajı gönderilemedi:', error.message);
                    }
                }
            }
        }

        // Chat geçmişine ekle ve web'e gönder
        this.chatHistory.push(adminMessage);
        this.io.emit('newChatMessage', adminMessage);
    }

    async executeCommand(serverId, command) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error('Sunucu bulunamadı');
        }

        if (!server.isConnected()) {
            throw new Error('Sunucu bağlı değil');
        }

        return await server.sendCommand(command);
    }

    getRecentMessages(limit = 50) {
        return this.chatHistory.slice(-limit);
    }

    getStats() {
        const serverStats = {};
        let totalPlayers = 0;
        
        for (const [serverId, server] of this.servers) {
            const stats = server.getStats();
            serverStats[serverId] = stats;
            totalPlayers += stats.playerCount || 0;
        }

        return {
            ...this.stats,
            totalPlayers,
            uptime: Date.now() - this.stats.uptime,
            servers: serverStats
        };
    }

    async stop() {
        this.logger.info('Ark Chat Manager durduruluyor...');
        
        // Kaydetme intervalini temizle
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }

        // Chat geçmişini kaydet
        this.saveChatHistory();

        // Tüm sunucu bağlantılarını kapat
        for (const [, server] of this.servers) {
            await server.disconnect();
        }

        this.servers.clear();
        this.logger.info('Ark Chat Manager durduruldu');
    }
}

module.exports = ArkChatManager;
