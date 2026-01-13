# 🐍 Gallery Management Scripts

Python-based content management system for Lite Media Gallery

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Setup everything
python deploy.py setup

# Start development server
python server.py
```

---

## Scripts

### `catalog_manager.py` - Main CMS
Manages media catalog and metadata

```bash
# Scan for new media
python catalog_manager.py scan

# Add media
python catalog_manager.py add --video "file.mp4" --title "Title"

# Update metadata
python catalog_manager.py update --video "file.mp4" --title "New Title"

# Delete media
python catalog_manager.py delete --video "file.mp4"

# View stats
python catalog_manager.py stats
```

### `server.py` - Development Server
Local HTTP server with auto-reload

```bash
# Start server (default port 8000)
python server.py

# Custom port
python server.py --port 3000

# Disable file watching
python server.py --no-watch
```

### `thumbnail_generator.py` - Thumbnail Tool
Generate optimized thumbnails

```bash
# Generate all thumbnails
python thumbnail_generator.py --all

# Generate for specific file
python thumbnail_generator.py --video "path/to/video.mp4"
python thumbnail_generator.py --image "path/to/image.jpg"
```

### `deploy.py` - Quick Commands
Convenient shortcuts

```bash
# Initial setup
python deploy.py setup

# Deploy updates
python deploy.py deploy

# Scan media
python deploy.py scan

# Start server
python deploy.py server

# Clean up
python deploy.py clean
```

---

## Files Generated

- **`metadata.json`** - Media metadata and deleted items
- **`../js/media-catalog.js`** - Auto-generated JavaScript catalog

---

## Requirements

- Python 3.7+
- Pillow (for image processing)
- watchdog (optional, for file watching)
- ffmpeg (optional, for video thumbnails)

---

## Documentation

See `../PYTHON_CMS_GUIDE.md` for full documentation
