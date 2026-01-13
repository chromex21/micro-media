# Lite Media Gallery 🎬

A lightweight, self-hosted media gallery optimized for personal use with cloud link support.

## ✨ Features

- 📱 **Mobile-first design** - Perfect for viewing on phones
- 🎥 **Video & Image support** - MP4, WebM, JPG, PNG, GIF, and more
- ☁️ **Cloud integration** - Link videos from Google Drive, YouTube, etc.
- 🚀 **Fast & lightweight** - Runs smoothly on minimal hardware
- 🤖 **Termux support** - Run directly on Android via Termux
- 🔄 **Auto-sync** - Automatically scans and indexes new media
- 🎨 **Modern UI** - Clean, responsive interface
- 🔐 **Secure** - Token-based authentication for admin operations

## 📱 Run on Android (Termux)

Perfect for hosting your gallery directly on your phone!

```bash
# Quick start
git clone <repo-url> ~/lite-media
cd ~/lite-media
bash scripts/setup_termux.sh
python app.py
```

See **[TERMUX_GUIDE.md](TERMUX_GUIDE.md)** for complete setup instructions.

### Key Termux Features:
- ✅ Easy media drop-in from Android storage
- ✅ Auto-integrity checks and repairs
- ✅ Direct access to DCIM/Camera/Movies folders
- ✅ No complex Linux commands needed
- ✅ Git-friendly (empty folders stay in repo)

## 🚀 Quick Start (Desktop/Server)

### Requirements
- Python 3.8+
- Flask
- Pillow

### Installation

```bash
# Clone repository
git clone <repo-url>
cd lite-media

# Install dependencies
pip install flask pillow

# Run app
python app.py
```

The gallery will be available at `http://localhost:8000`

## 📁 Project Structure

```
lite-media/
├── app.py                    # Main Flask application
├── scripts/
│   ├── cms.py               # Content management system
│   ├── integrity_check.py   # Auto-repair system integrity
│   └── setup_termux.sh      # Termux setup script
├── media/
│   ├── videos/
│   │   ├── sd/              # Drop video files here
│   │   └── thumbs/          # Auto-generated thumbnails
│   └── images/
│       ├── full/            # Drop image files here
│       └── thumbs/          # Auto-generated thumbnails
├── data/
│   ├── media.json           # Media catalog (auto-generated)
│   └── boot_status.json     # Boot status tracking
├── css/                     # Stylesheets
├── js/                      # JavaScript modules
└── *.html                   # UI pages
```

## 🎯 Usage

### Adding Local Media

Simply drop your files into the media folders:
- Videos → `media/videos/sd/`
- Images → `media/images/full/`

The app will automatically scan and add them on next boot.

### Adding Cloud Links

1. Open the gallery
2. Click "Add Cloud Link"
3. Paste video URL (YouTube, Google Drive, etc.)
4. Add title and description
5. Done!

### Admin Operations

Admin operations require a token for security:

```bash
# Set token before starting
export ADMIN_TOKEN="your-secret-token"
python app.py

# Token is auto-generated if not set
# Check logs for the token
```

Admin features:
- Upload media
- Edit titles/descriptions
- Delete items
- Rescan media folders
- Add/remove cloud links

## 🔧 Configuration

### Command Line Options

```bash
python app.py --help

Options:
  --port PORT           Port to run server on (default: 8000)
  --host HOST           Host to bind to (default: 0.0.0.0)
  --no-watch           Disable file watching
  --no-cache           Disable caching
  --no-rate-limit      Disable rate limiting
  --debug              Enable debug mode
```

### Environment Variables

```bash
# Admin token for write operations
export ADMIN_TOKEN="your-secret-token"

# Server port
export PORT=8080

# Server host
export HOST="0.0.0.0"
```

## 🛠️ Advanced Features

### Automatic Integrity Checks

On boot, the system automatically:
- Verifies all required folders exist
- Creates missing directories
- Validates JSON files
- Repairs any issues found

Run manual check:
```bash
python scripts/integrity_check.py --repair
```

### File Watching

The app can watch media folders for changes and auto-update:
```bash
# Install watchdog for file watching
pip install watchdog

# Start with file watching (default)
python app.py
```

### Caching

Built-in caching improves performance:
- Media catalog cached in memory
- 5-minute TTL (default)
- Auto-invalidated on updates

### Rate Limiting

Protection against abuse:
- 100 requests per minute per IP
- Configurable limits
- Can be disabled with `--no-rate-limit`

## 📱 Mobile Access

### Same Device
```
http://localhost:8000
```

### Other Devices (Same WiFi)
```
http://<your-ip>:8000
```

Find your IP:
- Linux/Mac: `ifconfig`
- Windows: `ipconfig`
- Termux: `ifconfig`

## 🔒 Security

- Token-based authentication for admin operations
- Rate limiting to prevent abuse
- File size limits (500MB default)
- Secure filename handling
- Input validation

## 🐛 Troubleshooting

### Folders missing after Git clone
The app auto-creates them on boot. Or run:
```bash
python scripts/integrity_check.py --repair
```

### "Port already in use"
```bash
# Kill existing process
pkill -f "python app.py"

# Or use different port
python app.py --port 8080
```

### Media not showing up
```bash
# Trigger manual rescan
# Access admin page and click "Rescan Media"
# Or restart the app
```

### Termux-specific issues
See **[TERMUX_GUIDE.md](TERMUX_GUIDE.md)** for detailed troubleshooting.

## 📚 Documentation

- **[COMPLETE_AUTOMATION_GUIDE.md](COMPLETE_AUTOMATION_GUIDE.md)** - 🤖 Full automation setup
- **[WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md)** - 📊 Visual workflow overview
- **[TERMUX_GUIDE.md](TERMUX_GUIDE.md)** - Complete Termux setup guide
- **[BACKEND_GUIDE.md](BACKEND_GUIDE.md)** - Backend architecture
- **[UI_POLISH_COMPLETE.md](UI_POLISH_COMPLETE.md)** - UI improvements

## 🎨 UI Features

- Responsive grid layout
- Image lazy loading
- Video thumbnails
- Infinite scroll
- Pull-to-refresh
- Search functionality
- Dark mode support
- Mobile-optimized controls

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Credits

Built with:
- Flask (Python web framework)
- Pillow (Image processing)
- Modern vanilla JavaScript
- CSS Grid & Flexbox

---

**Need help?** Check the guides or open an issue!
