# Lite Media Gallery - Folder Structure

```
lite-media/                                    # Project root
│
├── 📄 app.py                                 # Main Flask application (✅ Enhanced with integrity check)
├── 📄 index.html                             # Gallery home page
├── 📄 admin.html                             # Admin interface
├── 📄 files.html                             # File browser
├── 📄 links.html                             # Cloud links page
│
├── 📂 media/                                 # Media storage
│   ├── 📂 videos/
│   │   ├── 📂 sd/                           # ⬇️ DROP VIDEO FILES HERE
│   │   │   ├── .gitkeep                     # ✅ Keeps folder in Git
│   │   │   ├── README.txt                   # 📖 Usage instructions
│   │   │   └── *.mp4, *.webm, *.mov       # Your video files (Git ignored)
│   │   │
│   │   └── 📂 thumbs/                       # Auto-generated thumbnails
│   │       ├── .gitkeep                     # ✅ Keeps folder in Git
│   │       └── *.jpg                        # Video thumbnails (Git ignored)
│   │
│   └── 📂 images/
│       ├── 📂 full/                         # ⬇️ DROP IMAGE FILES HERE
│       │   ├── .gitkeep                     # ✅ Keeps folder in Git
│       │   ├── README.txt                   # 📖 Usage instructions
│       │   └── *.jpg, *.png, *.gif         # Your image files (Git ignored)
│       │
│       └── 📂 thumbs/                       # Auto-generated thumbnails
│           ├── .gitkeep                     # ✅ Keeps folder in Git
│           └── *.jpg                        # Image thumbnails (Git ignored)
│
├── 📂 data/                                  # App data
│   ├── media.json                           # Media catalog (auto-generated)
│   └── boot_status.json                     # Boot status tracking
│
├── 📂 scripts/                               # Python scripts
│   ├── cms.py                               # Content management system
│   ├── catalog_manager.py                   # Catalog management (legacy)
│   ├── catalog_manager_v2.py                # Catalog v2 (legacy)
│   ├── thumbnail_generator.py               # Thumbnail generation
│   ├── integrity_check.py                   # 🆕 System integrity checker
│   ├── setup_termux.sh                      # 🆕 Termux setup script
│   ├── server.py                            # Development server
│   ├── deploy.py                            # Deployment script
│   ├── requirements.txt                     # Python dependencies
│   └── README.md                            # Scripts documentation
│
├── 📂 css/                                   # Stylesheets
│   ├── base.css                             # Base styles
│   ├── boot.css                             # Boot screen styles
│   ├── theme.css                            # Theme variables
│   ├── layout.css                           # Layout styles
│   ├── gallery.css                          # Gallery grid
│   ├── interactions.css                     # Interactions (like, bookmark)
│   ├── search.css                           # Search interface
│   ├── file-upload.css                      # Upload interface
│   ├── file-preview.css                     # File preview modal
│   ├── files-view.css                       # Files view
│   ├── mobile-header.css                    # Mobile navigation
│   └── auth.css                             # Authentication UI
│
├── 📂 js/                                    # JavaScript modules
│   ├── boot.js                              # Boot sequence
│   ├── gallery.js                           # Gallery core
│   ├── interactions.js                      # Like/bookmark system
│   ├── search.js                            # Search functionality
│   ├── file-upload.js                       # File upload
│   ├── file-preview.js                      # File preview
│   ├── files-view-toggle.js                 # View switching
│   ├── content-sources.js                   # Content source management
│   ├── media-catalog.js                     # Catalog handling
│   ├── gallery-feed-enhancements.js         # Feed improvements
│   ├── gallery-interactions-helper.js       # Interaction helpers
│   ├── mobile-header.js                     # Mobile navigation
│   ├── pull-to-refresh.js                   # Pull-to-refresh
│   ├── storage-polyfill.js                  # Storage compatibility
│   ├── storage-events.js                    # Storage event handling
│   ├── custom-modal.js                      # Modal system
│   ├── ui-polish.js                         # UI improvements
│   ├── admin-gallery.js                     # Admin interface
│   ├── auth.js                              # Authentication
│   └── auth-fixed.js                        # Auth fixes
│
├── 📂 assets/                                # User assets
│   └── .gitkeep                             # ✅ Keeps folder in Git
│
├── 📂 docs/                                  # Documentation
│   └── 📂 archive/                          # Archived docs
│       └── .gitkeep                         # ✅ Keeps folder in Git
│
├── 📂 android-access/                        # 🆕 Quick Android access (created by setup)
│   ├── dcim -> ~/storage/shared/DCIM/       # Symlink to camera
│   ├── pictures -> ~/storage/shared/Pictures/
│   ├── movies -> ~/storage/shared/Movies/
│   └── downloads -> ~/storage/shared/Download/
│
├── 📄 .gitignore                            # 🆕 Git ignore rules
│
├── 📄 README.md                             # ✅ Main documentation (updated)
├── 📄 BACKEND_GUIDE.md                      # Backend architecture
├── 📄 UI_POLISH_COMPLETE.md                 # UI improvements
│
├── 📄 TERMUX_GUIDE.md                       # 🆕 Complete Termux guide
├── 📄 TERMUX_QUICK_REF.md                   # 🆕 Quick command reference
├── 📄 TERMUX_SETUP_CHECKLIST.md             # 🆕 Setup checklist
└── 📄 TERMUX_OPTIMIZATION.md                # 🆕 Optimization summary
```

