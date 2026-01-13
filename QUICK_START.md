# 🎯 Quick Start - Complete Automation

**Get your fully automated media gallery running in 5 minutes**

---

## 🚀 Laptop Setup (5 Commands)

```bash
# 1. Clone repository
git clone <your-repo-url> ~/lite-media
cd ~/lite-media

# 2. Run quick setup
python scripts/quick_setup.py

# 3. Add your first RSS feed (example)
python scripts/rss_importer.py add \
  --name "Tech News" \
  --url "https://example.com/feed.xml"

# 4. Test full automation
python scripts/master_orchestrator.py full

# 5. Set up hourly automation (choose one):

# Linux/Mac (cron):
echo "0 * * * * cd ~/lite-media && python3 scripts/master_orchestrator.py scheduled" | crontab -

# Or Windows (Task Scheduler):
# See COMPLETE_AUTOMATION_GUIDE.md for GUI setup
```

**That's it for laptop! ✅**

---

## 📱 Termux Setup (1 Command)

```bash
# On Termux, run this ONE command:
curl -O https://raw.githubusercontent.com/yourusername/lite-media/main/scripts/termux_complete_setup.sh
bash termux_complete_setup.sh
```

**That's it for Termux! ✅**

---

## 🎉 What You Get

### Fully Automated Workflow

```
RSS Feeds ──┐
YouTube ────┼──→ [Auto-Import] ──→ [Local Laptop] ──→ [Git Push]
APIs ───────┘         ↓                                     ↓
                 Every Hour                              GitHub
                                                            ↓
                                                      [Auto-Pull]
                                                            ↓
                                                    [Termux Gallery]
                                                            ↓
                                                     Every 30 min
```

### Zero Manual Work

✅ **RSS content** imported hourly  
✅ **Local media** scanned automatically  
✅ **Git sync** happens automatically  
✅ **Termux deploys** automatically  
✅ **Gallery stays** up to date  

---

## 📋 Verify It's Working

### On Laptop

```bash
# Check automation log
tail -f automation.log

# Check RSS feeds
python scripts/rss_importer.py list

# Force sync now
python scripts/master_orchestrator.py full
```

### On Termux

```bash
# Check auto-pull status
termux-job-scheduler -p

# Check auto-pull log
tail -f logs/auto-pull.log

# Check if app is running
pgrep -f "python.*app.py"

# Access gallery
curl http://localhost:8000
```

---

## 🎛️ Common Tasks

### Add RSS Feed

```bash
python scripts/rss_importer.py add \
  --name "Feed Name" \
  --url "https://example.com/feed.xml"
```

### Add Local Media

```bash
# Just drop files here:
media/videos/sd/your-video.mp4
media/images/full/your-image.jpg

# They'll be auto-indexed on next cycle (within 1 hour)
# Or force scan now:
python scripts/catalog_manager_v2.py boot
```

### Force Immediate Sync

```bash
# On laptop:
python scripts/master_orchestrator.py quick

# Changes will appear on Termux within 30 minutes
# Or force pull on Termux:
cd ~/lite-media
bash scripts/termux_auto_pull.sh
```

### Check What's Available

```bash
python scripts/availability_tracker.py scan
```

This shows:
- 💾 **Local**: Downloaded files
- 📅 **Scheduled**: Queued for download
- ☁️ **Online Only**: RSS imports, cloud links

---

## 📚 Need More Info?

**Complete guides:**
- [COMPLETE_AUTOMATION_GUIDE.md](COMPLETE_AUTOMATION_GUIDE.md) - Full setup & config
- [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md) - Visual workflow
- [TERMUX_GUIDE.md](TERMUX_GUIDE.md) - Termux details
- [README.md](README.md) - General usage

**Key commands:**

```bash
# Full automation cycle
python scripts/master_orchestrator.py full

# Quick sync (faster)
python scripts/master_orchestrator.py quick

# Scheduled run (for cron)
python scripts/master_orchestrator.py scheduled
```

---

## 🐛 Troubleshooting

### Automation not running?

```bash
# Check cron on Linux/Mac:
crontab -l

# Check Task Scheduler on Windows
# Or check systemd:
systemctl status lite-media-auto.timer

# Check logs:
tail -f automation.log
```

### Termux not pulling?

```bash
# Check job scheduler:
termux-job-scheduler -p

# Run manually:
bash scripts/termux_auto_pull.sh

# Check logs:
cat logs/auto-pull.log
```

### RSS not importing?

```bash
# List feeds:
python scripts/rss_importer.py list

# Test specific feed:
python scripts/rss_importer.py import --feed-id feed_xxxxx

# Check logs:
tail -f automation.log
```

---

## ✨ Pro Tips

1. **Start small**: Add 1-2 RSS feeds, test, then expand
2. **Monitor logs**: First few cycles, watch the logs
3. **Git often**: Automation pushes hourly, but you can push manually anytime
4. **Test locally**: Always test on laptop before relying on Termux auto-pull
5. **Keep it simple**: Don't over-configure, defaults work great

---

## 🎉 You're Done!

Your media gallery is now **fully automated**. Just:

1. Add RSS feeds when you find new sources
2. Drop media files in folders when you want
3. Everything else happens automatically

**No more manual deployments. Ever.** 🚀

---

**Questions?** Check the detailed guides or open an issue!
