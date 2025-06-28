FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production

# Uygulama dosyalarını kopyala
COPY . .

# Gerekli dizinleri oluştur
RUN mkdir -p logs data

# Port'u expose et
EXPOSE 3000

# Health check ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Kullanıcı oluştur (güvenlik için)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Dosya sahipliklerini ayarla
RUN chown -R nodejs:nodejs /app
USER nodejs

# Uygulamayı başlat
CMD ["node", "server.js"]
