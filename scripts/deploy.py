#!/usr/bin/env python3
"""
Quick setup and deployment script
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run command with nice output"""
    print(f"\n{'='*50}")
    print(f"🔧 {description}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, text=True)
        print(f"✅ {description} - Done!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed!")
        return False


def setup():
    """Initial setup"""
    print("🚀 Lite Media Gallery - Setup")
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Install dependencies
    print("\n📦 Installing Python dependencies...")
    run_command(
        f"{sys.executable} -m pip install -r scripts/requirements.txt",
        "Installing dependencies"
    )
    
    # Initial scan
    print("\n🔍 Scanning media files...")
    run_command(
        f"{sys.executable} scripts/catalog_manager.py scan",
        "Scanning media"
    )
    
    print("\n✅ Setup complete!")
    print("\nNext steps:")
    print("  • Run: python scripts/server.py")
    print("  • Open: http://localhost:8000")


def deploy():
    """Deploy/update gallery"""
    print("🚀 Deploying gallery...")
    
    # Scan for new media
    run_command(
        f"{sys.executable} scripts/catalog_manager.py scan",
        "Scanning for new media"
    )
    
    # Generate thumbnails (optional)
    print("\n🖼️  Generate thumbnails? (y/n): ", end='')
    if input().lower() == 'y':
        run_command(
            f"{sys.executable} scripts/thumbnail_generator.py --all",
            "Generating thumbnails"
        )
    
    print("\n✅ Deployment complete!")


def clean():
    """Clean up generated files"""
    print("🧹 Cleaning up...")
    
    base_path = Path(__file__).parent.parent
    
    # Remove generated files
    files_to_remove = [
        base_path / "scripts" / "metadata.json.backup",
        base_path / "js" / "media-catalog.js.backup"
    ]
    
    for file in files_to_remove:
        if file.exists():
            file.unlink()
            print(f"🗑️  Removed {file.name}")
    
    print("✅ Cleanup complete!")


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Gallery management commands')
    parser.add_argument(
        'command',
        choices=['setup', 'deploy', 'clean', 'scan', 'server'],
        help='Command to run'
    )
    
    args = parser.parse_args()
    
    if args.command == 'setup':
        setup()
    elif args.command == 'deploy':
        deploy()
    elif args.command == 'clean':
        clean()
    elif args.command == 'scan':
        run_command(
            f"{sys.executable} scripts/catalog_manager.py scan",
            "Scanning media"
        )
    elif args.command == 'server':
        subprocess.run([sys.executable, 'scripts/server.py'])


if __name__ == '__main__':
    main()
