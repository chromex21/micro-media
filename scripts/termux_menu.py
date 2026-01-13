#!/usr/bin/env python3
"""
Lite Media - Termux Management Menu
Easy menu-driven interface for managing your gallery on Android
"""

import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from catalog_manager_v2 import MediaCatalog
except ImportError:
    print("❌ Failed to import catalog_manager_v2")
    sys.exit(1)


class TermuxMenu:
    """Menu-driven Termux management"""
    
    def __init__(self):
        self.base_path = Path(__file__).parent.parent.resolve()
        
        # Android storage paths
        self.android_storage = Path.home() / "storage" / "shared"
        self.drop_folder = self.android_storage / "LiteMedia"
        
        # Project paths
        self.videos_dest = self.base_path / "media" / "videos" / "sd"
        self.images_dest = self.base_path / "media" / "images" / "full"
        
        # Ensure paths exist
        self.videos_dest.mkdir(parents=True, exist_ok=True)
        self.images_dest.mkdir(parents=True, exist_ok=True)
        
        # Initialize CMS
        self.cms = MediaCatalog(base_path=str(self.base_path))
    
    def clear_screen(self):
        """Clear terminal screen"""
        os.system('clear' if os.name != 'nt' else 'cls')
    
    def pause(self):
        """Pause for user input"""
        input("\n⏎ Press Enter to continue...")
    
    def print_header(self, title):
        """Print menu header"""
        self.clear_screen()
        print("\n" + "="*60)
        print(f"  {title}")
        print("="*60 + "\n")
    
    def setup_drop_folder(self):
        """Set up Android drop folder"""
        self.print_header("📁 SETUP ANDROID DROP FOLDER")
        
        print("Creating easy-access folder on your Android device...")
        print(f"\nFolder: {self.drop_folder}")
        
        if self.drop_folder.exists():
            print("\n✅ Drop folder already exists!")
        else:
            try:
                self.drop_folder.mkdir(parents=True, exist_ok=True)
                print("\n✅ Drop folder created!")
            except Exception as e:
                print(f"\n❌ Failed to create folder: {e}")
                self.pause()
                return
        
        print("\n" + "-"*60)
        print("📱 HOW TO USE:")
        print("-"*60)
        print("\n1. Open your Android file manager (Files, Solid Explorer, etc.)")
        print(f"\n2. Navigate to: Internal Storage/LiteMedia/")
        print("\n3. Copy or move your videos/photos there")
        print("\n4. Come back to Termux and use option [2] to import them")
        print("\n💡 TIP: This folder is easy to find and access on Android!")
        
        self.pause()
    
    def list_drop_folder_contents(self):
        """List files in drop folder"""
        if not self.drop_folder.exists():
            print("\n⚠️  Drop folder doesn't exist yet!")
            print("   Use option [1] to create it first")
            return []
        
        video_exts = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
        image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        
        videos = []
        images = []
        
        try:
            for file in self.drop_folder.iterdir():
                if file.is_file():
                    ext = file.suffix.lower()
                    if ext in video_exts:
                        videos.append(file)
                    elif ext in image_exts:
                        images.append(file)
        except Exception as e:
            print(f"\n❌ Error reading drop folder: {e}")
            return []
        
        return videos, images
    
    def import_from_drop_folder(self):
        """Import media from drop folder"""
        self.print_header("📥 IMPORT FROM ANDROID")
        
        if not self.drop_folder.exists():
            print("⚠️  Drop folder doesn't exist!")
            print("\nUse option [1] to set it up first")
            self.pause()
            return
        
        print("Scanning drop folder...")
        contents = self.list_drop_folder_contents()
        
        if not contents:
            print("\n❌ Error scanning folder")
            self.pause()
            return
        
        videos, images = contents
        
        if not videos and not images:
            print("\n📭 Drop folder is empty!")
            print(f"\nFolder location: {self.drop_folder}")
            print("\nAdd some media files there and try again")
            self.pause()
            return
        
        # Show what was found
        print(f"\n✅ Found {len(videos)} video(s) and {len(images)} image(s)")
        
        if videos:
            print("\n📹 Videos:")
            for i, video in enumerate(videos, 1):
                size = video.stat().st_size / 1024 / 1024  # MB
                print(f"  {i}. {video.name} ({size:.1f} MB)")
        
        if images:
            print("\n🖼️  Images:")
            for i, image in enumerate(images, 1):
                size = image.stat().st_size / 1024 / 1024  # MB
                print(f"  {i}. {image.name} ({size:.1f} MB)")
        
        print("\n" + "-"*60)
        print("OPTIONS:")
        print("-"*60)
        print("\n[A] Import ALL")
        print("[V] Import videos only")
        print("[I] Import images only")
        print("[C] Cancel")
        
        choice = input("\nYour choice: ").strip().upper()
        
        if choice == 'C':
            print("\n↩️  Cancelled")
            self.pause()
            return
        
        # Determine what to import
        files_to_import = []
        
        if choice == 'A':
            files_to_import = videos + images
        elif choice == 'V':
            files_to_import = videos
        elif choice == 'I':
            files_to_import = images
        else:
            print("\n❌ Invalid choice")
            self.pause()
            return
        
        if not files_to_import:
            print("\n❌ No files selected")
            self.pause()
            return
        
        # Import files
        print(f"\n📦 Importing {len(files_to_import)} file(s)...")
        
        imported = 0
        failed = 0
        
        for file in files_to_import:
            try:
                # Determine destination
                if file.suffix.lower() in {'.mp4', '.webm', '.mov', '.avi', '.mkv'}:
                    dest = self.videos_dest / file.name
                else:
                    dest = self.images_dest / file.name
                
                # Check if file already exists
                if dest.exists():
                    print(f"  ⚠️  Skipping {file.name} (already exists)")
                    continue
                
                # Copy file
                print(f"  📋 Copying {file.name}...")
                shutil.copy2(file, dest)
                
                # Remove from drop folder
                file.unlink()
                
                imported += 1
                print(f"  ✅ Imported {file.name}")
                
            except Exception as e:
                print(f"  ❌ Failed to import {file.name}: {e}")
                failed += 1
        
        print("\n" + "-"*60)
        print(f"✅ Imported: {imported}")
        if failed > 0:
            print(f"❌ Failed: {failed}")
        print("-"*60)
        
        if imported > 0:
            print("\n🔄 Updating catalog...")
            self.cms.scan_media(auto_add=True)
            self.cms.save()
            print("✅ Catalog updated!")
        
        self.pause()
    
    def scan_media(self):
        """Scan and update media catalog"""
        self.print_header("🔍 SCAN MEDIA")
        
        print("Scanning media folders...")
        result = self.cms.scan_media(auto_add=True)
        
        new_videos = len(result.get('new_videos', []))
        new_images = len(result.get('new_images', []))
        
        if new_videos > 0 or new_images > 0:
            print(f"\n✅ Found {new_videos} new video(s) and {new_images} new image(s)")
            print("\n💾 Saving catalog...")
            self.cms.save()
            print("✅ Done!")
        else:
            print("\n✅ No new media found")
            print("   Everything is already in the catalog")
        
        self.pause()
    
    def view_stats(self):
        """View gallery statistics"""
        self.print_header("📊 GALLERY STATISTICS")
        
        self.cms.stats()
        
        self.pause()
    
    def check_drop_folder_status(self):
        """Check drop folder status"""
        self.print_header("📁 DROP FOLDER STATUS")
        
        if not self.drop_folder.exists():
            print("❌ Drop folder not created yet")
            print("\nUse option [1] to set it up")
        else:
            print(f"✅ Drop folder exists: {self.drop_folder}")
            
            contents = self.list_drop_folder_contents()
            if contents:
                videos, images = contents
                print(f"\n📹 Videos: {len(videos)}")
                print(f"🖼️  Images: {len(images)}")
                
                if videos or images:
                    print("\n💡 Use option [2] to import these files")
            else:
                print("\n❌ Error reading folder")
        
        self.pause()
    
    def git_status(self):
        """Check Git status"""
        self.print_header("🔄 GIT STATUS")
        
        try:
            import subprocess
            
            # Git status
            print("Repository status:")
            result = subprocess.run(
                ["git", "status", "--short"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            
            if result.stdout.strip():
                print(result.stdout)
            else:
                print("✅ Working tree clean")
            
            # Last commit
            print("\nLast commit:")
            result = subprocess.run(
                ["git", "log", "-1", "--oneline"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            print(result.stdout)
            
            # Remote status
            print("Remote status:")
            subprocess.run(["git", "fetch"], cwd=self.base_path)
            
            result = subprocess.run(
                ["git", "status", "-sb"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            print(result.stdout)
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        self.pause()
    
    def git_pull(self):
        """Pull from Git"""
        self.print_header("⬇️  PULL FROM GIT")
        
        try:
            import subprocess
            
            print("Fetching from origin...")
            subprocess.run(["git", "fetch", "origin"], cwd=self.base_path)
            
            print("\nPulling changes...")
            result = subprocess.run(
                ["git", "pull", "origin", "main"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            
            print(result.stdout)
            
            if result.returncode == 0:
                print("\n✅ Pull successful!")
                print("\n🔄 Running boot scan...")
                self.cms.boot_scan()
                print("✅ Catalog updated!")
            else:
                print(f"\n❌ Pull failed: {result.stderr}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        self.pause()
    
    def main_menu(self):
        """Main menu loop"""
        while True:
            self.print_header("🎬 LITE MEDIA - TERMUX MENU")
            
            print("ANDROID FILE MANAGEMENT:")
            print("  [1] Set up Android drop folder")
            print("  [2] Import media from Android")
            print("  [3] Check drop folder status")
            print()
            print("GALLERY MANAGEMENT:")
            print("  [4] Scan media folders")
            print("  [5] View statistics")
            print()
            print("GIT SYNC:")
            print("  [6] Check Git status")
            print("  [7] Pull from Git")
            print()
            print("  [0] Exit")
            print()
            
            choice = input("Select option: ").strip()
            
            if choice == '1':
                self.setup_drop_folder()
            elif choice == '2':
                self.import_from_drop_folder()
            elif choice == '3':
                self.check_drop_folder_status()
            elif choice == '4':
                self.scan_media()
            elif choice == '5':
                self.view_stats()
            elif choice == '6':
                self.git_status()
            elif choice == '7':
                self.git_pull()
            elif choice == '0':
                print("\n👋 Goodbye!\n")
                break
            else:
                print("\n❌ Invalid option")
                self.pause()


def main():
    """Entry point"""
    menu = TermuxMenu()
    menu.main_menu()


if __name__ == '__main__':
    main()