## Legend

- 📂 = Directory
- 📄 = File
- 🆕 = Newly added for Termux optimization
- ✅ = Enhanced/Updated
- ⬇️ = User drop zone (add your files here)
- 📖 = User documentation

## Git Tracking

### ✅ Tracked by Git (Versioned)
```
✓ All code files (.py, .js, .css, .html)
✓ Empty folder structure (.gitkeep files)
✓ Documentation (.md, .txt)
✓ Configuration files
✓ Scripts and tools
```

### ❌ NOT Tracked by Git (Ignored)
```
✗ Media files (*.mp4, *.jpg, *.png, etc.)
✗ Generated thumbnails
✗ User-uploaded assets
✗ Python cache (__pycache__)
✗ Editor files (.vscode, .idea, *.swp)
```

## Key Improvements

1. **`.gitkeep` Files**: Ensures all folders exist after `git clone`
2. **`.gitignore`**: Properly excludes media while keeping structure
3. **README.txt**: In-folder guides for easy media drop-in
4. **android-access/**: Quick symlinks to Android storage
5. **Integrity Check**: Auto-repairs missing folders on boot

## Storage Usage Example

```
lite-media/                      Total: ~50KB (code only)
├── media/
│   ├── videos/sd/              + Your videos (e.g., 2GB)
│   ├── videos/thumbs/          + Auto-generated (e.g., 5MB)
│   ├── images/full/            + Your images (e.g., 500MB)
│   └── images/thumbs/          + Auto-generated (e.g., 2MB)
└── ...other files              ~50KB

Total with media: ~2.5GB (depends on your content)
Git repo size: ~50KB (media not included)
```

## Access Paths (Termux)

### Internal Project Paths
```bash
~/lite-media/                            # Project root
~/lite-media/media/videos/sd/            # Drop videos here
~/lite-media/media/images/full/          # Drop images here
```

### Android Storage Paths
```bash
~/storage/shared/DCIM/Camera/            # Phone camera
~/storage/shared/Pictures/               # Screenshots
~/storage/shared/Movies/                 # Video files
~/storage/shared/Download/               # Downloads
```

### Quick Access (After Setup)
```bash
~/lite-media/android-access/dcim/        # -> Camera
~/lite-media/android-access/movies/      # -> Videos
~/lite-media/android-access/pictures/    # -> Pictures
~/lite-media/android-access/downloads/   # -> Downloads
```

## Workflow Example

```bash
# 1. Start in project
cd ~/lite-media

# 2. Add media from Android
cp ~/storage/shared/DCIM/Camera/*.jpg media/images/full/
cp ~/storage/shared/Movies/*.mp4 media/videos/sd/

# 3. Start app (auto-scans and indexes)
python app.py

# 4. Access gallery
# Browser: http://localhost:8000
```

## Auto-Generated Content

These folders/files are automatically created/managed:

```
data/media.json                 # Created on first boot
data/boot_status.json           # Updated each boot
media/videos/thumbs/*.jpg       # Generated from videos
media/images/thumbs/*.jpg       # Generated from images
android-access/*                # Created by setup_termux.sh
```

## Clean Clone Behavior

```bash
# What you get after fresh clone:
git clone <repo>
cd lite-media
ls

# Result:
✓ All folders exist (thanks to .gitkeep)
✓ Code is ready to run
✓ Documentation is complete
✗ No media files (you add these)
✗ No generated content (created on boot)

# Run setup and you're ready!
bash scripts/setup_termux.sh
python app.py
```

---

**Last Updated**: January 13, 2026
**Structure Version**: 2.0 (Termux Optimized)
