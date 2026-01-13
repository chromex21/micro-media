#!/data/data/com.termux/files/usr/bin/bash
#
# Termux One-Command Setup
# Sets up everything needed for auto-deployment
#

set -e

echo "================================================="
echo "🚀 TERMUX AUTO-DEPLOYMENT SETUP"
echo "================================================="
echo ""

# Step 1: Update packages
echo "📦 Step 1: Updating packages..."
pkg update -y
pkg upgrade -y

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
pkg install -y python git termux-services termux-api

# Step 3: Install Python packages
echo ""
echo "🐍 Step 3: Installing Python packages..."
pip install flask pillow requests

# Step 4: Set up repository
echo ""
echo "📂 Step 4: Setting up repository..."

if [ ! -d "$HOME/lite-media" ]; then
    echo "Enter your GitHub repository URL:"
    read -r REPO_URL
    git clone "$REPO_URL" "$HOME/lite-media"
else
    echo "✅ Repository already exists at ~/lite-media"
fi

cd "$HOME/lite-media"

# Step 5: Make scripts executable
echo ""
echo "🔧 Step 5: Making scripts executable..."
chmod +x scripts/termux_auto_pull.sh
chmod +x scripts/setup_termux.sh

# Step 6: Create directories
echo ""
echo "📁 Step 6: Creating directories..."
mkdir -p logs
mkdir -p media/videos/sd
mkdir -p media/images/full
mkdir -p data

# Step 7: Initial boot scan
echo ""
echo "🔍 Step 7: Running initial scan..."
python scripts/catalog_manager_v2.py boot

# Step 8: Set up auto-pull job
echo ""
echo "⏰ Step 8: Setting up auto-pull job..."
echo "This will check for updates every 30 minutes"

termux-job-scheduler \
  -s scripts/termux_auto_pull.sh \
  --period-ms 1800000 \
  --persisted true

echo ""
echo "✅ Auto-pull job scheduled!"

# Step 9: Verify job
echo ""
echo "📋 Verifying scheduled jobs:"
termux-job-scheduler -p

# Step 10: Set up boot script (optional)
echo ""
echo "🔧 Step 10: Setting up boot script..."
mkdir -p "$HOME/.termux/boot"

cat > "$HOME/.termux/boot/start-lite-media.sh" << 'BOOTEOF'
#!/data/data/com.termux/files/usr/bin/bash
sleep 10  # Wait for system to stabilize
cd ~/lite-media
python app.py > logs/app.log 2>&1 &
BOOTEOF

chmod +x "$HOME/.termux/boot/start-lite-media.sh"
echo "✅ Boot script created"

# Step 11: Summary
echo ""
echo "================================================="
echo "✅ SETUP COMPLETE!"
echo "================================================="
echo ""
echo "📊 Configuration:"
echo "  • Repository: ~/lite-media"
echo "  • Auto-pull: Every 30 minutes"
echo "  • Boot script: Enabled"
echo ""
echo "🚀 To start the gallery:"
echo "  cd ~/lite-media"
echo "  python app.py"
echo ""
echo "🌐 Access at:"
echo "  http://localhost:8000"
echo ""
echo "📋 Check auto-pull status:"
echo "  termux-job-scheduler -p"
echo "  cat ~/lite-media/logs/auto-pull.log"
echo ""
echo "📖 Read COMPLETE_AUTOMATION_GUIDE.md for full details"
echo ""
echo "================================================="
