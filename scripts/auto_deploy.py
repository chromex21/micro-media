#!/usr/bin/env python3
"""
Auto Deploy System - Fully Automated Workflow
Handles: Boot → Catalog → Git Push → Tomex Deploy

This script automates the entire deployment pipeline:
1. Boot sequence (scan and index media)
2. Git commit and push to GitHub
3. Trigger Tomex pull and deploy
4. Verify deployment status

Usage:
    python scripts/auto_deploy.py              # Full deploy
    python scripts/auto_deploy.py --scan-only  # Just scan media
    python scripts/auto_deploy.py --git-only   # Just Git operations
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from catalog_manager_v2 import MediaCatalog
    from config import BASE_PATH, print_config
except ImportError:
    print("❌ Failed to import required modules")
    sys.exit(1)


class AutoDeploy:
    """Automated deployment system"""
    
    def __init__(self, verbose=True):
        self.base_path = Path(__file__).parent.parent.resolve()
        self.verbose = verbose
        self.git_remote = "https://github.com/chromex21/micro-media.git"
        self.git_branch = "main"
        
        # Tomex configuration (set via environment or config file)
        self.tomex_host = os.getenv('TOMEX_HOST')  # e.g., "user@tomex.example.com"
        self.tomex_repo_path = os.getenv('TOMEX_REPO_PATH')  # e.g., "/var/www/lite-media"
        
        self.log_file = self.base_path / 'deploy.log'
        
    def log(self, message, level="INFO"):
        """Log message to console and file"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_line = f"[{timestamp}] [{level}] {message}"
        
        if self.verbose:
            print(log_line)
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_line + '\n')
    
    def run_command(self, cmd, description, capture=False):
        """Run shell command with logging"""
        self.log(f"Running: {description}", "INFO")
        
        try:
            if capture:
                result = subprocess.run(
                    cmd,
                    shell=isinstance(cmd, str),
                    capture_output=True,
                    text=True,
                    cwd=self.base_path
                )
                
                if result.returncode != 0:
                    self.log(f"Command failed: {result.stderr}", "ERROR")
                    return False, result.stderr
                
                return True, result.stdout
            else:
                result = subprocess.run(
                    cmd,
                    shell=isinstance(cmd, str),
                    cwd=self.base_path
                )
                return result.returncode == 0, None
        
        except Exception as e:
            self.log(f"Exception: {str(e)}", "ERROR")
            return False, str(e)
    
    def step_boot_scan(self):
        """Step 1: Boot sequence and media scan"""
        self.log("="*60)
        self.log("STEP 1: Boot Sequence & Media Scan")
        self.log("="*60)
        
        try:
            cms = MediaCatalog(base_path=str(self.base_path))
            success = cms.boot_scan()
            
            if success:
                self.log("✅ Boot sequence completed successfully", "SUCCESS")
                
                # Get stats
                data = cms.data
                video_count = len(data.get('videos', []))
                image_count = len(data.get('images', []))
                cloud_count = len(data.get('cloud_links', []))
                
                self.log(f"   Videos: {video_count}")
                self.log(f"   Images: {image_count}")
                self.log(f"   Cloud Links: {cloud_count}")
                
                return True
            else:
                self.log("❌ Boot sequence failed", "ERROR")
                return False
        
        except Exception as e:
            self.log(f"❌ Boot error: {str(e)}", "ERROR")
            return False
    
    def step_git_operations(self, commit_message=None):
        """Step 2: Git commit and push"""
        self.log("="*60)
        self.log("STEP 2: Git Operations")
        self.log("="*60)
        
        if not commit_message:
            commit_message = f"Auto-deploy: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Check Git status
        success, output = self.run_command(
            ["git", "status", "--porcelain"],
            "Checking Git status",
            capture=True
        )
        
        if not success:
            self.log("❌ Git status check failed", "ERROR")
            return False
        
        if not output.strip():
            self.log("ℹ️  No changes to commit", "INFO")
            return True
        
        # Stage all changes
        success, _ = self.run_command(
            ["git", "add", "."],
            "Staging changes"
        )
        
        if not success:
            self.log("❌ Failed to stage changes", "ERROR")
            return False
        
        # Commit
        success, _ = self.run_command(
            ["git", "commit", "-m", commit_message],
            "Creating commit"
        )
        
        if not success:
            self.log("⚠️  Commit failed (possibly nothing to commit)", "WARN")
        
        # Pull latest (in case remote has changes)
        self.log("Pulling latest changes...")
        success, _ = self.run_command(
            ["git", "pull", "origin", self.git_branch, "--rebase"],
            "Pulling from remote",
            capture=True
        )
        
        if not success:
            self.log("⚠️  Pull had issues, attempting push anyway", "WARN")
        
        # Push to GitHub
        success, _ = self.run_command(
            ["git", "push", "origin", self.git_branch],
            "Pushing to GitHub"
        )
        
        if not success:
            self.log("❌ Push to GitHub failed", "ERROR")
            return False
        
        self.log("✅ Git operations completed successfully", "SUCCESS")
        return True
    
    def step_tomex_deploy(self):
        """Step 3: Deploy to Tomex"""
        self.log("="*60)
        self.log("STEP 3: Tomex Deployment")
        self.log("="*60)
        
        if not self.tomex_host or not self.tomex_repo_path:
            self.log("⚠️  Tomex configuration not set", "WARN")
            self.log("   Set TOMEX_HOST and TOMEX_REPO_PATH environment variables")
            self.log("   Example:")
            self.log("     export TOMEX_HOST='user@tomex.example.com'")
            self.log("     export TOMEX_REPO_PATH='/var/www/lite-media'")
            return False
        
        # SSH commands to run on Tomex
        commands = [
            f"cd {self.tomex_repo_path}",
            "git fetch origin",
            f"git reset --hard origin/{self.git_branch}",
            "git pull origin " + self.git_branch,
            "python3 scripts/catalog_manager_v2.py boot",  # Rescan media on server
        ]
        
        ssh_command = f"ssh {self.tomex_host} '{'; '.join(commands)}'"
        
        success, output = self.run_command(
            ssh_command,
            "Deploying to Tomex",
            capture=True
        )
        
        if not success:
            self.log("❌ Tomex deployment failed", "ERROR")
            return False
        
        self.log("✅ Tomex deployment completed successfully", "SUCCESS")
        return True
    
    def step_verify_deployment(self):
        """Step 4: Verify deployment"""
        self.log("="*60)
        self.log("STEP 4: Verification")
        self.log("="*60)
        
        # Check local media.json
        media_file = self.base_path / 'data' / 'media.json'
        if not media_file.exists():
            self.log("❌ Local media.json not found", "ERROR")
            return False
        
        try:
            with open(media_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.log(f"✅ Local catalog valid")
            self.log(f"   Videos: {len(data.get('videos', []))}")
            self.log(f"   Images: {len(data.get('images', []))}")
            self.log(f"   Cloud Links: {len(data.get('cloud_links', []))}")
            self.log(f"   Last Updated: {data.get('last_updated', 'Unknown')}")
            
        except json.JSONDecodeError as e:
            self.log(f"❌ Local media.json is invalid: {str(e)}", "ERROR")
            return False
        
        # Git status
        success, output = self.run_command(
            ["git", "status", "--porcelain"],
            "Checking final Git status",
            capture=True
        )
        
        if success and not output.strip():
            self.log("✅ Git working tree clean")
        else:
            self.log("⚠️  Uncommitted changes remain", "WARN")
        
        return True
    
    def full_deploy(self, commit_message=None):
        """Execute full deployment pipeline"""
        self.log("")
        self.log("╔" + "="*58 + "╗")
        self.log("║" + " "*15 + "AUTO DEPLOY STARTED" + " "*24 + "║")
        self.log("╚" + "="*58 + "╝")
        self.log("")
        
        start_time = time.time()
        
        # Step 1: Boot and scan
        if not self.step_boot_scan():
            self.log("")
            self.log("❌ DEPLOYMENT FAILED at boot sequence", "ERROR")
            return False
        
        # Step 2: Git operations
        if not self.step_git_operations(commit_message):
            self.log("")
            self.log("❌ DEPLOYMENT FAILED at Git operations", "ERROR")
            return False
        
        # Step 3: Tomex deploy (optional, only if configured)
        if self.tomex_host and self.tomex_repo_path:
            if not self.step_tomex_deploy():
                self.log("")
                self.log("❌ DEPLOYMENT FAILED at Tomex deploy", "ERROR")
                return False
        else:
            self.log("")
            self.log("⏭️  Skipping Tomex deployment (not configured)")
        
        # Step 4: Verify
        if not self.step_verify_deployment():
            self.log("")
            self.log("⚠️  DEPLOYMENT COMPLETED with warnings", "WARN")
        else:
            self.log("")
            self.log("✅ DEPLOYMENT COMPLETED SUCCESSFULLY", "SUCCESS")
        
        elapsed = time.time() - start_time
        self.log("")
        self.log(f"⏱️  Total time: {elapsed:.2f} seconds")
        self.log("")
        
        return True


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Auto Deploy System - Fully Automated Workflow',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/auto_deploy.py                    # Full deployment
  python scripts/auto_deploy.py --scan-only        # Just scan media
  python scripts/auto_deploy.py --git-only         # Just Git ops
  python scripts/auto_deploy.py -m "Custom commit" # Custom message
  
Environment Variables:
  TOMEX_HOST        SSH host for Tomex server (user@host)
  TOMEX_REPO_PATH   Repository path on Tomex server
        """
    )
    
    parser.add_argument(
        '--scan-only',
        action='store_true',
        help='Only run boot sequence and media scan'
    )
    
    parser.add_argument(
        '--git-only',
        action='store_true',
        help='Only run Git operations (no scan)'
    )
    
    parser.add_argument(
        '--tomex-only',
        action='store_true',
        help='Only deploy to Tomex (assumes Git is up to date)'
    )
    
    parser.add_argument(
        '-m', '--message',
        type=str,
        help='Custom commit message'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Quiet mode (less verbose)'
    )
    
    args = parser.parse_args()
    
    # Initialize deployer
    deployer = AutoDeploy(verbose=not args.quiet)
    
    # Execute based on flags
    if args.scan_only:
        success = deployer.step_boot_scan()
    elif args.git_only:
        success = deployer.step_git_operations(args.message)
    elif args.tomex_only:
        success = deployer.step_tomex_deploy()
    else:
        # Full deployment
        success = deployer.full_deploy(args.message)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
