// Ana sayfa JavaScript
class ArkChatClient {
    constructor() {
        this.socket = io();
        this.autoScroll = true;
        this.isMobile = this.detectMobile();
        
        // Mobile-specific settings
        if (this.isMobile) {
            this.setupMobileFeatures();
        }
        
        // Initial data'yı yükle
        this.loadInitialData();
        
        this.initializeEventListeners();
        this.connectSocket();
    }

    detectMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupMobileFeatures() {
        // Prevent zoom on input focus (iOS)
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Add touch-friendly event listeners
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Mobile-specific CSS adjustments
        document.body.classList.add('mobile-device');
    }

    loadInitialData() {
        // Sayfa yüklendiğinde server'dan gelen initial data'yı kullan
        if (window.initialData) {
            const { servers, stats } = window.initialData;
            
            // Sunucu durumlarını ayarla (henüz socket bağlantısı yok, pending olarak göster)
            servers.forEach(server => {
                if (server.enabled) {
                    this.updateServerStatus(server.id, 'connecting');
                    // İlk oyuncu sayısını 0 olarak göster, gerçek veri gelince güncellenecek
                    this.updatePlayerCount(server.id, 0);
                }
            });
            
            // İstatistikleri güncelle
            if (stats) {
                this.updateStats(stats);
            }
        }
        
        // Chat geçmişini yükle
        this.loadChatHistory();
    }

    loadChatHistory() {
        fetch('/api/chat/history?limit=50')
            .then(response => response.json())
            .then(messages => {
                messages.forEach(message => {
                    this.addChatMessage(message, false);
                });
                this.scrollToBottom();
            })
            .catch(error => {
                console.error('Chat geçmişi yüklenirken hata:', error);
            });
    }

