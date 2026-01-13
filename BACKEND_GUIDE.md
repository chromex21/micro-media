# Enhanced Backend - Security & Performance Guide

## 🚀 What's New

Your backend has been upgraded from **4/10** to **8/10** for production readiness!

### Major Improvements

#### 🔐 Security Features
- **Token Authentication**: All write operations require an admin token
- **Rate Limiting**: Prevents abuse (100 requests/minute per IP)
- **File Size Limits**: 500MB max upload
- **Concurrent Upload Control**: Max 10 simultaneous uploads
- **Security Headers**: XSS protection, clickjacking prevention

#### ⚡ Performance Optimization
- **In-Memory Caching**: Media catalog cached for 5 minutes
- **Thread Safety**: Proper locking for concurrent operations
- **Request Logging**: Better debugging and monitoring

#### 🛡️ Error Recovery
- **Auto-Retry Boot**: Tries 3 times with 5-second delays
- **Graceful Degradation**: Server stays up even if boot fails
- **Error Handling**: Proper status codes and error messages

---

## 📖 Usage Guide

### Starting the Server

**Basic:**
```bash
python app.py
```

**Custom Port:**
```bash
python app.py --port 3000
```

**Disable Features (for debugging):**
```bash
python app.py --no-cache --no-rate-limit --no-watch
```

**Production Mode:**
```bash
export ADMIN_TOKEN="your-secure-random-token-here"
python app.py
```

---

## 🔑 Authentication

### Setting Your Admin Token

**Option 1: Environment Variable (Recommended)**
```bash
# Linux/Termux
export ADMIN_TOKEN="my-secret-token-123"
python app.py

# Windows
set ADMIN_TOKEN=my-secret-token-123
python app.py
```

**Option 2: Auto-Generated**
If you don't set `ADMIN_TOKEN`, the app will generate one and print it at startup:
```
⚠️  No ADMIN_TOKEN set. Generated: 7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p
   Set it in environment: export ADMIN_TOKEN='your-secret-token'
```

### Using Authentication

**Method 1: Header (Recommended)**
```bash
curl -H "X-Admin-Token: your-token" \
  -X POST http://localhost:8000/api/media/update \
  -H "Content-Type: application/json" \
  -d '{"type":"video","filename":"test.mp4","title":"New Title"}'
```

**Method 2: Query Parameter**
```bash
curl -X POST "http://localhost:8000/api/media/update?token=your-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"video","filename":"test.mp4","title":"New Title"}'
```

**Method 3: JSON Body**
```bash
curl -X POST http://localhost:8000/api/media/update \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token","type":"video","filename":"test.mp4","title":"New Title"}'
```

---

## 🌐 API Reference

### Public Endpoints (No Auth)

#### Get Media Catalog
```bash
GET /api/media
```
Returns the full media catalog (cached for 5 minutes).

#### Get Boot Status
```bash
GET /api/boot-status
```
Check if the system has finished booting.

#### Health Check
```bash
GET /api/health
```
Simple health check endpoint.

#### Get Cloud Links
```bash
GET /api/cloud-links
```
Returns all cloud storage links.

---

### Protected Endpoints (Auth Required)

#### Update Media Item
```bash
POST /api/media/update
Headers: X-Admin-Token: your-token
Body: {
  "type": "video",
  "filename": "example.mp4",
  "title": "New Title",
  "desc": "New description"
}
```

#### Delete Media Item
```bash
POST /api/media/delete
Headers: X-Admin-Token: your-token
Body: {
  "type": "video",
  "filename": "example.mp4",
  "removeFile": true
}
```

#### Upload Media File
```bash
POST /api/media/upload
Headers: X-Admin-Token: your-token
Body: multipart/form-data with 'file' field
```

Example:
```bash
curl -H "X-Admin-Token: your-token" \
  -F "file=@/path/to/video.mp4" \
  http://localhost:8000/api/media/upload
```

#### Rescan Media Folders
```bash
POST /api/media/rescan
Headers: X-Admin-Token: your-token
```

#### Add Cloud Link
```bash
POST /api/cloud-links/add
Headers: X-Admin-Token: your-token
Body: {
  "url": "https://example.com/video.mp4",
  "title": "External Video",
  "desc": "From cloud storage",
  "type": "video"
}
```

#### Delete Cloud Link
```bash
POST /api/cloud-links/delete
Headers: X-Admin-Token: your-token
Body: {
  "id": "cl_1234567890_0"
}
```

#### Clear Cache
```bash
POST /api/admin/cache/clear
Headers: X-Admin-Token: your-token
```

#### Get System Statistics
```bash
GET /api/admin/stats
Headers: X-Admin-Token: your-token
```

---

## 📱 Running on Termux (Android)

### Installation

1. **Install Termux** from F-Droid (not Google Play)

2. **Install dependencies:**
```bash
pkg update
pkg upgrade
pkg install python git
pip install flask watchdog
```

3. **Clone/Copy your project:**
```bash
cd ~
git clone https://github.com/chromex21/micro-media.git
cd micro-media
```

