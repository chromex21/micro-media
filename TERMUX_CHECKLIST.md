# 📱 Termux Setup Checklist - Do This Now

## You've Already Done ✅
- [x] Installed Python
- [x] Installed Git  
- [x] Installed Flask & Pillow
- [x] Cloned the repo to Termux

---

## Step 1: Push from Laptop (DO THIS FIRST)

**On this laptop, run:**
```bash
python scripts/push_now.py
```

This will push all the new automation scripts to GitHub.

**Wait for it to complete before continuing on Termux!**

---

## Step 2: On Termux - Pull Latest Changes

```bash
cd ~/lite-media

# Pull the latest changes (including all new scripts)
git pull origin main
```

---

## Step 3: On Termux - Set Up Auto-Pull

```bash
# Make scripts executable
chmod +x scripts/termux_auto_pull.sh
chmod +x scripts/menu.sh

# Schedule auto-pull (runs every 30 min)
termux-job-scheduler -s scripts/termux_auto_pull.sh \
  --period-ms 1800000 \
  --persisted true

# Verify it's scheduled
termux-job-scheduler -p
```

**You should see output like:**
```
Job 0: scripts/termux_auto_pull.sh
  Periodic: 1800000ms
  Persisted: true
```

---

## Step 4: On Termux - Set Up Android Storage Access

```bash
# Grant storage permission (popup will appear)
termux-setup-storage

# After granting, verify
ls ~/storage/shared
```

**You should see your Android folders** (DCIM, Download, Movies, etc.)

---

## Step 5: On Termux - Set Up Drop Folder & Import

```bash
# Run the menu
bash scripts/menu.sh

# In the menu:
# Choose [1] - This creates /storage/emulated/0/LiteMedia/
# Choose [3] - Verify folder was created
```

---

## Step 6: On Termux - Start the App

```bash
# Make sure you're in the repo
cd ~/lite-media

# Run the app
python app.py
```

**You should see:**
```
 * Serving Flask app 'app'
 * Running on http://0.0.0.0:8000
```

---

## Step 7: Access the Gallery

**On your phone's browser, go to:**
```
http://localhost:8000
```

**Or from another device on same WiFi:**
```
http://[your-phone-ip]:8000
```

**To find your phone's IP:**
```bash
ifconfig
```
Look for `wlan0` section, find `inet` address.

---

## Step 8: Add Media (Optional)

### Method 1: Using Drop Folder (Easiest)
1. Open your Android file manager
2. Go to: **Internal Storage → LiteMedia**
3. Copy your videos/photos there
4. Go back to Termux
5. Run: `bash scripts/menu.sh`
6. Choose `[2]` - Import media
7. Done!

### Method 2: Direct Copy (Advanced)
```bash
# Copy from Android folders
cp ~/storage/shared/DCIM/Camera/*.jpg ~/lite-media/media/images/full/
cp ~/storage/shared/Movies/*.mp4 ~/lite-media/media/videos/sd/

# Scan for new files
python scripts/catalog_manager_v2.py boot
```

---

## Quick Commands Summary

```bash
# Start the app
cd ~/lite-media && python app.py

# Open menu (file management, import, etc.)
bash scripts/menu.sh

# Force pull from Git (don't wait for auto-pull)
bash scripts/termux_auto_pull.sh

# Check auto-pull status
termux-job-scheduler -p

# View logs
cat logs/auto-pull.log
cat logs/app.log
```

---

## Keep App Running on Boot (Optional)

```bash
# Create boot directory
mkdir -p ~/.termux/boot

# Create startup script
cat > ~/.termux/boot/start-gallery.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
sleep 10
cd ~/lite-media
python app.py > logs/app.log 2>&1 &
EOF

# Make executable
chmod +x ~/.termux/boot/start-gallery.sh
```

Now the app will auto-start when you open Termux!

---

## Verify Everything Works

✅ **Auto-pull is scheduled:**
```bash
termux-job-scheduler -p
```

✅ **App is running:**
```bash
pgrep -f "python.*app.py"
```

✅ **Can access gallery:**
```
Open browser: http://localhost:8000
```

✅ **Drop folder exists:**
```bash
ls /storage/emulated/0/LiteMedia
```

---

## Troubleshooting

**Can't pull from Git?**
```bash
cd ~/lite-media
git fetch origin
git reset --hard origin/main
```

**Auto-pull not scheduled?**
```bash
# Reschedule
termux-job-scheduler -c  # Cancel all
termux-job-scheduler -s scripts/termux_auto_pull.sh --period-ms 1800000 --persisted true
```

**App won't start?**
```bash
# Check for errors
cd ~/lite-media
python app.py

# If port in use
pkill -f "python.*app.py"
python app.py
```

**Storage access denied?**
```bash
termux-setup-storage
# Grant permission when popup appears
```

---

## You're Done! 🎉

**Normal workflow:**
1. On laptop: Make changes, run `python scripts/push_now.py`
2. On Termux: Wait 30 min (auto-pulls) OR run `bash scripts/termux_auto_pull.sh`
3. Add media: Use `bash scripts/menu.sh` → option [2]
4. Access: `http://localhost:8000`

**Simple!**
