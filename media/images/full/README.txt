📷 DROP YOUR IMAGE FILES HERE
==============================

This folder is automatically scanned by Lite Media Gallery.

SUPPORTED FORMATS:
  • JPG / JPEG (recommended)
  • PNG
  • GIF
  • WebP
  • BMP

EASY WAYS TO ADD IMAGES:

FROM ANDROID (Termux):
  cp ~/storage/shared/DCIM/Camera/*.jpg .
  cp ~/storage/shared/Pictures/*.jpg .
  cp ~/storage/shared/Download/*.png .

FROM FILE MANAGER:
  1. Open Files app on Android
  2. Navigate to: Internal Storage/Android/data/com.termux/files/home/lite-media/media/images/full/
  3. Paste your image files here

AUTOMATIC PROCESSING:
  ✓ Thumbnails generated automatically
  ✓ Added to gallery on next boot
  ✓ No commands needed - just drop and go!

QUICK ACCESS (after running setup_termux.sh):
  cd ~/lite-media/android-access/
  ls dcim/Camera/
  cp dcim/Camera/*.jpg ~/lite-media/media/images/full/

TIP: The app auto-scans this folder when you run: python app.py