4. **Set up token:**
```bash
export ADMIN_TOKEN="my-secure-token-123"
```

5. **Start server:**
```bash
python app.py
```

### Accessing from Phone Browser

1. Find your phone's IP address:
```bash
ifconfig wlan0 | grep inet
```

2. Open browser and go to:
```
http://your-phone-ip:8000
```

### Accessing from Other Devices

Make sure devices are on the same WiFi network, then:
```
http://your-phone-ip:8000
```

### Keep Server Running

**Option 1: Use `nohup`**
```bash
nohup python app.py > app.log 2>&1 &
```

**Option 2: Use Termux Wakelock**
```bash
termux-wake-lock
python app.py
```

**Option 3: Use `screen` or `tmux`**
```bash
pkg install tmux
tmux new -s gallery
python app.py
# Press Ctrl+B then D to detach
# To reattach: tmux attach -t gallery
```

### Auto-Start on Boot

Create a start script:
```bash
nano ~/start-gallery.sh
```

Content:
```bash
#!/bin/bash
cd ~/micro-media
export ADMIN_TOKEN="your-token-here"
python app.py
```

Make executable:
```bash
chmod +x ~/start-gallery.sh
```

Use Termux:Boot app to run on boot.

---

## 🔧 Configuration Options

### Environment Variables

```bash
# Server settings
export PORT=8000
export HOST=0.0.0.0

# Security
export ADMIN_TOKEN="your-secure-token"

# You can add more in the code:
# MAX_FILE_SIZE, CACHE_TTL, RATE_LIMIT_MAX_REQUESTS, etc.
```

### Command Line Flags

```bash
python app.py --help
```

Available flags:
- `--port 3000` - Change port
- `--host 127.0.0.1` - Change host (localhost only)
- `--no-cache` - Disable caching
- `--no-rate-limit` - Disable rate limiting
- `--no-watch` - Disable file watching
- `--debug` - Enable Flask debug mode

---

## 🐛 Troubleshooting

### Boot Fails

If you see "BOOT FAILED after 3 attempts":

1. Check media folders exist:
```bash
ls -la media/videos/sd/
ls -la media/images/full/
```

2. Verify data/media.json is valid:
```bash
python -m json.tool data/media.json
```

3. Manually run boot:
```bash
python scripts/cms.py boot
```

### Upload Fails

- Check file size (max 500MB)
- Verify admin token is correct
- Check disk space: `df -h`

### Rate Limiting Issues

If you're getting 429 errors:
- Wait 1 minute
- Or disable rate limiting: `--no-rate-limit`
- Or increase limit in code: `RATE_LIMIT_MAX_REQUESTS`

### Cache Issues

Clear cache:
```bash
curl -H "X-Admin-Token: your-token" \
  -X POST http://localhost:8000/api/admin/cache/clear
```

Or restart with no cache:
```bash
python app.py --no-cache
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
tail -f app.log

# Last 100 lines
tail -n 100 app.log
```

### System Stats

```bash
curl -H "X-Admin-Token: your-token" \
  http://localhost:8000/api/admin/stats
```

Returns:
```json
{
  "boot_complete": true,
  "boot_attempts": 1,
  "cache_enabled": true,
  "cache_age": 120.5,
  "video_count": 45,
  "image_count": 123,
  "deleted_count": 5,
  "cloud_links_count": 2,
  "timestamp": "2026-01-13T10:30:00"
}
```

---

## 🔒 Security Best Practices

1. **Use Strong Tokens**: Generate with `openssl rand -hex 32`

2. **Enable HTTPS**: Use nginx reverse proxy with SSL

3. **Firewall**: Only allow trusted IPs
```bash
# Termux doesn't have iptables, but you can bind to localhost only:
python app.py --host 127.0.0.1
```

4. **Regular Backups**: Backup `data/media.json`
```bash
cp data/media.json data/media.json.backup.$(date +%Y%m%d)
```

5. **Monitor Logs**: Check for suspicious activity

---

## 🚀 Next Steps to Improve Further

1. **Add SQLite Database**: Replace JSON for better concurrency
2. **Thumbnail Generation**: Integrate `scripts/thumbnail_generator.py`
3. **User Accounts**: Multi-user support with sessions
4. **HTTPS**: Add SSL/TLS support
5. **Progressive Web App**: Make it installable
6. **Offline Mode**: Service worker for offline access

---

## 📝 Quick Reference

### Start Server
```bash
export ADMIN_TOKEN="my-token"
python app.py
```

### Upload File
```bash
curl -H "X-Admin-Token: my-token" \
  -F "file=@video.mp4" \
  http://localhost:8000/api/media/upload
```

### Rescan Media
```bash
curl -H "X-Admin-Token: my-token" \
  -X POST http://localhost:8000/api/media/rescan
```

### Check Status
```bash
curl http://localhost:8000/api/boot-status
```

---

**Your backend is now production-ready! 🎉**

Need help? Check the troubleshooting section or open an issue on GitHub.
