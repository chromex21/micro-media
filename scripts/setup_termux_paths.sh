#!/usr/bin/env bash
# Termux Media Path Setup - Makes it easy to configure where media is stored

echo "======================================================================"
echo "📱 TERMUX MEDIA PATH CONFIGURATION"
echo "======================================================================"
echo ""

# Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    echo "   Run this on your Android device in Termux terminal"
    exit 1
fi

# Check storage access
if [ ! -d "$HOME/storage/shared" ]; then
    echo "⚠️  Storage access not granted"
    echo "   Running: termux-setup-storage"
    termux-setup-storage
    echo ""
    echo "📱 Please grant storage permission when prompted!"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Termux detected"
echo "✅ Storage access granted"
echo ""

# Show available Android storage locations
echo "📂 Available Android storage locations:"
echo ""

for path in "DCIM/Camera" "Pictures" "Movies" "Download"; do
    full_path="$HOME/storage/shared/$path"
    if [ -d "$full_path" ]; then
        count=$(find "$full_path" -maxdepth 1 -type f 2>/dev/null | wc -l)
        echo "   ✅ $path ($count files)"
    else
        echo "   ❌ $path (not found)"
    fi
done

echo ""
echo "======================================================================"
echo "CONFIGURATION OPTIONS"
echo "======================================================================"
echo ""
echo "Choose how you want to manage media:"
echo ""
echo "1. Copy files to app folders (RECOMMENDED)"
echo "   - Files are in: ~/lite-media/media/"
echo "   - Safe, git-friendly, portable"
echo "   - You manually copy files when needed"
echo ""
echo "2. Use Android folders directly (ADVANCED)"
echo "   - Files stay in Android storage"
echo "   - Auto-scan Camera/Movies folders"
echo "   - Requires configuring MEDIA_ROOT"
echo ""

read -p "Choose option (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "📋 Option 1: Copy files to app folders"
        echo ""
        echo "To add media, use these commands:"
        echo ""
        echo "# Copy photos from camera:"
        echo "cp ~/storage/shared/DCIM/Camera/*.jpg ~/lite-media/media/images/full/"
        echo ""
        echo "# Copy videos from movies:"
        echo "cp ~/storage/shared/Movies/*.mp4 ~/lite-media/media/videos/sd/"
        echo ""
        echo "# Then scan and update catalog:"
        echo "cd ~/lite-media"
        echo "python scripts/catalog_manager_v2.py boot"
        echo ""
        
        # Create helper script
        cat > ~/lite-media/copy-media.sh << 'EOF'
#!/usr/bin/env bash
# Helper script to copy media from Android storage

echo "Copying media from Android storage..."

# Copy images
if [ -d "$HOME/storage/shared/DCIM/Camera" ]; then
    cp -v "$HOME/storage/shared/DCIM/Camera"/*.{jpg,jpeg,png} ~/lite-media/media/images/full/ 2>/dev/null
    echo "✅ Images copied"
fi

# Copy videos
if [ -d "$HOME/storage/shared/Movies" ]; then
    cp -v "$HOME/storage/shared/Movies"/*.{mp4,mov} ~/lite-media/media/videos/sd/ 2>/dev/null
    echo "✅ Videos copied"
fi

# Scan and update catalog
echo ""
echo "Scanning media..."
cd ~/lite-media
python scripts/catalog_manager_v2.py boot

echo ""
echo "✅ Done! Media updated and catalog rebuilt"
EOF
        
        chmod +x ~/lite-media/copy-media.sh
        
        echo "✅ Created helper script: ~/lite-media/copy-media.sh"
        echo ""
        echo "To copy all your media and update catalog, just run:"
        echo "   bash ~/lite-media/copy-media.sh"
        ;;
        
    2)
        echo ""
        echo "📋 Option 2: Use Android folders directly"
        echo ""
        echo "This will configure the app to scan Android storage directly."
        echo ""
        
        # Create environment config
        cat > ~/lite-media/.env << 'EOF'
# Termux/Android storage configuration
# The app will scan these folders directly

export MEDIA_ROOT=~/storage/shared
export VIDEOS_FOLDER=Movies
export IMAGES_FOLDER=DCIM/Camera

# Load this with: source .env
EOF
        
        # Create run script
        cat > ~/lite-media/run-termux.sh << 'EOF'
#!/usr/bin/env bash
# Run app with Android storage paths

cd ~/lite-media

# Load configuration
source .env

echo "======================================================================"
echo "📱 Using Android Storage Directly"
echo "======================================================================"
echo "Videos from: $MEDIA_ROOT/$VIDEOS_FOLDER"
echo "Images from: $MEDIA_ROOT/$IMAGES_FOLDER"
echo ""

# First boot scan
echo "Running initial scan..."
python scripts/catalog_manager_v2.py boot

# Start app
echo ""
echo "Starting server..."
python app.py
EOF
        
        chmod +x ~/lite-media/run-termux.sh
        
        echo "✅ Created configuration: ~/lite-media/.env"
        echo "✅ Created startup script: ~/lite-media/run-termux.sh"
        echo ""
        echo "To start the app with Android storage:"
        echo "   bash ~/lite-media/run-termux.sh"
        echo ""
        echo "⚠️  Note: Files will NOT be copied, the app scans Android folders directly"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================================================"
echo "✅ SETUP COMPLETE"
echo "======================================================================"
echo ""
echo "Your media gallery is ready! 🎉"
echo ""
