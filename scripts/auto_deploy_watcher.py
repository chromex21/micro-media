#!/usr/bin/env python3
"""
Auto Deploy Watcher - Monitors media folders and auto-deploys changes
Runs continuously in the background and triggers deployment on file changes

Usage:
    python scripts/auto_deploy_watcher.py              # Start watching
    python scripts/auto_deploy_watcher.py --interval 5 # Custom scan interval (minutes)
"""

import os
import sys
import time
import hashlib
import json
from pathlib import Path
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from auto_deploy import AutoDeploy
    from config import get_media_path, get_data_path
except ImportError:
    print("❌ Failed to import required modules")
    sys.exit(1)


class DeployWatcher:
    """Watches for media changes and triggers auto-deploy"""
    
    def __init__(self, interval_minutes=10, cooldown_minutes=2):
        self.base_path = Path(__file__).parent.parent.resolve()
        self.interval = interval_minutes * 60  # Convert to seconds
        self.cooldown = cooldown_minutes * 60  # Minimum time between deploys
        self.last_deploy = 0
        self.deployer = AutoDeploy(verbose=True)
        
        # Paths to monitor
        self.watch_paths = [
            get_media_path('videos'),
            get_media_path('images'),
            get_data_path() / 'media.json'
        ]
        
        # State file to track last known state
        self.state_file = self.base_path / '.deploy_watcher_state.json'
        self.last_state = self.load_state()
        
        print("\n" + "="*60)
        print("👁️  AUTO DEPLOY WATCHER")
        print("="*60)
        print(f"Scan interval: {interval_minutes} minutes")
        print(f"Deploy cooldown: {cooldown_minutes} minutes")
        print("\nWatching:")
        for path in self.watch_paths:
            exists = "✅" if path.exists() else "❌"
            print(f"  {exists} {path}")
        print("="*60)
        print("\n🎬 Press Ctrl+C to stop\n")
    
    def load_state(self):
        """Load last known state"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def save_state(self, state):
        """Save current state"""
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"⚠️  Failed to save state: {e}")
    
    def get_folder_hash(self, folder_path):
        """Get hash of folder contents (filenames and sizes)"""
        if not folder_path.exists():
            return None
        
        file_info = []
        try:
            for file in sorted(folder_path.iterdir()):
                if file.is_file():
                    file_info.append(f"{file.name}:{file.stat().st_size}:{file.stat().st_mtime}")
        except Exception as e:
            print(f"⚠️  Error reading {folder_path}: {e}")
            return None
        
        content = '|'.join(file_info)
        return hashlib.md5(content.encode()).hexdigest()
    
    def get_file_hash(self, file_path):
        """Get hash of file content"""
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
            return None
    
    def get_current_state(self):
        """Get current state of watched paths"""
        state = {}
        
        for path in self.watch_paths:
            if path.is_dir():
                state[str(path)] = self.get_folder_hash(path)
            elif path.is_file():
                state[str(path)] = self.get_file_hash(path)
        
        return state
    
    def has_changes(self, current_state):
        """Check if state has changed"""
        if not self.last_state:
            return True  # First run
        
        for path, hash_value in current_state.items():
            if hash_value != self.last_state.get(path):
                return True
        
        return False
    
    def get_changes_summary(self, current_state):
        """Get summary of what changed"""
        changes = []
        
        for path, hash_value in current_state.items():
            old_hash = self.last_state.get(path)
            if hash_value != old_hash:
                path_obj = Path(path)
                if path_obj.is_dir():
                    changes.append(f"Folder: {path_obj.name}")
                else:
                    changes.append(f"File: {path_obj.name}")
        
        return changes
    
    def should_deploy(self):
        """Check if enough time has passed since last deploy"""
        current_time = time.time()
        time_since_deploy = current_time - self.last_deploy
        
        if time_since_deploy < self.cooldown:
            remaining = int((self.cooldown - time_since_deploy) / 60)
            print(f"⏳ Cooldown active. {remaining} minutes remaining...")
            return False
        
        return True
    
    def trigger_deploy(self, changes):
        """Trigger automatic deployment"""
        print("\n" + "🚀" + "="*58)
        print("CHANGES DETECTED - TRIGGERING DEPLOY")
        print("="*60)
        
        for change in changes:
            print(f"  • {change}")
        
        print("")
        
        # Create commit message with changes
        commit_msg = f"Auto-deploy: Changes detected - {', '.join(changes[:3])}"
        if len(changes) > 3:
            commit_msg += f" and {len(changes) - 3} more"
        
        # Execute deployment
        success = self.deployer.full_deploy(commit_message=commit_msg)
        
        if success:
            self.last_deploy = time.time()
            print("\n✅ Auto-deploy completed successfully\n")
        else:
            print("\n❌ Auto-deploy failed\n")
        
        return success
    
    def watch(self):
        """Main watch loop"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 👁️  Watching for changes...")
        
        try:
            while True:
                # Get current state
                current_state = self.get_current_state()
                
                # Check for changes
                if self.has_changes(current_state):
                    changes = self.get_changes_summary(current_state)
                    
                    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🔔 Changes detected!")
                    
                    # Check cooldown
                    if self.should_deploy():
                        self.trigger_deploy(changes)
                        self.last_state = current_state
                        self.save_state(self.last_state)
                    else:
                        print("⏸️  Skipping deploy (cooldown active)\n")
                
                # Wait for next scan
                time.sleep(self.interval)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Scanning...")
        
        except KeyboardInterrupt:
            print("\n\n🛑 Watcher stopped by user")
            print("✅ Final state saved\n")


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Auto Deploy Watcher - Continuous monitoring and deployment',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/auto_deploy_watcher.py                # Default (10 min interval)
  python scripts/auto_deploy_watcher.py --interval 5   # 5 minute scans
  python scripts/auto_deploy_watcher.py --cooldown 1   # 1 minute cooldown
  
This script continuously monitors media folders and automatically
triggers deployment when changes are detected.
        """
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=10,
        help='Scan interval in minutes (default: 10)'
    )
    
    parser.add_argument(
        '--cooldown',
        type=int,
        default=2,
        help='Minimum minutes between deploys (default: 2)'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.interval < 1:
        print("❌ Interval must be at least 1 minute")
        sys.exit(1)
    
    if args.cooldown < 1:
        print("❌ Cooldown must be at least 1 minute")
        sys.exit(1)
    
    # Start watcher
    watcher = DeployWatcher(
        interval_minutes=args.interval,
        cooldown_minutes=args.cooldown
    )
    
    watcher.watch()


if __name__ == '__main__':
    main()
