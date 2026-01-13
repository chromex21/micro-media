# 🚀 Simple Termux Setup - What You Actually Need

**No overcomplicated stuff. Just the essentials.**

---

## The Real Problems & Solutions

### ✅ Problem 1: Keep Termux App Updated from Laptop

**Solution:** Auto-pull from Git every 30 minutes

```bash
# Set up ONCE on Termux:
cd ~/lite-media
chmod +x scripts/termux_auto_pull.sh
termux-job-scheduler -s scripts/termux_auto_pull.sh --period-ms 1800000 --persisted true
```

**Done!** Now whenever you push from laptop, Termux pulls automatically within 30 min.

---

### ✅ Problem 2: Easy File Management on Android

**Solution:** Menu-driven interface - no commands to remember!

```bash
# On Termux, just run:
bash scripts/menu.sh
```

**This gives you a simple menu:**
```
[1] Set up Android drop folder  ← Creates /storage/emulated/0/LiteMedia/
[2] Import media from Android   ← One-click import
[3] Check drop folder status    
[4] Scan media folders
[5] View statistics
[6] Check Git status
[7] Pull from Git
[0] Exit
```

**How it works:**
1. Run option `[1]` - creates `LiteMedia` folder on your Android storage
2. Use your phone's file manager to put videos/photos in that folder
3. Run option `[2]` - imports everything automatically
4. Done! Files are in the app and catalog is updated

**No commands to remember!**

---

### ✅ Problem 3: RSS Auto-Import (Optional)

You already have this in the web interface! It's in `content-sources.js`.

**To use it:**
1. Open the gallery in browser
2. Go to Links page
3. Look for "Content Sources" section
4. Add RSS feeds there
5. Enable auto-sync

**Already built-in, no Python script needed.**

---

## Complete Termux Setup (5 Steps)

### 1. Initial Setup
```bash
# Install packages
pkg update && pkg upgrade -y
pkg install python git termux-services

# Install Python dependencies
pip install flask pillow

# Clone repo
git clone https://github.com/yourusername/lite-media.git ~/lite-media
cd ~/lite-media

# Set up Android storage access
termux-setup-storage
```

### 2. Set Up Auto-Pull
```bash
chmod +x scripts/termux_auto_pull.sh
termux-job-scheduler -s scripts/termux_auto_pull.sh --period-ms 1800000 --persisted true

# Verify it's scheduled
termux-job-scheduler -p
```

### 3. Set Up Easy File Management
```bash
chmod +x scripts/menu.sh

# Run the menu
bash scripts/menu.sh

# Choose option [1] to create drop folder
```

### 4. Start the App
```bash
python app.py
```

Access at: `http://localhost:8000`

### 5. Keep App Running (Optional)
```bash
# Create boot script
mkdir -p ~/.termux/boot
nano ~/.termux/boot/start-gallery.sh
```

Add this:
```bash
#!/data/data/com.termux/files/usr/bin/bash
sleep 10
cd ~/lite-media
python app.py > logs/app.log 2>&1 &
```

Make executable:
```bash
chmod +x ~/.termux/boot/start-gallery.sh
```

---

## Daily Workflow

### On Laptop (Development)
```bash
# Make changes
# When ready to deploy:
git add .
git commit -m "Updates"
git push origin main

# Termux will auto-pull within 30 min
```

### On Termux (Add Media)
```bash
# Easy way - use the menu:
bash scripts/menu.sh

# 1. Put files in Android's LiteMedia folder
# 2. Choose option [2] to import
# 3. Done!
```

### On Termux (Force Pull Now)
```bash
# Easy way - use the menu:
bash scripts/menu.sh
# Choose option [7]

# Or manual:
bash scripts/termux_auto_pull.sh
```

---

## Useful Aliases (Optional)

Add to `~/.bashrc`:
```bash
# Quick menu
alias lm='cd ~/lite-media && bash scripts/menu.sh'

# Start app
alias lm-start='cd ~/lite-media && python app.py'

# Check status
alias lm-status='cd ~/lite-media && python scripts/catalog_manager_v2.py stats'

# Force pull
alias lm-pull='cd ~/lite-media && bash scripts/termux_auto_pull.sh'
```

Then just type `lm` to open the menu!

---

## What Gets Automated

✅ **Git sync** - Pulls from GitHub every 30 min  
✅ **File import** - One menu option to import from Android  
✅ **Catalog update** - Happens automatically on import  
✅ **App restart** - Auto-restarts when Git pulls changes  

**No complex commands needed!**

---

## Files That Matter

```
~/lite-media/
├── scripts/
│   ├── menu.sh               ← Run this for easy menu
│   ├── termux_menu.py        ← The menu script
│   └── termux_auto_pull.sh   ← Auto-pull (scheduled)
├── app.py                    ← The gallery app
└── /storage/emulated/0/
    └── LiteMedia/            ← Your Android drop folder
```

---

## Troubleshooting

**Auto-pull not working?**
```bash
# Check if scheduled
termux-job-scheduler -p

# Check logs
cat ~/lite-media/logs/auto-pull.log

# Run manually
bash ~/lite-media/scripts/termux_auto_pull.sh
```

**Can't access Android storage?**
```bash
# Grant permission
termux-setup-storage

# Use the menu to set up drop folder
bash scripts/menu.sh  # Option [1]
```

**Import not working?**
```bash
# Use the menu to check status
bash scripts/menu.sh  # Option [3]

# Files should be in: /storage/emulated/0/LiteMedia/
```

---

## That's It!

**No overcomplicated Python scripts.**  
**No confusing command-line stuff.**  
**Just a simple menu and auto-sync.**

Run `bash scripts/menu.sh` and everything is there! 🎉
