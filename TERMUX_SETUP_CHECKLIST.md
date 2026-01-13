# 📱 Termux First-Time Setup Checklist

Follow these steps in order for a smooth setup:

## ☐ 1. Install Termux
- [ ] Install Termux from F-Droid (recommended) or Play Store
- [ ] Open Termux app

## ☐ 2. Update Packages
```bash
pkg update && pkg upgrade
```
- [ ] Confirm updates with 'y' when prompted
- [ ] Wait for updates to complete

## ☐ 3. Install Required Packages
```bash
pkg install python git
```
- [ ] Confirm installation
- [ ] Wait for completion

## ☐ 4. Grant Storage Access
```bash
termux-setup-storage
```
- [ ] Tap "Allow" when permission popup appears
- [ ] Verify: `ls ~/storage/shared/` should show folders

## ☐ 5. Clone Repository
```bash
cd ~
git clone <your-repo-url> lite-media
cd lite-media
```
- [ ] Replace `<your-repo-url>` with actual URL
- [ ] Verify: `ls` should show project files

## ☐ 6. Install Python Dependencies
```bash
pip install flask pillow
```
- [ ] Wait for installation
- [ ] No errors should appear

## ☐ 7. Run Termux Setup Script
```bash
bash scripts/setup_termux.sh
```
- [ ] Script should complete without errors
- [ ] Creates Android media access

## ☐ 8. Add Your Media (Choose One)

### Option A: Copy from Android Camera
```bash
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/
cp ~/storage/shared/DCIM/Camera/*.mp4 media/videos/sd/
```

### Option B: Copy from Android Movies
```bash
cp ~/storage/shared/Movies/*.mp4 media/videos/sd/
```

### Option C: Copy from Downloads
```bash
cp ~/storage/shared/Download/*.{jpg,mp4} media/videos/sd/
```

- [ ] At least some files copied successfully

## ☐ 9. Start the App
```bash
python app.py
```
- [ ] Server starts successfully
- [ ] No error messages appear
- [ ] Note the URL shown (usually `http://0.0.0.0:8000`)

## ☐ 10. Access Gallery

### On Same Phone:
- [ ] Open browser (Chrome, Firefox, etc.)
- [ ] Go to: `http://localhost:8000`
- [ ] Gallery loads and shows your media

### From Another Device (Same WiFi):
- [ ] Find your phone's IP: `ifconfig`
- [ ] Open browser on other device
- [ ] Go to: `http://YOUR_IP:8000`
- [ ] Gallery accessible from other device

## ☐ 11. Optional: Setup Background Running
```bash
# Install tmux
pkg install tmux

# Start in tmux
tmux new -s media
python app.py

# Detach: Ctrl+B, then D
# App keeps running in background
```
- [ ] Tmux installed
- [ ] App running in background
- [ ] Can detach and reattach

## ✅ Success Criteria

You're all set if you can:
- [x] Access gallery at `http://localhost:8000`
- [x] See your media files displayed
- [x] Navigate between videos and images
- [x] App stays running

## 🆘 Troubleshooting

### ❌ "Permission denied"
```bash
chmod +x scripts/*.sh
```

### ❌ "No module named 'flask'"
```bash
pip install flask pillow
```

### ❌ "Port already in use"
```bash
pkill -f "python app.py"
python app.py --port 8080
```

### ❌ "Can't access storage"
```bash
# Rerun storage setup
termux-setup-storage

# Check Android settings
# Settings > Apps > Termux > Permissions > Storage (Enable)
```

### ❌ "No media showing"
- Check files are in correct folders
- Run: `ls media/videos/sd/`
- Should see your video files
- Restart app if needed

## 📚 Next Steps

Once everything works:
- [ ] Read [TERMUX_GUIDE.md](TERMUX_GUIDE.md) for detailed features
- [ ] Check [TERMUX_QUICK_REF.md](TERMUX_QUICK_REF.md) for commands
- [ ] Explore admin features at `/admin.html`
- [ ] Add cloud links for online videos

## 🎯 Quick Commands Reference

```bash
# Start app
python app.py

# Add media from camera
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/

# Check what's running
ps aux | grep python

# Stop app
Ctrl+C (or pkill -f "python app.py")

# Update from git
git pull

# Check storage
ls ~/storage/shared/
```

## 💡 Tips

1. **Battery Life**: App uses minimal battery, but you can:
   ```bash
   python app.py --no-watch  # Disable file watching
   ```

2. **Keep Phone Awake** (optional):
   ```bash
   pkg install termux-api
   termux-wake-lock
   ```

3. **Background Running**: Use tmux to keep app running when you close Termux

4. **Easy Access**: Add bookmark in browser to `http://localhost:8000`

5. **Media Management**: Use Android file manager to move files to:
   - Internal Storage > Android > data > com.termux > files > home > lite-media > media

---

**Time Required**: ~10 minutes for full setup

**Estimated**: ⭐⭐⭐⭐⭐ Beginner-friendly

**Support**: If stuck, check the error message and search in TERMUX_GUIDE.md
