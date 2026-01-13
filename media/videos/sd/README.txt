📹 DROP YOUR VIDEO FILES HERE
==============================

This folder is automatically scanned by Lite Media Gallery.

SUPPORTED FORMATS:
  • MP4 (recommended)
  • WebM
  • MOV
  • AVI
  • MKV

EASY WAYS TO ADD VIDEOS:

FROM ANDROID (Termux):
  cp ~/storage/shared/Movies/*.mp4 .
  cp ~/storage/shared/DCIM/Camera/*.mp4 .
  cp ~/storage/shared/Download/*.mp4 .

FROM FILE MANAGER:
  1. Open Files app on Android
  2. Navigate to: Internal Storage/Android/data/com.termux/files/home/lite-media/media/videos/sd/
  3. Paste your video files here

AUTOMATIC PROCESSING:
  ✓ Thumbnails generated automatically
  ✓ Added to gallery on next boot
  ✓ No commands needed - just drop and go!

QUICK ACCESS (after running setup_termux.sh):
  cd ~/lite-media/android-access/
  ls movies/
  cp movies/*.mp4 ~/lite-media/media/videos/sd/

TIP: The app auto-scans this folder when you run: python app.py
