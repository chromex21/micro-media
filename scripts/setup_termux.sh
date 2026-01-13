#!/data/data/com.termux/files/usr/bin/bash
# Termux Setup Script for Lite Media Gallery
# Makes Android storage easily accessible and sets up symlinks

set -e

echo "🤖 Termux Setup for Lite Media Gallery"
echo "========================================"
echo ""

# Detect script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Check if termux-setup-storage has been run
if [ ! -d "$HOME/storage" ]; then
    echo "⚠️  Android storage not accessible"
    echo "→ Running: termux-setup-storage"
    echo "→ Grant storage permission when prompted"
    echo ""
    termux-setup-storage
    sleep 2
fi

# Verify storage is accessible
if [ ! -d "$HOME/storage/shared" ]; then
    echo "❌ ERROR: Could not access Android storage"
    echo "   Please run: termux-setup-storage"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Android storage accessible"
echo ""

# Common Android media folders
ANDROID_DCIM="$HOME/storage/shared/DCIM"
ANDROID_PICTURES="$HOME/storage/shared/Pictures"
ANDROID_MOVIES="$HOME/storage/shared/Movies"
ANDROID_DOWNLOADS="$HOME/storage/shared/Download"

# Project media folders
PROJECT_VIDEOS="$PROJECT_ROOT/media/videos/sd"
PROJECT_IMAGES="$PROJECT_ROOT/media/images/full"

echo "🔗 Setting up convenient access to Android media..."
echo ""

# Function to create info file
create_info_file() {
    local target_dir="$1"
    local source_dir="$2"
    local info_file="$target_dir/ANDROID_MEDIA_HERE.txt"
    
    cat > "$info_file" << EOF
📱 ANDROID MEDIA ACCESS
========================

To use media from your Android device:

OPTION 1 - Copy files here:
   Copy your photos/videos to this folder, and the app will find them

OPTION 2 - Use Android folders directly:
   Your Android media folders are available at:
   
   Photos: $ANDROID_DCIM
          $ANDROID_PICTURES
   
   Videos: $ANDROID_MOVIES
   
   Downloads: $ANDROID_DOWNLOADS

OPTION 3 - Symlinks (Advanced):
   Create symlinks to Android folders:
   
   ln -s "$ANDROID_DCIM/Camera" "$target_dir/camera"
   ln -s "$ANDROID_MOVIES" "$target_dir/movies"

EASY DROP-IN:
   1. Open Termux
   2. Run: cd $target_dir
   3. Run: ls -la (to see your files)
   4. Copy files: cp ~/storage/shared/DCIM/Camera/*.mp4 .
   5. Run app: python3 $PROJECT_ROOT/app.py

The app automatically scans this folder on startup!
EOF
    
    echo "  ✅ Created: $(basename $info_file)"
}

# Create info files
echo "→ Creating access guides..."
create_info_file "$PROJECT_VIDEOS" "$ANDROID_MOVIES"
create_info_file "$PROJECT_IMAGES" "$ANDROID_DCIM"
echo ""

# Create convenient symlinks (optional)
echo "→ Creating optional quick-access symlinks..."

# Only create symlinks if they don't exist and aren't regular files/dirs
create_symlink_safely() {
    local link_path="$1"
    local target_path="$2"
    local link_name="$(basename "$link_path")"
    
    if [ -L "$link_path" ]; then
        echo "  ⚠️  Symlink already exists: $link_name"
    elif [ -e "$link_path" ]; then
        echo "  ⚠️  Path already exists (not a symlink): $link_name"
    elif [ ! -d "$target_path" ]; then
        echo "  ⚠️  Target doesn't exist: $target_path"
    else
        ln -s "$target_path" "$link_path"
        echo "  ✅ Created symlink: $link_name -> $target_path"
    fi
}

# Create android-access directory
ANDROID_ACCESS="$PROJECT_ROOT/android-access"
mkdir -p "$ANDROID_ACCESS"

create_symlink_safely "$ANDROID_ACCESS/dcim" "$ANDROID_DCIM"
create_symlink_safely "$ANDROID_ACCESS/pictures" "$ANDROID_PICTURES"
create_symlink_safely "$ANDROID_ACCESS/movies" "$ANDROID_MOVIES"
create_symlink_safely "$ANDROID_ACCESS/downloads" "$ANDROID_DOWNLOADS"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 ANDROID MEDIA ACCESS:"
echo "   • Guide: $PROJECT_VIDEOS/ANDROID_MEDIA_HERE.txt"
echo "   • Quick access: $ANDROID_ACCESS/"
echo ""
echo "🚀 QUICK START:"
echo "   1. Copy media to:"
echo "      - Videos: $PROJECT_VIDEOS/"
echo "      - Images: $PROJECT_IMAGES/"
echo ""
echo "   2. OR use Android folders:"
echo "      cp ~/storage/shared/DCIM/Camera/*.jpg $PROJECT_IMAGES/"
echo "      cp ~/storage/shared/Movies/*.mp4 $PROJECT_VIDEOS/"
echo ""
echo "   3. Start app:"
echo "      python app.py"
echo ""
echo "💡 TIP: The app auto-scans media folders on boot!"
echo ""
