// Admin panel JavaScript
class AdminPanel {
    constructor() {
        this.socket = io();
        this.initializeEventListeners();
        this.connectSocket();
    }

    initializeEventListeners() {
        // Admin mesaj formu
        document.getElementById('admin-message-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendAdminMessage();
        });

        // Komut formu
        document.getElementById('command-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeCommand();
        });
    }

    connectSocket() {
        this.socket.on('connect', () => {
            console.log('Admin panel bağlandı');
            this.showNotification('Admin paneline bağlanıldı', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Admin panel bağlantısı kesildi');
            this.showNotification('Admin panel bağlantısı kesildi', 'warning');
        });

        this.socket.on('chatHistory', (messages) => {
            this.loadChatHistory(messages);
        });

        this.socket.on('newChatMessage', (message) => {
            this.addChatMessage(message);
        });

        this.socket.on('serverStatusChange', (data) => {
            this.updateServerStatus(data.serverId, data.status);
        });

        this.socket.on('statsUpdate', (stats) => {
            this.updateStats(stats);
        });

        this.socket.on('adminSuccess', (data) => {
            this.showNotification(data.message, 'success');
        });

        this.socket.on('adminError', (data) => {
            this.showNotification(data.message, 'danger');
        });

        this.socket.on('commandResult', (data) => {
            this.showCommandResult(data);
        });

        this.socket.on('playerList', (data) => {
            this.showPlayerList(data);
        });
    }

    sendAdminMessage() {
        const messageInput = document.getElementById('admin-message');
        const serverSelect = document.getElementById('target-server');
        
        const message = messageInput.value.trim();
        const serverId = serverSelect.value || null;
        
        if (!message) {
            this.showNotification('Mesaj boş olamaz', 'warning');
            return;
        }

        fetch('/api/admin/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                serverId: serverId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Mesaj gönderildi', 'success');
                messageInput.value = '';
            } else {
                this.showNotification(data.error || 'Mesaj gönderilemedi', 'danger');
            }
        })
        .catch(error => {
            this.showNotification('Ağ hatası: ' + error.message, 'danger');
        });
    }

    executeCommand() {
        const commandInput = document.getElementById('command-input');
        const serverSelect = document.getElementById('command-server');
        
        const command = commandInput.value.trim();
        const serverId = serverSelect.value;
        
        if (!command || !serverId) {
            this.showNotification('Komut ve sunucu seçimi gerekli', 'warning');
            return;
        }

        fetch('/api/admin/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverId: serverId,
                command: command
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Komut çalıştırıldı', 'success');
                this.showCommandResult({
                    serverId: serverId,
                    command: command,
                    result: data.result
                });
                commandInput.value = '';
            } else {
                this.showNotification(data.error || 'Komut çalıştırılamadı', 'danger');
            }
        })
        .catch(error => {
            this.showNotification('Ağ hatası: ' + error.message, 'danger');
        });
    }

    showCommandResult(data) {
        const resultDiv = document.getElementById('command-result');
        const outputElement = document.getElementById('command-output');
        
        outputElement.textContent = `Server: ${data.serverId}\nCommand: ${data.command}\n\nResult:\n${data.result || 'Sonuç yok'}`;
        resultDiv.style.display = 'block';
        
        // Otomatik olarak sonuca scroll
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    loadChatHistory(messages) {
        const chatMessages = document.getElementById('admin-chat-messages');
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            this.addChatMessage(message);
        });
        
        this.scrollChatToBottom();
    }

    addChatMessage(message) {
        const chatMessages = document.getElementById('admin-chat-messages');
        const messageElement = this.createMessageElement(message);
        
        chatMessages.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message mb-2 p-2 border-start border-3';
        
        // Mesaj türüne göre stil
        if (message.playerName === 'ADMIN') {
            messageDiv.classList.add('border-danger', 'bg-light');
        } else {
            messageDiv.classList.add('border-primary');
        }
        
        const time = new Date(message.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${this.escapeHtml(message.playerName)}</strong>
                    ${message.serverName !== 'ADMIN' ? `<span class="badge bg-secondary ms-1">${this.escapeHtml(message.serverName)}</span>` : ''}
                </div>
                <small class="text-muted">${time}</small>
            </div>
            <div class="mt-1">${this.escapeHtml(message.message)}</div>
        `;
        
        return messageDiv;
    }

    updateServerStatus(serverId, status) {
        const statusElement = document.getElementById(`detail-status-${serverId}`);
        const serverDetail = document.querySelector(`[data-server-id="${serverId}"]`);
        
        if (statusElement) {
            statusElement.className = 'badge ms-1';
            
            switch (status) {
                case 'connected':
                    statusElement.classList.add('bg-success');
                    statusElement.textContent = 'Bağlı';
                    serverDetail?.classList.add('connected');
                    serverDetail?.classList.remove('disconnected');
                    break;
                case 'disconnected':
                    statusElement.classList.add('bg-danger');
                    statusElement.textContent = 'Bağlantı Kesildi';
                    serverDetail?.classList.add('disconnected');
                    serverDetail?.classList.remove('connected');
                    this.updatePlayerCount(serverId, 0);
                    break;
                default:
                    statusElement.classList.add('bg-warning', 'text-dark');
                    statusElement.textContent = 'Bağlanıyor...';
                    break;
            }
        }
    }

    updatePlayerCount(serverId, count) {
        const playerElement = document.getElementById(`detail-players-${serverId}`);
        if (playerElement) {
            playerElement.textContent = count;
        }
    }

    updateStats(stats) {
        // Admin panel istatistikleri güncelle
        if (stats.totalMessages !== undefined) {
            document.getElementById('admin-total-messages').textContent = stats.totalMessages.toLocaleString('tr-TR');
        }
        
        if (stats.totalPlayers !== undefined) {
            document.getElementById('admin-total-players').textContent = stats.totalPlayers;
        }
        
        if (stats.serversOnline !== undefined) {
            document.getElementById('admin-servers-online').textContent = stats.serversOnline;
        }
        
        if (stats.uptime !== undefined) {
            const uptime = this.formatUptime(stats.uptime);
            document.getElementById('admin-uptime').textContent = uptime;
        }

        // Sunucu detaylarını güncelle
        if (stats.servers) {
            Object.keys(stats.servers).forEach(serverId => {
                const serverStats = stats.servers[serverId];
                
                // Mesaj sayısı
                const messagesElement = document.getElementById(`detail-messages-${serverId}`);
                if (messagesElement) {
                    messagesElement.textContent = `${serverStats.messagesReceived || 0}/${serverStats.messagesSent || 0}`;
                }
                
                // Bağlantı denemeleri
                const attemptsElement = document.getElementById(`detail-attempts-${serverId}`);
                if (attemptsElement) {
                    attemptsElement.textContent = serverStats.connectionAttempts || 0;
                }
                
                // Oyuncu sayısı
                this.updatePlayerCount(serverId, serverStats.playerCount || 0);
            });
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
            return `${minutes}d`;
        } else {
            return `${seconds}s`;
        }
    }

    scrollChatToBottom() {
        const chatContainer = document.getElementById('admin-chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    showPlayerList(data) {
        const modal = new bootstrap.Modal(document.getElementById('playerListModal'));
        const content = document.getElementById('player-list-content');
        
        if (data.players && data.players.length > 0) {
            let html = '<div class="list-group list-group-flush">';
            
            data.players.forEach(player => {
                html += `
                    <div class="player-item">
                        <div>
                            <div class="player-name">${this.escapeHtml(player.name)}</div>
                            <div class="player-steam-id">Steam ID: ${player.steamId}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            content.innerHTML = html;
        } else {
            content.innerHTML = '<p class="text-center text-muted">Bu sunucuda aktif oyuncu yok.</p>';
        }
        
        modal.show();
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

// Global fonksiyonlar (butonlar için)
function getPlayerList(serverId) {
    if (window.adminPanel) {
        window.adminPanel.socket.emit('adminCommand', {
            type: 'getPlayerList',
            payload: { serverId }
        });
    }
}

function saveWorld(serverId) {
    if (window.adminPanel) {
        window.adminPanel.showConfirmModal(
            'Dünyayı Kaydet',
            'Sunucu dünyasını kaydetmek istediğinizden emin misiniz? Bu işlem sunucuda kısa bir donmaya neden olabilir.',
            'warning',
            () => {
                fetch('/api/admin/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        serverId: serverId,
                        command: 'SaveWorld'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.adminPanel.showNotification('Dünya başarıyla kaydedildi!', 'success');
                    } else {
                        window.adminPanel.showNotification(data.error || 'Dünya kaydedilemedi', 'danger');
                    }
                })
                .catch(error => {
                    window.adminPanel.showNotification('Ağ hatası: ' + error.message, 'danger');
                });
            }
        );
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// İstatistikleri periyodik olarak güncelle
setInterval(() => {
    fetch('/api/stats')
        .then(response => response.json())
        .then(stats => {
            if (window.adminPanel) {
                window.adminPanel.updateStats(stats);
            }
        })
        .catch(console.error);
}, 30000); // 30 saniyede bir
