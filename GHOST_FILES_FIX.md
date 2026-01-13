# 🚨 QUICK FIX GUIDE - Ghost Files & Termux Paths

## ✅ Ghost File Issue - FIXED

**What was wrong:**
- `data/media.json` had references to 4 videos and 3 images
- But `media/videos/sd/` and `media/images/full/` were empty
- App tried to load files that don't exist → errors

**What I did:**
- Cleared `data/media.json` to remove stale references
- Now it's clean with empty arrays

**What you need to do:**
```bash
# Re-scan your media folders to rebuild catalog
cd ~/lite-media
python scripts/catalog_manager_v2.py boot
```

---

## 📱 Termux Storage Path Configuration

### Problem
In Termux, you have two storage locations:
1. **App private storage**: `~/lite-media/media/` (currently empty)
2. **Android shared storage**: `~/storage/shared/DCIM/`, `~/storage/shared/Movies/`, etc. (where your actual files are)

The app was looking in the empty private storage, not finding anything.

### Solution Options

#### **Option 1: Copy Files (Recommended)**
Copy your Android media to the app folders, then scan:

```bash
# Copy photos
cp ~/storage/shared/DCIM/Camera/*.jpg ~/lite-media/media/images/full/

# Copy videos  
cp ~/storage/shared/Movies/*.mp4 ~/lite-media/media/videos/sd/

# Scan and rebuild catalog
cd ~/lite-media
python scripts/catalog_manager_v2.py boot
```

**Quick helper script:**
```bash
bash ~/lite-media/scripts/setup_termux_paths.sh
# Choose option 1, then run:
bash ~/lite-media/copy-media.sh
```

#### **Option 2: Point to Android Storage Directly (Advanced)**
Configure the app to scan Android folders directly:

```bash
# Run setup
bash ~/lite-media/scripts/setup_termux_paths.sh
# Choose option 2

# Then start app with:
bash ~/lite-media/run-termux.sh
```

This creates `.env` file that tells the app:
```bash
export MEDIA_ROOT=~/storage/shared
export VIDEOS_FOLDER=Movies
export IMAGES_FOLDER=DCIM/Camera
```

---

## 🔧 Manual Configuration (If You Want Full Control)

### Edit `scripts/config.py`
```python
# For Termux, set these environment variables before running:
export MEDIA_ROOT="$HOME/storage/shared"
export VIDEOS_FOLDER="Movies"
export IMAGES_FOLDER="DCIM/Camera"

# Then run:
python scripts/catalog_manager_v2.py boot
```

### Available Android Paths
- `~/storage/shared/DCIM/Camera/` - Phone camera photos
- `~/storage/shared/Pictures/` - Screenshots, saved images
- `~/storage/shared/Movies/` - Video files
- `~/storage/shared/Download/` - Downloaded files

---

## 📋 Verification Checklist

After fixing, verify everything works:

```bash
# 1. Check if media.json is clean
cat ~/lite-media/data/media.json
# Should show empty arrays: "videos": [], "images": []

# 2. Add some test media (choose one method above)

# 3. Run boot scan
cd ~/lite-media
python scripts/catalog_manager_v2.py boot

# 4. Check catalog was updated
cat ~/lite-media/data/media.json
# Should now show your media files

# 5. Start app
python app.py

# 6. Open in browser
# http://localhost:8000
# Should see your media!
```

---

## 🎯 Summary

**Ghost files:** ✅ Fixed - `media.json` cleared
**Termux paths:** ✅ Configurable - use setup script or copy files manually
**Next step:** Choose Option 1 or 2 above and run the commands

Need help? Check:
- `TERMUX_GUIDE.md` - Full Termux documentation
- `scripts/config.py` - Path configuration
- `scripts/setup_termux_paths.sh` - Interactive setup

---

## 💡 Pro Tips

1. **Quick media updates:**
   ```bash
   bash ~/lite-media/copy-media.sh  # If you chose Option 1
   ```

2. **Check what the app sees:**
   ```bash
   python scripts/catalog_manager_v2.py stats
   ```

3. **Clean rebuild:**
   ```bash
   rm ~/lite-media/data/media.json
   python scripts/catalog_manager_v2.py boot
   ```

4. **Background server:**
   ```bash
   pkg install tmux
   tmux new -s media
   python app.py
   # Ctrl+B then D to detach
   ```
