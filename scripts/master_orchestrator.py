#!/usr/bin/env python3
"""
Complete Automation Orchestrator
Handles the entire workflow: RSS → Local → Git → Termux

This is your one-command solution for full automation.
"""

import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from catalog_manager_v2 import MediaCatalog
    from rss_importer import RSSImporter
    from availability_tracker import AvailabilityTracker
    from auto_deploy import AutoDeploy
except ImportError as e:
    print(f"❌ Failed to import modules: {e}")
    sys.exit(1)


class MasterOrchestrator:
    """Complete automation orchestrator"""
    
    def __init__(self, verbose=True):
        self.base_path = Path(__file__).parent.parent.resolve()
        self.verbose = verbose
        
        # Initialize subsystems
        self.cms = MediaCatalog(base_path=str(self.base_path))
        self.rss = RSSImporter(base_path=str(self.base_path))
        self.tracker = AvailabilityTracker(base_path=str(self.base_path))
        self.deployer = AutoDeploy(verbose=verbose)
        
        self.log_file = self.base_path / 'automation.log'
    
    def log(self, message, level="INFO"):
        """Log message"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_line = f"[{timestamp}] [{level}] {message}"
        
        if self.verbose:
            print(log_line)
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_line + '\n')
    
    def full_automation_cycle(self):
        """Execute complete automation cycle"""
        self.log("")
        self.log("╔" + "="*58 + "╗")
        self.log("║" + " "*10 + "FULL AUTOMATION CYCLE STARTED" + " "*19 + "║")
        self.log("╚" + "="*58 + "╝")
        self.log("")
        
        start_time = time.time()
        success = True
        
        try:
            # PHASE 1: CONTENT AGGREGATION
            self.log("="*60)
            self.log("PHASE 1: CONTENT AGGREGATION")
            self.log("="*60)
            
            # Step 1.1: Import from RSS feeds
            self.log("\n→ Step 1.1: Importing from RSS feeds...")
            imported_count = self.rss.import_all_feeds(max_items_per_feed=10)
            self.log(f"   Imported {imported_count} items from RSS feeds")
            
            # PHASE 2: LOCAL MEDIA MANAGEMENT
            self.log("")
            self.log("="*60)
            self.log("PHASE 2: LOCAL MEDIA MANAGEMENT")
            self.log("="*60)
            
            # Step 2.1: Boot scan (indexes local media)
            self.log("\n→ Step 2.1: Boot scan & indexing...")
            if not self.cms.boot_scan():
                self.log("❌ Boot scan failed", "ERROR")
                success = False
                return False
            
            # Step 2.2: Track availability
            self.log("\n→ Step 2.2: Tracking media availability...")
            self.tracker.scan_availability()
            
            # Step 2.3: Generate feed metadata
            self.log("\n→ Step 2.3: Generating feed metadata...")
            self.tracker.generate_feed_metadata()
            
            # PHASE 3: DEPLOYMENT
            self.log("")
            self.log("="*60)
            self.log("PHASE 3: DEPLOYMENT")
            self.log("="*60)
            
            # Step 3.1: Git operations
            self.log("\n→ Step 3.1: Git commit & push...")
            commit_msg = f"Auto-sync: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            if imported_count > 0:
                commit_msg += f" ({imported_count} RSS items)"
            
            if not self.deployer.step_git_operations(commit_msg):
                self.log("⚠️  Git operations had issues", "WARN")
                # Don't fail completely, continue
            
            # Step 3.2: Termux deployment (if configured)
            self.log("\n→ Step 3.2: Triggering Termux deployment...")
            if self.deployer.tomex_host and self.deployer.tomex_repo_path:
                if not self.deployer.step_tomex_deploy():
                    self.log("⚠️  Termux deployment had issues", "WARN")
            else:
                self.log("   ℹ️  Termux auto-deploy not configured")
                self.log("   (Termux will auto-pull on next check)")
            
            # PHASE 4: VERIFICATION
            self.log("")
            self.log("="*60)
            self.log("PHASE 4: VERIFICATION")
            self.log("="*60)
            
            self.log("\n→ Step 4.1: Final verification...")
            self.deployer.step_verify_deployment()
            
        except Exception as e:
            self.log(f"❌ Automation failed: {str(e)}", "ERROR")
            success = False
        
        # Summary
        elapsed = time.time() - start_time
        
        self.log("")
        self.log("="*60)
        if success:
            self.log("✅ FULL AUTOMATION CYCLE COMPLETED SUCCESSFULLY")
        else:
            self.log("⚠️  AUTOMATION CYCLE COMPLETED WITH ISSUES")
        self.log(f"⏱️  Total time: {elapsed:.2f} seconds")
        self.log("="*60)
        self.log("")
        
        return success
    
    def quick_sync(self):
        """Quick sync: Just RSS import + Git push"""
        self.log("\n🔄 QUICK SYNC STARTED\n")
        
        # Import RSS
        self.log("→ Importing RSS feeds...")
        imported_count = self.rss.import_all_feeds(max_items_per_feed=5)
        
        if imported_count > 0:
            # Quick scan
            self.log("→ Quick media scan...")
            self.cms.scan_media(auto_add=True)
            self.cms.save()
            
            # Git push
            self.log("→ Pushing to Git...")
            commit_msg = f"Quick sync: {imported_count} RSS items"
            self.deployer.step_git_operations(commit_msg)
            
            self.log(f"\n✅ Quick sync complete ({imported_count} items)\n")
        else:
            self.log("\nℹ️  No new items, skipping sync\n")
    
    def scheduled_automation(self):
        """Run automation on schedule (for cron/systemd)"""
        self.log("\n⏰ SCHEDULED AUTOMATION RUN\n")
        return self.full_automation_cycle()


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Master Automation Orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Complete Automation Workflow:
  1. Import content from RSS feeds
  2. Scan and index local media
  3. Track availability (local/online/scheduled)
  4. Commit and push to Git
  5. Trigger Termux auto-deploy

Commands:
  full        Full automation cycle
  quick       Quick sync (RSS + Git only)
  scheduled   Run on schedule (for cron)

Examples:
  python scripts/master_orchestrator.py full
  python scripts/master_orchestrator.py quick
  
Cron example (run every hour):
  0 * * * * cd ~/lite-media && python3 scripts/master_orchestrator.py scheduled

Termux auto-pull setup:
  termux-job-scheduler -s scripts/termux_auto_pull.sh --period-ms 1800000
  (runs every 30 minutes)
        """
    )
    
    parser.add_argument(
        'mode',
        choices=['full', 'quick', 'scheduled'],
        help='Automation mode'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Quiet mode (less verbose)'
    )
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = MasterOrchestrator(verbose=not args.quiet)
    
    # Execute based on mode
    if args.mode == 'full':
        success = orchestrator.full_automation_cycle()
    elif args.mode == 'quick':
        orchestrator.quick_sync()
        success = True
    elif args.mode == 'scheduled':
        success = orchestrator.scheduled_automation()
    else:
        success = False
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