    initializeEventListeners() {
        // Otomatik kaydırma toggle - both mobile and desktop versions
        const setupAutoScrollToggle = (buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.autoScroll = !this.autoScroll;
                    const icon = button.querySelector('i');
                    
                    if (this.autoScroll) {
                        icon.className = this.isMobile ? 'fas fa-arrow-down' : 'fas fa-arrow-down me-1';
                        button.classList.remove('btn-outline-secondary');
                        button.classList.add('btn-blackguard');
                        this.scrollToBottom();
                    } else {
                        icon.className = this.isMobile ? 'fas fa-pause' : 'fas fa-pause me-1';
                        button.classList.remove('btn-blackguard');
                        button.classList.add('btn-outline-secondary');
                    }
                });
            }
        };
        
        setupAutoScrollToggle('auto-scroll-toggle');
        setupAutoScrollToggle('auto-scroll-toggle-desktop');

        // Chat temizleme - both mobile and desktop versions
        const setupClearChat = (buttonId) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.showConfirmModal(
                        'Chat Geçmişini Temizle',
                        'Tüm chat geçmişini temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
                        'danger',
                        () => {
                            document.getElementById('chat-messages').innerHTML = '';
                            this.showNotification('Chat geçmişi başarıyla temizlendi!', 'success');
                        }
                    );
                });
            }
        };
        
        setupClearChat('clear-chat');
        setupClearChat('clear-chat-desktop');

        // Message input handling
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');
        const charCount = document.getElementById('char-count');
        
        if (messageInput) {
            // Character counter
            messageInput.addEventListener('input', () => {
                if (charCount) {
                    charCount.textContent = messageInput.value.length;
                }
            });
            
            // Enter key to send (but allow Shift+Enter for new line)
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Mobile: Prevent zoom on focus
            if (this.isMobile) {
                messageInput.addEventListener('focus', () => {
                    messageInput.style.fontSize = '16px';
                });
            }
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Scroll event listener with mobile optimization
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            let scrollTimeout;
            chatContainer.addEventListener('scroll', () => {
                // Throttle scroll events on mobile
                if (this.isMobile && scrollTimeout) return;
                
                const isAtBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 5;
                this.autoScroll = isAtBottom;
                
                // Update both mobile and desktop buttons
                const updateButton = (buttonId) => {
                    const button = document.getElementById(buttonId);
                    if (button) {
                        const icon = button.querySelector('i');
                        if (this.autoScroll) {
                            icon.className = this.isMobile ? 'fas fa-arrow-down' : 'fas fa-arrow-down me-1';
                            button.classList.remove('btn-outline-secondary');
                            button.classList.add('btn-blackguard');
                        } else {
                            icon.className = this.isMobile ? 'fas fa-pause' : 'fas fa-pause me-1';
                            button.classList.remove('btn-blackguard');
                            button.classList.add('btn-outline-secondary');
                        }
                    }
                };
                
                updateButton('auto-scroll-toggle');
                updateButton('auto-scroll-toggle-desktop');
                
                if (this.isMobile) {
                    scrollTimeout = setTimeout(() => scrollTimeout = null, 100);
                }
            });
        }

        // Window resize handler for responsive behavior
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
            if (this.isMobile && !document.body.classList.contains('mobile-device')) {
                this.setupMobileFeatures();
            }
        });
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message) {
            // Emit message via socket (implement this based on your socket events)
            // this.socket.emit('sendMessage', { message });
            
            messageInput.value = '';
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = '0';
            
            // On mobile, briefly unfocus to hide keyboard
            if (this.isMobile) {
                messageInput.blur();
                setTimeout(() => messageInput.focus(), 100);
            }
        }
    }

    connectSocket() {
        this.socket.on('connect', () => {
            console.log('Socket.IO bağlantısı kuruldu');
            this.showNotification('Sunucuya bağlanıldı', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket.IO bağlantısı kesildi');
            this.showNotification('Sunucu bağlantısı kesildi', 'warning');
        });

        this.socket.on('newChatMessage', (message) => {
            this.addChatMessage(message, true);
        });

        this.socket.on('serverStatusChange', (data) => {
            this.updateServerStatus(data.serverId, data.status);
        });

        this.socket.on('statsUpdate', (stats) => {
            this.updateStats(stats);
        });

        this.socket.on('playerListUpdate', (data) => {
            this.updatePlayerCount(data.serverId, data.players.length);
            this.updateStats({ totalPlayers: data.totalPlayers });
        });
    }

    loadSocketChatHistory(messages) {
        // Socket'tan gelen chat history (deprecated, artık HTTP API kullanıyoruz)
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            this.addChatMessage(message, false);
        });
        
        this.scrollToBottom();
    }

    addChatMessage(message, isNew = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = this.createMessageElement(message);
        
        if (isNew) {
            messageElement.classList.add('new-message');
            setTimeout(() => {
                messageElement.classList.remove('new-message');
            }, 500);
        }
        
        chatMessages.appendChild(messageElement);
        
        if (this.autoScroll) {
            this.scrollToBottom();
        }
        
        // Sesli bildirim (opsiyonel)
        if (isNew && this.shouldPlaySound(message)) {
            this.playNotificationSound();
        }
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        // Mesaj türüne göre stil
        if (message.playerName === 'ADMIN') {
            messageDiv.classList.add('admin');
        } else if (message.serverName === 'GLOBAL' || message.message.includes('[GLOBAL]')) {
            messageDiv.classList.add('global');
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <div class="d-flex align-items-center">
                    <span class="message-player">${this.escapeHtml(message.playerName)}</span>
                    ${message.serverName !== 'ADMIN' ? `<span class="message-server">${this.escapeHtml(message.serverName)}</span>` : ''}
                </div>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message.message)}</div>
        `;
        
        return messageDiv;
    }

    updateServerStatus(serverId, status) {
        const statusElement = document.getElementById(`status-${serverId}`);
        const serverItem = document.querySelector(`[data-server-id="${serverId}"]`);
        
        if (statusElement) {
            statusElement.className = '';
            
            switch (status) {
                case 'connected':
                    statusElement.classList.add('server-status-online');
                    statusElement.innerHTML = '<i class="fas fa-circle"></i> Bağlı';
                    serverItem?.classList.add('connected');
                    serverItem?.classList.remove('disconnected');
                    break;
                case 'disconnected':
                    statusElement.classList.add('server-status-offline');
                    statusElement.innerHTML = '<i class="fas fa-circle"></i> Bağlantı Kesildi';
                    serverItem?.classList.add('disconnected');
                    serverItem?.classList.remove('connected');
                    this.updatePlayerCount(serverId, 0);
                    break;
                default:
                    statusElement.classList.add('badge', 'bg-warning', 'status-connecting');
                    statusElement.innerHTML = '<i class="fas fa-circle"></i> Bağlanıyor...';
                    break;
            }
        }
    }

    updatePlayerCount(serverId, count) {
        const playerElement = document.getElementById(`players-${serverId}`);
        if (playerElement) {
            playerElement.textContent = count;
        }
    }

    updateStats(stats) {
        // Toplam mesaj
        if (stats.totalMessages !== undefined) {
            document.getElementById('total-messages').textContent = stats.totalMessages.toLocaleString('tr-TR');
        }
        
        // Toplam oyuncu
        if (stats.totalPlayers !== undefined) {
            document.getElementById('total-players').textContent = stats.totalPlayers;
        }
        
        // Aktif sunucu
        if (stats.serversOnline !== undefined) {
            document.getElementById('servers-online').textContent = stats.serversOnline;
        }
        
        // Çalışma süresi
        if (stats.uptime !== undefined) {
            const uptime = this.formatUptime(stats.uptime);
            document.getElementById('uptime').textContent = uptime;
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}g ${hours % 24}s`;
        } else if (hours > 0) {
            return `${hours}s ${minutes % 60}d`;
        } else if (minutes > 0) {
            return `${minutes}d ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    shouldPlaySound(message) {
        // Admin mesajları veya önemli mesajlar için ses çal
        return message.playerName === 'ADMIN' || message.message.toLowerCase().includes('global');
    }

    playNotificationSound() {
        // Basit bir bildirim sesi (opsiyonel)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQgAC4=');
            audio.volume = 0.1;
            audio.play().catch(() => {
                // Ses çalınamazsa sessizce devam et
            });
        } catch (e) {
            // Ses çalınamazsa sessizce devam et
        }
    }

    showNotification(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-floating alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // 5 saniye sonra otomatik kapat
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.parentNode.removeChild(alertDiv);
                    }
                }, 150);
            }
        }, 5000);
    }

    showConfirmModal(title, message, type = 'warning', onConfirm = null) {
        // Eski modal varsa kaldır
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalId = 'confirmModal';
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark border-${type}">
                        <div class="modal-header border-${type}">
                            <h5 class="modal-title gradient-text">
                                <i class="fas fa-exclamation-triangle me-2"></i>${title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-light mb-0">${message}</p>
                        </div>
                        <div class="modal-footer border-${type}">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>İptal
                            </button>
                            <button type="button" class="btn btn-${type === 'danger' ? 'danger-blackguard' : 'blackguard'}" id="confirmButton">
                                <i class="fas fa-check me-1"></i>Onayla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById(modalId));
        const confirmButton = document.getElementById('confirmButton');

        confirmButton.addEventListener('click', () => {
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
            modal.hide();
        });

        // Modal kapandığında DOM'dan kaldır
        document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
            document.getElementById(modalId).remove();
        });

        modal.show();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.arkChatClient = new ArkChatClient();
});

// İstatistikleri periyodik olarak güncelle
setInterval(() => {
    fetch('/api/stats')
        .then(response => response.json())
        .then(stats => {
            if (window.arkChatClient) {
                window.arkChatClient.updateStats(stats);
            }
        })
        .catch(console.error);
}, 30000); // 30 saniyede bir
