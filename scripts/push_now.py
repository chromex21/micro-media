#!/usr/bin/env python3
"""
Quick Git Push - Push all changes to GitHub
"""

import subprocess
import sys
from pathlib import Path
from datetime import datetime

def run_command(cmd, description):
    """Run command and show output"""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            text=True,
            capture_output=True
        )
        if result.stdout:
            print(result.stdout)
        print(f"✅ {description} - Done!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed!")
        if e.stderr:
            print(e.stderr)
        return False

def main():
    base_path = Path(__file__).parent.parent
    
    print("\n" + "="*60)
    print("🚀 PUSHING TO GITHUB")
    print("="*60)
    print(f"\nRepository: {base_path}")
    print(f"Remote: https://github.com/chromex21/micro-media.git")
    
    # Check status
    print("\n📋 Checking status...")
    result = subprocess.run(
        ["git", "status", "--short"],
        capture_output=True,
        text=True,
        cwd=base_path
    )
    
    if not result.stdout.strip():
        print("\n✅ No changes to commit - everything is up to date!")
        return
    
    print("\nChanges to commit:")
    print(result.stdout)
    
    # Confirm
    print("\n" + "-"*60)
    confirm = input("Push these changes to GitHub? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("\n❌ Cancelled")
        return
    
    # Add all changes
    if not run_command("git add .", "Adding all changes"):
        return
    
    # Commit
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_msg = f"Update: {timestamp} - Added automation scripts"
    
    if not run_command(f'git commit -m "{commit_msg}"', "Creating commit"):
        print("\n⚠️  Nothing to commit (files might already be staged)")
    
    # Pull first (in case remote has changes)
    print("\n📥 Pulling latest from remote...")
    result = subprocess.run(
        ["git", "pull", "origin", "main", "--rebase"],
        capture_output=True,
        text=True,
        cwd=base_path
    )
    
    if result.returncode != 0:
        print("⚠️  Pull had issues, attempting push anyway...")
    
    # Push
    if run_command("git push origin main", "Pushing to GitHub"):
        print("\n" + "="*60)
        print("✅ SUCCESSFULLY PUSHED TO GITHUB!")
        print("="*60)
        print("\n📱 On Termux:")
        print("   Changes will auto-pull within 30 minutes")
        print("   Or run: bash scripts/termux_auto_pull.sh")
        print()
    else:
        print("\n❌ Push failed - check your credentials or connection")

if __name__ == '__main__':
    main()
