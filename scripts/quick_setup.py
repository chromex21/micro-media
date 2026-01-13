#!/usr/bin/env python3
"""
Quick Setup Script
One command to set up complete automation
"""

import os
import sys
import subprocess
from pathlib import Path


def run_command(cmd, description):
    """Run command with output"""
    print(f"\n{'='*50}")
    print(f"🔧 {description}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            text=True,
            capture_output=True
        )
        print(result.stdout)
        print(f"✅ {description} - Done!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed!")
        print(e.stderr)
        return False


def main():
    print("\n" + "="*60)
    print("🚀 LITE MEDIA GALLERY - COMPLETE AUTOMATION SETUP")
    print("="*60)
    
    base_path = Path(__file__).parent.parent
    os.chdir(base_path)
    
    # Step 1: Install dependencies
    print("\n📦 STEP 1: Installing Dependencies")
    if not run_command(
        f"{sys.executable} -m pip install -r scripts/requirements.txt",
        "Installing Python packages"
    ):
        print("\n⚠️  Warning: Some dependencies failed to install")
        print("You can continue, but some features may not work")
        input("Press Enter to continue...")
    
    # Step 2: Initialize data structures
    print("\n📁 STEP 2: Initializing Data Structures")
    
    data_path = base_path / "data"
    data_path.mkdir(exist_ok=True)
    
    # Create default RSS feeds config
    rss_config = data_path / "rss_feeds.json"
    if not rss_config.exists():
        import json
        default_feeds = []
        with open(rss_config, 'w') as f:
            json.dump(default_feeds, f, indent=2)
        print("✅ Created RSS feeds configuration")
    
    # Step 3: Initial media scan
    print("\n🔍 STEP 3: Scanning Media")
    run_command(
        f"{sys.executable} scripts/catalog_manager_v2.py boot",
        "Initial media scan"
    )
    
    # Step 4: Git configuration check
    print("\n🔧 STEP 4: Git Configuration")
    
    try:
        # Check if Git is initialized
        subprocess.run(
            ["git", "status"],
            check=True,
            capture_output=True,
            cwd=base_path
        )
        print("✅ Git repository configured")
        
        # Show current remote
        result = subprocess.run(
            ["git", "remote", "-v"],
            capture_output=True,
            text=True,
            cwd=base_path
        )
        print("\nCurrent Git remotes:")
        print(result.stdout)
        
    except:
        print("⚠️  Git not configured")
        print("\nTo enable Git sync:")
        print("  git init")
        print("  git remote add origin <your-repo-url>")
    
    # Step 5: Configuration summary
    print("\n" + "="*60)
    print("📋 CONFIGURATION SUMMARY")
    print("="*60)
    
    print("\n✅ Core Setup Complete")
    print("\n📚 Next Steps:")
    print("\n1. Add RSS Feeds:")
    print("   python scripts/rss_importer.py add \\")
    print("     --name 'Feed Name' \\")
    print("     --url 'https://example.com/feed.xml'")
    
    print("\n2. Test Full Automation:")
    print("   python scripts/master_orchestrator.py full")
    
    print("\n3. Set Up Scheduled Automation:")
    print("   See COMPLETE_AUTOMATION_GUIDE.md")
    
    print("\n4. Termux Auto-Pull Setup:")
    print("   On Termux:")
    print("   chmod +x scripts/termux_auto_pull.sh")
    print("   termux-job-scheduler -s scripts/termux_auto_pull.sh \\")
    print("     --period-ms 1800000")
    
    print("\n" + "="*60)
    print("✅ SETUP COMPLETE!")
    print("="*60)
    print("\n📖 Read COMPLETE_AUTOMATION_GUIDE.md for full details\n")


if __name__ == '__main__':
    main()
