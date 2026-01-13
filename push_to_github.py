#!/usr/bin/env python3
"""
Automated Git Push Script
Handles merge conflicts, commits changes, and pushes to GitHub
"""

import subprocess
import sys
import os

def run_command(cmd, capture_output=True, check=False):
    """Execute a command and return the result"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture_output,
            text=True,
            shell=False
        )
        return result
    except Exception as e:
        print(f"❌ Error running command: {' '.join(cmd)}")
        print(f"   {e}")
        return None

def check_git_installed():
    """Verify git is installed"""
    result = run_command(["git", "--version"])
    if result and result.returncode == 0:
        print(f"✅ {result.stdout.strip()}")
        return True
    else:
        print("❌ Git is not installed or not in PATH")
        return False

def abort_merge_if_needed():
    """Check if there's an ongoing merge and abort it"""
    if os.path.exists(".git/MERGE_HEAD"):
        print("⚠️  Detected ongoing merge. Aborting...")
        result = run_command(["git", "merge", "--abort"])
        if result and result.returncode == 0:
            print("✅ Merge aborted successfully")
        else:
            print("ℹ️  Continuing (merge may have already been resolved)")
    return True

def get_repo_status():
    """Get current repository status"""
    result = run_command(["git", "status", "--porcelain"])
    if result and result.returncode == 0:
        return result.stdout
    return None

def stage_all_changes():
    """Stage all changes"""
    print("📦 Staging all changes...")
    result = run_command(["git", "add", "."])
    if result and result.returncode == 0:
        print("✅ Changes staged")
        return True
    else:
        print("❌ Failed to stage changes")
        return False

def create_commit(message="Automated commit"):
    """Create a commit with all staged changes"""
    print(f"💾 Creating commit: '{message}'")
    result = run_command(["git", "commit", "-m", message])
    if result and result.returncode == 0:
        print("✅ Commit created")
        return True
    elif result and "nothing to commit" in result.stdout:
        print("ℹ️  Nothing to commit, working tree clean")
        return True
    else:
        print("❌ Failed to create commit")
        if result:
            print(f"   {result.stderr}")
        return False

def check_remote_exists(remote_url):
    """Check if remote origin exists and set it"""
    result = run_command(["git", "remote", "get-url", "origin"])
    
    if result and result.returncode == 0:
        current_url = result.stdout.strip()
        if current_url != remote_url:
            print(f"🔄 Updating remote URL from {current_url} to {remote_url}")
            run_command(["git", "remote", "set-url", "origin", remote_url])
        print(f"✅ Remote origin: {remote_url}")
    else:
        print(f"🔗 Adding remote origin: {remote_url}")
        result = run_command(["git", "remote", "add", "origin", remote_url])
        if result and result.returncode == 0:
            print("✅ Remote added")
        else:
            print("❌ Failed to add remote")
            return False
    return True

def ensure_main_branch():
    """Ensure we're on main branch"""
    print("🌿 Ensuring we're on 'main' branch...")
    result = run_command(["git", "branch", "--show-current"])
    if result and result.returncode == 0:
        current_branch = result.stdout.strip()
        if current_branch != "main":
            print(f"   Renaming branch '{current_branch}' to 'main'")
            run_command(["git", "branch", "-M", "main"])
        print("✅ On 'main' branch")
    return True

def pull_changes(force=False):
    """Pull latest changes from remote"""
    print("⬇️  Pulling latest changes...")
    if force:
        result = run_command(["git", "pull", "origin", "main", "--allow-unrelated-histories"])
    else:
        result = run_command(["git", "pull", "origin", "main"])
    
    if result and result.returncode == 0:
        print("✅ Pull successful")
        return True
    else:
        print("⚠️  Pull had issues (this may be normal for first push)")
        return False

def push_to_remote(force=False):
    """Push commits to remote"""
    print("🚀 Pushing to GitHub...")
    
    cmd = ["git", "push", "-u", "origin", "main"]
    if force:
        print("   Using --force flag")
        cmd.append("--force")
    
    result = run_command(cmd)
    if result and result.returncode == 0:
        print("✅ Push successful!")
        return True
    else:
        print("❌ Push failed")
        if result:
            print(f"   {result.stderr}")
        return False

def main():
    """Main execution flow"""
    print("=" * 60)
    print("🔧 Git Auto-Push Script")
    print("=" * 60)
    
    # Configuration
    REPO_URL = "https://github.com/chromex21/micro-media.git"
    COMMIT_MESSAGE = "Automated commit - update project files"
    
    # Check for force flag
    force_push = "--force" in sys.argv or "-f" in sys.argv
    if force_push:
        print("⚠️  Force push enabled")
    
    # Step 1: Check git is installed
    if not check_git_installed():
        return 1
    
    # Step 2: Abort any ongoing merge
    abort_merge_if_needed()
    
    # Step 3: Check repo status
    status = get_repo_status()
    if status:
        print(f"📊 Repository has changes:")
        lines = status.strip().split('\n')
        for line in lines[:10]:  # Show first 10 changes
            print(f"   {line}")
        if len(lines) > 10:
            print(f"   ... and {len(lines) - 10} more")
    
    # Step 4: Stage changes
    if not stage_all_changes():
        return 1
    
    # Step 5: Create commit
    if not create_commit(COMMIT_MESSAGE):
        print("⚠️  Continuing despite commit issue...")
    
    # Step 6: Setup remote
    if not check_remote_exists(REPO_URL):
        return 1
    
    # Step 7: Ensure main branch
    ensure_main_branch()
    
    # Step 8: Try to pull (may fail on first push)
    pull_changes(force=force_push)
    
    # Step 9: Push to GitHub
    if push_to_remote(force=force_push):
        print("\n" + "=" * 60)
        print("✨ SUCCESS! Your code is now on GitHub")
        print(f"🔗 View at: https://github.com/chromex21/micro-media")
        print("=" * 60)
        return 0
    else:
        print("\n" + "=" * 60)
        print("💡 If push failed due to conflicts, try:")
        print("   python push_to_github.py --force")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
