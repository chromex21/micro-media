# 📱 Termux Setup Guide

Complete guide for running Lite Media Gallery on Android via Termux.

## Quick Start (5 Minutes)

```bash
# 1. Clone or pull the repo
cd ~/lite-media
git pull

# 2. Run Termux setup (first time only)
bash scripts/setup_termux.sh

# 3. Install Python dependencies (if not already installed)
pip install flask pillow

# 4. Start the app
python app.py
```

## Initial Setup

### 1. Install Termux & Requirements

```bash
# Update packages
pkg update && pkg upgrade

# Install required packages
pkg install python git

# Install Python packages
pip install flask pillow
```

### 2. Setup Android Storage Access

```bash
# Grant storage permission (popup will appear)
termux-setup-storage

# Verify access
ls ~/storage/shared/
```

### 3. Clone Repository

```bash
# Clone to home directory
cd ~
git clone <your-repo-url> lite-media
cd lite-media

# Or if already cloned, just pull
git pull
```

### 4. Run Termux Setup Script

```bash
# This sets up Android media access
bash scripts/setup_termux.sh
```

This script will:
- Verify Android storage access
- Create helpful info files in media folders
- Set up quick-access symlinks to Android folders
- Run integrity checks

## Adding Media Files (Easy Methods)

### Method 1: Direct Copy from Android Storage

```bash
# Copy photos from camera
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/

# Copy videos from movies folder
cp ~/storage/shared/Movies/*.mp4 media/videos/sd/

# Copy from downloads
cp ~/storage/shared/Download/*.mp4 media/videos/sd/
```

### Method 2: Use File Manager

1. Use Android file manager (Files app)
2. Navigate to: `Internal Storage/Android/data/com.termux/files/home/lite-media/media/`
3. Paste your photos into `images/full/`
4. Paste your videos into `videos/sd/`

### Method 3: Quick Access Symlinks

After running `setup_termux.sh`, use the quick-access folder:

```bash
# Navigate to quick access
cd ~/lite-media/android-access/

# See your Android media
ls dcim/
ls movies/
ls pictures/

# Copy easily
cp dcim/Camera/*.jpg ../media/images/full/
```

### Method 4: Direct Android Paths

The app can access Android media folders directly:

```bash
# Your media is already at:
~/storage/shared/DCIM/Camera/     # Phone camera
~/storage/shared/Pictures/         # Screenshots, etc
~/storage/shared/Movies/           # Video files
~/storage/shared/Download/         # Downloads
```

## Running the App

### Start Server

```bash
cd ~/lite-media
python app.py
```

You'll see:
```
🚀 LITE MEDIA GALLERY (ENHANCED)
============================================================
📁 Directory: /data/data/com.termux/files/home/lite-media
🌐 Server: http://0.0.0.0:8000
📱 Mobile: http://<your-ip>:8000
```

### Access the Gallery

**On the same phone:**
- Open browser
- Go to: `http://localhost:8000`

**From another device on same WiFi:**
1. Find your phone's IP address: `ifconfig` or check WiFi settings
2. Open browser on other device
3. Go to: `http://192.168.x.x:8000` (use your actual IP)

### Keep Server Running

```bash
# Install tmux for background running
pkg install tmux

# Start tmux session
tmux new -s media

# Run app
python app.py

# Detach: Press Ctrl+B, then D
# Reattach: tmux attach -t media
```

## Automatic Features

### 🔍 Integrity Check (Auto-Repair)

On boot, the app automatically:
1. Checks all required folders exist
2. Creates missing directories
3. Creates `.gitkeep` files for empty folders
4. Validates JSON files
5. Repairs any issues found

### 📁 Folder Structure (Auto-Created)

```
lite-media/
├── media/
│   ├── videos/
│   │   ├── sd/          ← Drop videos here
│   │   └── thumbs/      ← Auto-generated
│   └── images/
│       ├── full/        ← Drop images here
│       └── thumbs/      ← Auto-generated
├── data/
│   ├── media.json       ← Auto-generated catalog
│   └── boot_status.json ← Auto-updated
└── android-access/      ← Quick links (after setup)
    ├── dcim/
    ├── pictures/
    ├── movies/
    └── downloads/
```

### 🔄 Auto-Scan on Boot

When you start `python app.py`:
1. Integrity check runs
2. Media folders are scanned
3. New files are automatically added to catalog
4. Thumbnails are generated
5. System becomes ready

## Git Integration

### Why Some Folders Are Empty on Git

The `.gitignore` file excludes large media files to keep the repo small:

```
✅ Tracked by Git:
- All code files (.py, .js, .css, .html)
- Empty folder structure (.gitkeep files)
- Configuration files

❌ NOT tracked by Git:
- Your actual media files (videos/images)
- Generated thumbnails
- User-uploaded content
```

### After Pulling from Git

```bash
# Pull latest code
git pull

# Folders will be empty - add your media
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/

# Start app (auto-scans and adds new files)
python app.py
```

## Troubleshooting

### "Permission Denied" Errors

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/*.py
```

### "Module not found" Errors

```bash
# Install missing packages
pip install flask pillow

# Or install all requirements
pip install -r scripts/requirements.txt
```

### "Port already in use"

```bash
# Kill existing process
pkill -f "python app.py"

# Or use different port
python app.py --port 8080
```

### Folders Missing After Git Pull

```bash
# Run integrity check manually
python scripts/integrity_check.py --repair

# Or just start the app (auto-repairs)
python app.py
```

### Can't Access Android Storage

```bash
# Re-setup storage
termux-setup-storage

# Verify
ls ~/storage/shared/

# If still issues, check Android app permissions
# Settings > Apps > Termux > Permissions > Storage
```

## Advanced Usage

### Manual Integrity Check

```bash
# Check only (no repairs)
python scripts/integrity_check.py

# Check and repair automatically
python scripts/integrity_check.py --repair

# Save report to file
python scripts/integrity_check.py --repair --report integrity_report.txt
```

### Custom Port

```bash
# Use different port
python app.py --port 8080
```

### Admin Token

```bash
# Set admin token for security
export ADMIN_TOKEN="your-secret-token-here"
python app.py

# Token will be shown on startup
```

## Performance Tips

### For Better Performance

```bash
# Enable caching (default)
python app.py

# Disable caching if issues
python app.py --no-cache

# Disable file watching (saves battery)
python app.py --no-watch
```

### Battery Optimization

```bash
# Use Wake Lock to prevent sleep (optional)
pkg install termux-api
termux-wake-lock

# Release when done
termux-wake-unlock
```

## Updating

### Update App Code

```bash
cd ~/lite-media
git pull
python app.py
```

### Update Dependencies

```bash
pip install --upgrade flask pillow
```

## Need Help?

1. **Check logs**: The app prints detailed logs when running
2. **Run integrity check**: `python scripts/integrity_check.py`
3. **Restart app**: Stop with Ctrl+C, then `python app.py`
4. **Check permissions**: Ensure storage access is granted

## Summary of Key Commands

```bash
# Setup (first time)
bash scripts/setup_termux.sh

# Add media from Android
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/
cp ~/storage/shared/Movies/*.mp4 media/videos/sd/

# Start app
python app.py

# Access in browser
http://localhost:8000

# Keep running in background
tmux new -s media
python app.py
# Ctrl+B, then D to detach
```

That's it! Your gallery should now work seamlessly on Termux with easy media access. 🎉
