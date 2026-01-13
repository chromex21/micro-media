#!/data/data/com.termux/files/usr/bin/bash
#
# Termux Auto-Pull Service
# Automatically pulls from Git and deploys to Termux
# Run this with: termux-job-scheduler
#

set -e

# Configuration
REPO_DIR="$HOME/lite-media"
LOG_FILE="$REPO_DIR/logs/auto-pull.log"
GIT_BRANCH="main"
GIT_REMOTE="origin"

# Ensure log directory exists
mkdir -p "$REPO_DIR/logs"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "AUTO-PULL SERVICE STARTED"
log "========================================="

# Navigate to repo
cd "$REPO_DIR" || {
    log "❌ ERROR: Repository not found at $REPO_DIR"
    exit 1
}

# Fetch latest from remote
log "📡 Fetching from $GIT_REMOTE..."
if git fetch "$GIT_REMOTE" "$GIT_BRANCH"; then
    log "✅ Fetch successful"
else
    log "❌ Fetch failed"
    exit 1
fi

# Check if remote has changes
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "$GIT_REMOTE/$GIT_BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    log "ℹ️  Already up to date"
    exit 0
fi

log "🔄 Changes detected! Pulling updates..."

# Stash any local changes (shouldn't be any in production)
if ! git diff-index --quiet HEAD --; then
    log "⚠️  Local changes detected, stashing..."
    git stash
fi

# Pull changes
if git pull "$GIT_REMOTE" "$GIT_BRANCH"; then
    log "✅ Pull successful"
else
    log "❌ Pull failed"
    exit 1
fi

# Run boot sequence to update catalog
log "🚀 Running boot sequence..."
if python3 scripts/catalog_manager_v2.py boot; then
    log "✅ Boot sequence completed"
else
    log "❌ Boot sequence failed"
fi

# Restart the app if it's running
log "🔄 Restarting application..."
if pgrep -f "python.*app.py" > /dev/null; then
    log "📛 Stopping existing app..."
    pkill -f "python.*app.py"
    sleep 2
fi

log "🚀 Starting app..."
nohup python3 app.py > "$REPO_DIR/logs/app.log" 2>&1 &
log "✅ App restarted (PID: $!)"

log "========================================="
log "AUTO-PULL SERVICE COMPLETED"
log "========================================="
