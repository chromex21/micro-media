#!/usr/bin/env python3
"""
System Integrity Checker & Auto-Repair
Ensures all required directories and files exist
Runs automatically on boot
"""

import os
import json
from pathlib import Path
from datetime import datetime

class IntegrityChecker:
    """Checks and repairs system file structure"""
    
    REQUIRED_STRUCTURE = {
        'directories': [
            'media/videos/sd',
            'media/videos/thumbs',
            'media/images/full',
            'media/images/thumbs',
            'data',
            'assets',
            'docs/archive',
            'css',
            'js',
            'scripts',
        ],
        'files': [
            'data/media.json',
            'data/boot_status.json',
        ],
        'gitkeep_dirs': [
            'media/videos/sd',
            'media/videos/thumbs',
            'media/images/full',
            'media/images/thumbs',
            'assets',
            'docs/archive',
        ]
    }
    
    def __init__(self, base_path=None):
        self.base_path = Path(base_path or Path(__file__).parent.parent).resolve()
        self.issues = []
        self.repairs = []
        
    def check(self):
        """Run full integrity check"""
        print("🔍 Running integrity check...")
        print(f"📁 Base path: {self.base_path}\n")
        
        self.issues = []
        self.repairs = []
        
        # Check directories
        self._check_directories()
        
        # Check files
        self._check_files()
        
        # Check .gitkeep files
        self._check_gitkeep_files()
        
        return len(self.issues) == 0
    
    def _check_directories(self):
        """Check all required directories exist"""
        print("→ Checking directories...")
        
        for dir_path in self.REQUIRED_STRUCTURE['directories']:
            full_path = self.base_path / dir_path
            
            if not full_path.exists():
                self.issues.append(f"Missing directory: {dir_path}")
                print(f"  ❌ Missing: {dir_path}")
            else:
                print(f"  ✅ Found: {dir_path}")
    
    def _check_files(self):
        """Check all required files exist"""
        print("\n→ Checking critical files...")
        
        for file_path in self.REQUIRED_STRUCTURE['files']:
            full_path = self.base_path / file_path
            
            if not full_path.exists():
                self.issues.append(f"Missing file: {file_path}")
                print(f"  ❌ Missing: {file_path}")
            else:
                # Validate JSON files
                if file_path.endswith('.json'):
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            json.load(f)
                        print(f"  ✅ Valid: {file_path}")
                    except json.JSONDecodeError:
                        self.issues.append(f"Invalid JSON: {file_path}")
                        print(f"  ❌ Invalid JSON: {file_path}")
                else:
                    print(f"  ✅ Found: {file_path}")
    
    def _check_gitkeep_files(self):
        """Check .gitkeep files in empty directories"""
        print("\n→ Checking .gitkeep files...")
        
        for dir_path in self.REQUIRED_STRUCTURE['gitkeep_dirs']:
            gitkeep_path = self.base_path / dir_path / '.gitkeep'
            
            if not gitkeep_path.exists():
                self.issues.append(f"Missing .gitkeep: {dir_path}")
                print(f"  ⚠️  Missing .gitkeep in: {dir_path}")
            else:
                print(f"  ✅ .gitkeep in: {dir_path}")
    
    def repair(self, auto_confirm=False):
        """Repair all found issues"""
        if not self.issues:
            print("\n✅ No issues found - system is healthy!")
            return True
        
        print(f"\n⚠️  Found {len(self.issues)} issues")
        
        if not auto_confirm:
            print("\nIssues:")
            for issue in self.issues:
                print(f"  • {issue}")
            
            response = input("\nAttempt automatic repair? (y/n): ").lower()
            if response != 'y':
                print("❌ Repair cancelled")
                return False
        
        print("\n🔧 Starting repairs...\n")
        
        # Create missing directories
        for dir_path in self.REQUIRED_STRUCTURE['directories']:
            full_path = self.base_path / dir_path
            if not full_path.exists():
                full_path.mkdir(parents=True, exist_ok=True)
                self.repairs.append(f"Created directory: {dir_path}")
                print(f"  ✅ Created: {dir_path}")
        
        # Create missing files
        for file_path in self.REQUIRED_STRUCTURE['files']:
            full_path = self.base_path / file_path
            if not full_path.exists():
                if file_path == 'data/media.json':
                    self._create_default_media_json(full_path)
                elif file_path == 'data/boot_status.json':
                    self._create_default_boot_status(full_path)
                
                self.repairs.append(f"Created file: {file_path}")
                print(f"  ✅ Created: {file_path}")
        
        # Create .gitkeep files
        for dir_path in self.REQUIRED_STRUCTURE['gitkeep_dirs']:
            gitkeep_path = self.base_path / dir_path / '.gitkeep'
            if not gitkeep_path.exists():
                gitkeep_path.parent.mkdir(parents=True, exist_ok=True)
                gitkeep_path.write_text("# This file ensures the directory is tracked by git even when empty\n")
                self.repairs.append(f"Created .gitkeep: {dir_path}")
                print(f"  ✅ Created .gitkeep in: {dir_path}")
        
        print(f"\n✅ Repairs complete - {len(self.repairs)} fixes applied")
        return True
    
    def _create_default_media_json(self, path):
        """Create default media.json"""
        default_data = {
            "videos": [],
            "images": [],
            "deleted": [],
            "cloud_links": [],
            "last_updated": datetime.now().isoformat()
        }
        
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, indent=2)
    
    def _create_default_boot_status(self, path):
        """Create default boot_status.json"""
        default_status = {
            "state": "initializing",
            "message": "System initializing...",
            "ready": False,
            "timestamp": datetime.now().isoformat()
        }
        
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(default_status, f, indent=2)
    
    def generate_report(self):
        """Generate integrity check report"""
        report = []
        report.append("="*60)
        report.append("SYSTEM INTEGRITY REPORT")
        report.append("="*60)
        report.append(f"Timestamp: {datetime.now().isoformat()}")
        report.append(f"Base Path: {self.base_path}")
        report.append("")
        
        if not self.issues:
            report.append("✅ System is healthy - no issues found")
        else:
            report.append(f"⚠️  Found {len(self.issues)} issues:")
            for issue in self.issues:
                report.append(f"  • {issue}")
        
        if self.repairs:
            report.append("")
            report.append(f"🔧 Applied {len(self.repairs)} repairs:")
            for repair in self.repairs:
                report.append(f"  • {repair}")
        
        report.append("="*60)
        
        return "\n".join(report)


def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check and repair system integrity'
    )
    parser.add_argument('--path', type=str,
                       help='Base path (default: auto-detect)')
    parser.add_argument('--repair', action='store_true',
                       help='Automatically repair issues')
    parser.add_argument('--report', type=str,
                       help='Save report to file')
    
    args = parser.parse_args()
    
    # Run check
    checker = IntegrityChecker(args.path)
    is_healthy = checker.check()
    
    # Repair if requested or if issues found
    if not is_healthy:
        if args.repair:
            checker.repair(auto_confirm=True)
        else:
            checker.repair(auto_confirm=False)
    
    # Generate report
    report = checker.generate_report()
    print("\n" + report)
    
    # Save report if requested
    if args.report:
        with open(args.report, 'w') as f:
            f.write(report)
        print(f"\n📄 Report saved to: {args.report}")
    
    # Exit code
    return 0 if is_healthy or checker.repairs else 1


if __name__ == '__main__':
    exit(main())
