# Quick Reference - Termux Commands

## Essential Commands

### Setup & Start
```bash
# First time setup
bash scripts/setup_termux.sh

# Start the app
python app.py

# Start in background (with tmux)
tmux new -s media
python app.py
# Ctrl+B, then D to detach
```

### Adding Media

```bash
# From Android camera
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/
cp ~/storage/shared/DCIM/Camera/*.mp4 media/videos/sd/

# From Android movies
cp ~/storage/shared/Movies/*.mp4 media/videos/sd/

# From downloads
cp ~/storage/shared/Download/*.mp4 media/videos/sd/
cp ~/storage/shared/Download/*.jpg media/images/full/

# From quick-access (after setup)
cd android-access
cp dcim/Camera/*.jpg ../media/images/full/
cp movies/*.mp4 ../media/videos/sd/
```

### Maintenance

```bash
# Update from git
git pull

# Check system integrity
python scripts/integrity_check.py

# Repair issues automatically
python scripts/integrity_check.py --repair

# View running processes
ps aux | grep python

# Kill app
pkill -f "python app.py"

# Check storage access
ls ~/storage/shared/
```

### File Management

```bash
# List media files
ls media/videos/sd/
ls media/images/full/

# Count files
ls media/videos/sd/ | wc -l
ls media/images/full/ | wc -l

# Check file sizes
du -h media/videos/sd/
du -h media/images/full/

# Remove specific file
rm media/videos/sd/filename.mp4
```

### Tmux (Background Running)

```bash
# Create new session
tmux new -s media

# Detach from session
# Press: Ctrl+B, then D

# List sessions
tmux ls

# Reattach to session
tmux attach -t media

# Kill session
tmux kill-session -t media
```

### Networking

```bash
# Find your IP address
ifconfig

# Check if port is in use
netstat -tuln | grep 8000

# Test if server is running
curl http://localhost:8000
```

### Logs & Debugging

```bash
# View app output
python app.py

# Check Python version
python --version

# Check installed packages
pip list

# View boot status
cat data/boot_status.json

# View media catalog
cat data/media.json | less
```

### Quick Fixes

```bash
# Permission denied for scripts
chmod +x scripts/*.sh
chmod +x scripts/*.py

# Module not found
pip install flask pillow

# Storage not accessible
termux-setup-storage

# Port already in use
pkill -f "python app.py"
python app.py --port 8080

# Folders missing
python scripts/integrity_check.py --repair
```

## Useful Paths

```bash
# Project root
~/lite-media/

# Media folders
~/lite-media/media/videos/sd/
~/lite-media/media/images/full/

# Android storage
~/storage/shared/DCIM/
~/storage/shared/Movies/
~/storage/shared/Pictures/
~/storage/shared/Download/

# Quick access (after setup)
~/lite-media/android-access/
```

## URLs

```bash
# Local access
http://localhost:8000

# Network access (find your IP first)
http://192.168.x.x:8000

# Admin page
http://localhost:8000/admin.html
```

## Package Management

```bash
# Update Termux packages
pkg update && pkg upgrade

# Install missing packages
pkg install python git

# Install Python packages
pip install flask pillow

# Install optional packages
pip install watchdog  # File watching
```

## Performance

```bash
# Start with options
python app.py --no-cache        # Disable caching
python app.py --no-watch        # Disable file watching
python app.py --port 8080       # Different port
python app.py --debug           # Debug mode

# Keep phone awake (optional)
pkg install termux-api
termux-wake-lock
# Release: termux-wake-unlock
```

## Backup & Restore

```bash
# Backup media catalog
cp data/media.json data/media.json.backup

# Backup entire project
cd ~
tar -czf lite-media-backup.tar.gz lite-media/

# Restore from backup
tar -xzf lite-media-backup.tar.gz
```

## Common Issues

```bash
# "No module named 'flask'"
pip install flask

# "Permission denied"
chmod +x scripts/*.sh

# "Address already in use"
pkill -f "python app.py"

# "Can't access storage"
termux-setup-storage

# "Folders missing"
python scripts/integrity_check.py --repair
```

## One-Liner Commands

```bash
# Setup, update, and start
git pull && bash scripts/setup_termux.sh && python app.py

# Copy all photos and videos
cp ~/storage/shared/DCIM/Camera/*.{jpg,mp4} media/videos/sd/ 2>/dev/null; cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/ 2>/dev/null

# Quick restart
pkill -f "python app.py" && python app.py

# Count total media
echo "Videos: $(ls media/videos/sd/*.{mp4,webm,mov,avi,mkv} 2>/dev/null | wc -l) | Images: $(ls media/images/full/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | wc -l)"
```

---

**Keep this file handy for quick reference!**
