# 🚀 Panduan Deployment Token Minting DApp

Panduan lengkap untuk deploy Token Minting DApp menggunakan Docker di VPS.

## 📋 Spesifikasi VPS yang Disarankan

### Minimum Requirements

- **CPU**: 2 vCPU
- **RAM**: 4GB
- **Storage**: 40GB SSD
- **Bandwidth**: 1TB/bulan
- **OS**: Ubuntu 20.04/22.04 LTS

### Recommended (Production)

- **CPU**: 4 vCPU
- **RAM**: 8GB
- **Storage**: 80GB SSD
- **Bandwidth**: 2TB/bulan
- **OS**: Ubuntu 22.04 LTS

### Provider VPS Rekomendasi

1. **DigitalOcean** - $24/bulan (4GB RAM, 2 vCPU)
2. **Vultr** - $20/bulan (4GB RAM, 2 vCPU)
3. **Linode** - $24/bulan (4GB RAM, 2 vCPU)
4. **Contabo** - €8.99/bulan (8GB RAM, 4 vCPU) - Budget option
5. **AWS EC2 t3.medium** - ~$30/bulan
6. **Google Cloud e2-medium** - ~$25/bulan

## 🛠️ Persiapan VPS

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout dan login kembali untuk apply group changes
exit
```

### 3. Install Utilities

```bash
sudo apt install -y git curl wget htop ufw fail2ban
```

### 4. Setup Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow aplikasi ports (optional untuk debugging)
sudo ufw allow 3001/tcp

# Check status
sudo ufw status
```

## 📁 Setup Project

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd <project-name>
```

### 2. Setup Environment Files

**Backend Environment (.env):**

```bash
cd server
cp .env.example .env
nano .env
```

Isi dengan:

```env
PORT=3001
BSC_RPC_URL=https://bsc-dataseed.binance.org
PRIVATE_KEY=your_64_character_private_key_here
MINT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**Frontend Environment (.env):**

```bash
cd ../client
cp .env.example .env
nano .env
```

Isi dengan:

```env
VITE_PROJECT_ID=your_reown_project_id_here
VITE_API_URL=https://your-domain.com/api
```

### 3. Upload Contract ABI

Pastikan file `MyToken.json` ada di `server/src/MyToken.json`

## 🐳 Docker Deployment

### 1. Build dan Run (Development)

```bash
# Kembali ke root directory
cd ..

# Build dan start semua services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 2. Production Deployment dengan SSL

```bash
# Start dengan nginx proxy
docker-compose --profile production up -d

# Check status
docker-compose ps
```

## 🔒 SSL Certificate Setup (Production)

### Option 1: Let's Encrypt (Gratis)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem

# Set permissions
sudo chown -R $USER:$USER ./ssl
```

### Option 2: Cloudflare (Recommended)

1. Add domain ke Cloudflare
2. Set DNS A record ke IP VPS
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

## 🔧 Konfigurasi Domain

### 1. DNS Settings

```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: Auto

Type: A
Name: www
Value: YOUR_VPS_IP
TTL: Auto
```

### 2. Update nginx.conf

```bash
nano nginx.conf
```

Ganti `your-domain.com` dengan domain Anda.

## 📊 Monitoring & Maintenance

### 1. Check Container Status

```bash
# Status semua containers
docker-compose ps

# Logs real-time
docker-compose logs -f

# Logs specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Resource Monitoring

```bash
# System resources
htop

# Docker stats
docker stats

# Disk usage
df -h
```

### 3. Backup Strategy

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"

mkdir -p $BACKUP_DIR

# Backup environment files
tar -czf $BACKUP_DIR/env_backup_$DATE.tar.gz server/.env client/.env

# Backup docker volumes (if any)
docker run --rm -v token-mint_node_modules_backend:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/volumes_backup_$DATE.tar.gz /data

echo "Backup completed: $DATE"
```

### 4. Auto-restart Setup

```bash
# Create systemd service
sudo nano /etc/systemd/system/token-mint.service
```

```ini
[Unit]
Description=Token Mint DApp
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/your/project
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable token-mint.service
sudo systemctl start token-mint.service
```

## 🔄 Update & Maintenance

### 1. Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d
```

### 2. Database Backup (jika ada)

```bash
# Backup volumes
docker-compose exec backend npm run backup
```

### 3. Log Rotation

```bash
# Setup logrotate
sudo nano /etc/logrotate.d/docker-containers
```

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

## 🚨 Troubleshooting

### Common Issues

**1. Container tidak start:**

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check disk space
df -h

# Check memory
free -h
```

**2. Port sudah digunakan:**

```bash
# Check what's using port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001

# Kill process if needed
sudo kill -9 <PID>
```

**3. Permission issues:**

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix docker permissions
sudo chmod 666 /var/run/docker.sock
```

**4. SSL Certificate issues:**

```bash
# Renew Let's Encrypt
sudo certbot renew

# Test SSL
openssl s_client -connect your-domain.com:443
```

**5. High memory usage:**

```bash
# Restart containers
docker-compose restart

