# 🤖 Complete Automation Guide

**Zero-Touch Media Gallery Automation**

This guide sets up a fully automated workflow where everything runs automatically from RSS feeds to your Termux deployment.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Local Setup (Laptop)](#local-setup-laptop)
3. [Termux Setup (Auto-Pull)](#termux-setup-auto-pull)
4. [RSS Feed Configuration](#rss-feed-configuration)
5. [Running Automation](#running-automation)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### The Complete Workflow

```
┌─────────────────┐
│   RSS Feeds     │  YouTube, Blogs, News
└────────┬────────┘
         │
         ↓ (auto-import every hour)
┌─────────────────┐
│  Local Laptop   │  Development & Content Hub
│                 │
│  1. Import RSS  │  ← Automatic
│  2. Scan Local  │  ← Automatic
│  3. Track Avail │  ← Automatic
│  4. Git Push    │  ← Automatic
└────────┬────────┘
         │
         ↓ (git push)
┌─────────────────┐
│    GitHub       │  Central Repository
└────────┬────────┘
         │
         ↓ (auto-pull every 30 min)
┌─────────────────┐
│  Termux Phone   │  Public-Facing Gallery
│                 │
│  1. Git Pull    │  ← Automatic
│  2. Boot Scan   │  ← Automatic
│  3. Restart App │  ← Automatic
└─────────────────┘
```

### What Gets Automated

✅ **RSS content import** - New videos/links pulled automatically  
✅ **Local media scanning** - New files indexed automatically  
✅ **Availability tracking** - System knows what's local/online  
✅ **Git operations** - Auto-commit and push changes  
✅ **Termux deployment** - Auto-pull and restart on phone  
✅ **Feed generation** - Gallery feed always up to date  

---

## 💻 Local Setup (Laptop)

### 1. Install Dependencies

```bash
cd ~/lite-media  # or your repo path

# Install Python packages
pip install -r scripts/requirements.txt

# Or install manually
pip install flask pillow requests watchdog
```

### 2. Configure RSS Feeds

```bash
# Add your first RSS feed
python scripts/rss_importer.py add \
  --name "Tech Blog" \
  --url "https://example.com/feed.xml"

# Add YouTube channel
python scripts/rss_importer.py add \
  --name "My Channel" \
  --url "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxx"

# List configured feeds
python scripts/rss_importer.py list
```

**RSS Feed Examples:**
- YouTube: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- WordPress: `https://site.com/feed/`
- Medium: `https://medium.com/feed/@username`
- Reddit: `https://www.reddit.com/r/subreddit/.rss`

### 3. Test Full Automation

```bash
# Run complete automation cycle once
python scripts/master_orchestrator.py full

# This will:
# - Import from all RSS feeds
# - Scan local media
# - Track availability
# - Commit to Git
# - Push to GitHub
```

### 4. Set Up Scheduled Automation

#### Option A: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour):
0 * * * * cd ~/lite-media && python3 scripts/master_orchestrator.py scheduled >> logs/cron.log 2>&1
```

#### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create new task
3. Trigger: Daily, repeat every 1 hour
4. Action: Run `python scripts/master_orchestrator.py scheduled`
5. Start in: `C:\path\to\lite-media`

#### Option C: systemd Service (Linux)

Create `/etc/systemd/system/lite-media-auto.service`:

```ini
[Unit]
Description=Lite Media Automation
After=network.target

[Service]
Type=oneshot
User=youruser
WorkingDirectory=/home/youruser/lite-media
ExecStart=/usr/bin/python3 scripts/master_orchestrator.py scheduled

[Install]
WantedBy=multi-user.target
```

Create timer `/etc/systemd/system/lite-media-auto.timer`:

```ini
[Unit]
Description=Run Lite Media Automation Hourly

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl enable lite-media-auto.timer
sudo systemctl start lite-media-auto.timer
```

---

## 📱 Termux Setup (Auto-Pull)

### 1. Install Required Packages

```bash
# Update packages
pkg update && pkg upgrade -y

# Install dependencies
pkg install python git termux-services

# Install Python packages
pip install flask pillow
```

### 2. Clone Repository

```bash
# Clone to home directory
cd ~
git clone https://github.com/yourusername/lite-media.git
cd lite-media
```

### 3. Set Up Auto-Pull Service

#### Method 1: Termux Job Scheduler (Recommended)

```bash
# Make script executable
chmod +x scripts/termux_auto_pull.sh

# Schedule to run every 30 minutes (1800000 ms)
termux-job-scheduler \
  -s scripts/termux_auto_pull.sh \
  --period-ms 1800000 \
  --persisted true

# Verify job
termux-job-scheduler -p
```

#### Method 2: Cron Service

```bash
# Install cronie
pkg install cronie

# Enable cron service
sv-enable crond

# Edit crontab
crontab -e

# Add this line (runs every 30 min):
*/30 * * * * cd ~/lite-media && bash scripts/termux_auto_pull.sh
```

### 4. Start Gallery Server

```bash
# Start app
python app.py

# Or run in background
nohup python app.py > logs/app.log 2>&1 &

# Access at:
# http://localhost:8000
```

### 5. Keep App Running (Optional)

Create Termux service:

```bash
# Create service directory
mkdir -p ~/.termux/boot

# Create startup script
cat > ~/.termux/boot/start-gallery.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/lite-media
python app.py > logs/boot.log 2>&1 &
EOF

# Make executable
chmod +x ~/.termux/boot/start-gallery.sh
```

---

## 📡 RSS Feed Configuration

### Adding Feeds via Python

```bash
# Add feed
python scripts/rss_importer.py add \
  --name "Feed Name" \
  --url "https://example.com/feed.xml"

# Import from all feeds
python scripts/rss_importer.py import-all --max-items 10

# Import from specific feed
python scripts/rss_importer.py import --feed-id feed_12345

# List all feeds
python scripts/rss_importer.py list

# Remove feed
python scripts/rss_importer.py remove --feed-id feed_12345
```

### Feed Configuration File

Edit `data/rss_feeds.json` manually:

```json
[
  {
    "id": "feed_tech",
    "name": "Tech News",
    "url": "https://example.com/tech/feed.xml",
    "active": true,
    "last_sync": null,
    "item_count": 0
  },
  {
    "id": "feed_youtube",
    "name": "My YouTube",
    "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxx",
    "active": true,
    "last_sync": null,
    "item_count": 0
  }
]
```

---

## 🚀 Running Automation

### One-Time Full Sync

```bash
# Complete automation cycle
python scripts/master_orchestrator.py full
```

**This runs:**
1. RSS import (all active feeds)
2. Local media scan
3. Availability tracking
4. Git commit & push
5. Termux deployment trigger

### Quick Sync (Faster)

```bash
# Just RSS + Git push (no full scan)
python scripts/master_orchestrator.py quick
```

### Manual Operations

```bash
# Just import RSS feeds
python scripts/rss_importer.py import-all

# Just scan local media
python scripts/catalog_manager_v2.py boot

# Just track availability
python scripts/availability_tracker.py scan

# Just Git operations
python scripts/auto_deploy.py --git-only
```

---

## 📊 Monitoring

### Check Logs

```bash
# Automation log
tail -f automation.log

# Deployment log
tail -f deploy.log

# Cron log (if using cron)
tail -f logs/cron.log

# Termux auto-pull log
tail -f logs/auto-pull.log

# App log
tail -f logs/app.log
```

### Check Status

```bash
# RSS feed status
python scripts/rss_importer.py list

# Media availability
python scripts/availability_tracker.py scan

# Catalog stats
python scripts/catalog_manager_v2.py stats
```

### Verify Git Sync

```bash
# Check if local is up to date
git status

# Check last commit
git log -1

# Check remote status
git fetch origin
git status
```

### Monitor Termux Auto-Pull

```bash
# On Termux, check job scheduler
termux-job-scheduler -p

# Check auto-pull log
cat logs/auto-pull.log

# Check if app is running
pgrep -f "python.*app.py"
```

---

## 🐛 Troubleshooting

### RSS Import Issues

**Problem:** Feeds not importing

```bash
# Test individual feed
python scripts/rss_importer.py import --feed-id feed_xxxxx

# Check feed URL directly
curl -I "https://example.com/feed.xml"

# Enable verbose logging
python scripts/rss_importer.py import-all --max-items 1
```

**Problem:** Duplicates appearing

The importer tracks imported URLs automatically. If duplicates appear:
```bash
# Clear import history (caution!)
rm data/import_log.json

# Re-import (will skip existing)
python scripts/rss_importer.py import-all
```

### Git Sync Issues

**Problem:** Git push fails

```bash
# Check remote configuration
git remote -v

# Fetch and check status
git fetch origin
git status

# Force sync (caution - overwrites)
git push origin main --force
```

**Problem:** Merge conflicts

```bash
# Reset to remote (caution - loses local changes)
git fetch origin
git reset --hard origin/main

# Or merge manually
git pull origin main
# Fix conflicts
git add .
git commit -m "Resolved conflicts"
git push origin main
```

### Termux Auto-Pull Issues

**Problem:** Termux not pulling updates

```bash
# Check job scheduler
termux-job-scheduler -p

# Run auto-pull manually
bash scripts/termux_auto_pull.sh

# Check logs
cat logs/auto-pull.log

# Verify Git access
git fetch origin
```

**Problem:** App not restarting

```bash
# Check if app is running
pgrep -f "python.*app.py"

# Kill and restart manually
pkill -f "python.*app.py"
python app.py &
```

### Automation Not Running

**Laptop (Cron):**
```bash
# Check cron service
sudo systemctl status cron

# Check crontab
crontab -l

# Check cron logs
grep CRON /var/log/syslog
```

**Termux (Job Scheduler):**
```bash
# List scheduled jobs
termux-job-scheduler -p

# Reschedule if needed
termux-job-scheduler -c  # Cancel all
# Then set up again
```

### Data Integrity Issues

```bash
# Run integrity check
python scripts/integrity_check.py --repair

# Verify JSON files
python -m json.tool data/media.json
python -m json.tool data/rss_feeds.json

# Rebuild from scratch
python scripts/catalog_manager_v2.py boot
```

---

## 🎛️ Configuration Options

### Environment Variables

```bash
# Termux deployment
export TOMEX_HOST="user@phone-ip"
export TOMEX_REPO_PATH="/data/data/com.termux/files/home/lite-media"

# App settings
export PORT=8000
export ADMIN_TOKEN="your-secret-token"
```

### Automation Settings

Edit `scripts/master_orchestrator.py` to customize:
- RSS import frequency
- Max items per feed
- Git commit messages
- Deployment triggers

### Feed Settings

Edit `data/rss_feeds.json`:
- Enable/disable feeds (`"active": true/false`)
- Adjust last sync times
- Add custom metadata

---

## 📈 Best Practices

### Development Workflow

1. **Work locally** on laptop
2. **Test changes** before committing
3. **Let automation handle deployment** to Termux
4. **Monitor logs** for issues

### Content Management

1. **Use RSS feeds** for automated content
2. **Drop local files** in media folders as needed
3. **Let system track** what's where
4. **Schedule downloads** of online-only content

### Maintenance

- **Check logs weekly** for errors
- **Update feeds** as sources change
- **Clean up old content** periodically
- **Verify Git sync** regularly

---

## 🎉 You're All Set!

Your gallery is now **fully automated**:

✅ RSS feeds auto-import hourly  
✅ Local media auto-scanned  
✅ Changes auto-committed to Git  
✅ Termux auto-pulls every 30 min  
✅ Gallery always up to date  

**No more manual work needed!** 🚀

---

## 📚 Quick Reference

### Key Commands

```bash
# Full automation
python scripts/master_orchestrator.py full

# Quick sync
python scripts/master_orchestrator.py quick

# Add RSS feed
python scripts/rss_importer.py add --name "Name" --url "URL"

# Check status
python scripts/availability_tracker.py scan
python scripts/rss_importer.py list

# Manual operations
python scripts/catalog_manager_v2.py boot
python scripts/auto_deploy.py
```

### Key Files

- `data/media.json` - Media catalog
- `data/rss_feeds.json` - RSS configuration
- `data/availability.json` - Content tracking
- `automation.log` - Automation log
- `logs/auto-pull.log` - Termux pull log

---

**Questions?** Check the other guides:
- [TERMUX_GUIDE.md](TERMUX_GUIDE.md) - Termux setup
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend details
- [README.md](README.md) - General usage