# Clean unused images
docker system prune -a
```

## 📈 Performance Optimization

### 1. Docker Optimization

```bash
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 2. Nginx Caching

```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g
                 inactive=60m use_temp_path=off;

location /api/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    # ... other config
}
```

### 3. Database Optimization (jika ada)

```bash
# Optimize database
docker-compose exec db mysql -u root -p -e "OPTIMIZE TABLE your_table;"
```

## 🔐 Security Best Practices

### 1. Firewall Rules

```bash
# Only allow necessary ports
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban Configuration

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

### 3. Regular Updates

```bash
# Create update script
#!/bin/bash
sudo apt update && sudo apt upgrade -y
docker system prune -f
docker-compose pull
docker-compose up -d
```

## 📞 Support & Monitoring

### 1. Health Checks

```bash
# Check application health
curl http://localhost:3001/health
curl http://localhost/

# Check SSL
curl -I https://your-domain.com
```

### 2. Monitoring Setup

```bash
# Install monitoring tools
docker run -d --name=netdata -p 19999:19999 netdata/netdata

# Access monitoring
# http://your-domain.com:19999
```

### 3. Alerting (Optional)

Setup monitoring dengan tools seperti:

- **Uptime Robot** (gratis)
- **Pingdom**
- **New Relic**

## 💰 Estimasi Biaya Bulanan

### VPS Costs:

- **Budget**: $10-15/bulan (Contabo, Hetzner)
- **Standard**: $20-30/bulan (DigitalOcean, Vultr)
- **Premium**: $50+/bulan (AWS, GCP)

### Additional Costs:

- **Domain**: $10-15/tahun
- **SSL Certificate**: Gratis (Let's Encrypt) atau $50-100/tahun
- **Monitoring**: $0-20/bulan
- **Backup Storage**: $5-10/bulan

**Total estimasi**: $25-50/bulan untuk setup production yang solid.

---

## 🎯 Quick Start Commands

```bash
# 1. Setup VPS
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clone & Setup
git clone <repo>
cd <project>
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Deploy
docker-compose up -d

# 4. Check
docker-compose ps
curl http://localhost:3001/health
```

Selamat! Aplikasi Anda sekarang berjalan di production! 🎉

---

## 📚 Quick Reference

### Essential Commands

```bash
# Setup VPS (one-time)
curl -sSL https://raw.githubusercontent.com/your-repo/main/scripts/setup-vps.sh | bash

# Deploy application
./scripts/deploy.sh production

# Monitor system
./scripts/monitor.sh

# Backup data
./scripts/backup.sh

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull && ./scripts/deploy.sh production
```

### File Structure

```
token-mint-dapp/
├── client/                 # React frontend
│   ├── Dockerfile         # Frontend container
│   ├── nginx.conf         # Nginx config
│   └── .env              # Frontend environment
├── server/                # NestJS backend
│   ├── Dockerfile        # Backend container
│   ├── src/MyToken.json  # Contract ABI (required)
│   └── .env             # Backend environment
├── scripts/              # Deployment scripts
│   ├── setup-vps.sh     # VPS setup
│   ├── deploy.sh        # Deployment
│   ├── monitor.sh       # Monitoring
│   └── backup.sh        # Backup
├── docker-compose.yml    # Container orchestration
├── nginx.conf           # Production proxy
└── DEPLOYMENT.md        # This guide
```

### Environment Variables

**Backend (.env):**

```env
PORT=3001
BSC_RPC_URL=https://bsc-dataseed.binance.org
PRIVATE_KEY=your_64_character_private_key
MINT_CONTRACT_ADDRESS=0xYourContractAddress
```

**Frontend (.env):**

```env
VITE_PROJECT_ID=your_reown_project_id
VITE_API_URL=https://your-domain.com/api
```

### Port Configuration

- **80**: Frontend (HTTP)
- **443**: Frontend (HTTPS)
- **3001**: Backend API

### Useful Aliases

Add to `~/.bashrc`:

```bash
alias tmint='cd ~/token-mint-dapp'
alias dps='docker-compose ps'
alias dlogs='docker-compose logs -f'
alias dup='docker-compose up -d'
alias ddown='docker-compose down'
```

### Troubleshooting Checklist

1. ✅ Environment files configured?
2. ✅ MyToken.json exists in server/src/?
3. ✅ Domain DNS pointing to VPS IP?
4. ✅ Firewall ports 80/443 open?
5. ✅ SSL certificates valid?
6. ✅ Docker containers running?
7. ✅ Health checks passing?

### Performance Monitoring

```bash
# System resources
htop

# Container stats
docker stats

# Disk usage
df -h

# Network connections
netstat -tulpn

# Application logs
docker-compose logs --tail=100
```

### Security Checklist

- ✅ UFW firewall enabled
- ✅ Fail2ban configured
- ✅ SSH key authentication
- ✅ Regular security updates
- ✅ SSL/TLS certificates
- ✅ Environment variables secured
- ✅ Container user non-root

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
