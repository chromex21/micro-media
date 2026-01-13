#!/usr/bin/env python3
"""
Diagnostic tool for Lite Media Gallery
Shows what the app sees and helps troubleshoot issues
"""

import os
import json
from pathlib import Path

def main():
    print("\n" + "=" * 70)
    print("🔍 LITE MEDIA GALLERY DIAGNOSTICS")
    print("=" * 70 + "\n")
    
    # Detect environment
    is_termux = os.path.exists('/data/data/com.termux')
    print(f"Environment: {'🤖 Termux/Android' if is_termux else '💻 Desktop'}")
    
    # Base paths
    base = Path(__file__).parent.parent.resolve()
    print(f"Base Path: {base}")
    
    # Check data folder
    print("\n📂 DATA FOLDER")
    print("-" * 70)
    data_path = base / "data"
    if data_path.exists():
        print(f"✅ {data_path}")
        
        # Check media.json
        media_json = data_path / "media.json"
        if media_json.exists():
            print(f"   ✅ media.json found")
            try:
                with open(media_json) as f:
                    data = json.load(f)
                    videos = data.get('videos', [])
                    images = data.get('images', [])
                    print(f"      📹 Videos in catalog: {len(videos)}")
                    print(f"      🖼️  Images in catalog: {len(images)}")
                    
                    # Check if files actually exist
                    missing_videos = []
                    for v in videos:
                        path = base / v.get('path', '')
                        if not path.exists():
                            missing_videos.append(v.get('file', 'unknown'))
                    
                    missing_images = []
                    for i in images:
                        path = base / i.get('path', '')
                        if not path.exists():
                            missing_images.append(i.get('file', 'unknown'))
                    
                    if missing_videos:
                        print(f"      ⚠️  {len(missing_videos)} video(s) missing from filesystem!")
                        print(f"         {', '.join(missing_videos[:3])}")
                    else:
                        print(f"      ✅ All videos exist on filesystem")
                    
                    if missing_images:
                        print(f"      ⚠️  {len(missing_images)} image(s) missing from filesystem!")
                        print(f"         {', '.join(missing_images[:3])}")
                    else:
                        print(f"      ✅ All images exist on filesystem")
                        
            except json.JSONDecodeError:
                print(f"   ❌ media.json is corrupted!")
            except Exception as e:
                print(f"   ❌ Error reading media.json: {e}")
        else:
            print(f"   ⚠️  media.json not found")
            print(f"      Run: python scripts/catalog_manager_v2.py boot")
    else:
        print(f"❌ {data_path} (not found)")
    
    # Check media folders
    print("\n📂 MEDIA FOLDERS")
    print("-" * 70)
    
    media_path = base / "media"
    if media_path.exists():
        print(f"✅ {media_path}")
        
        # Videos
        videos_path = media_path / "videos" / "sd"
        if videos_path.exists():
            video_files = [f for f in videos_path.iterdir() 
                          if f.is_file() and f.suffix.lower() in ['.mp4', '.webm', '.mov', '.avi']]
            print(f"   📹 Videos folder: {videos_path}")
            print(f"      Files: {len(video_files)}")
            if video_files:
                for f in video_files[:5]:
                    print(f"         - {f.name}")
                if len(video_files) > 5:
                    print(f"         ... and {len(video_files) - 5} more")
        else:
            print(f"   ❌ Videos folder not found: {videos_path}")
        
        # Images
        images_path = media_path / "images" / "full"
        if images_path.exists():
            image_files = [f for f in images_path.iterdir()
                          if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']]
            print(f"   🖼️  Images folder: {images_path}")
            print(f"      Files: {len(image_files)}")
            if image_files:
                for f in image_files[:5]:
                    print(f"         - {f.name}")
                if len(image_files) > 5:
                    print(f"         ... and {len(image_files) - 5} more")
        else:
            print(f"   ❌ Images folder not found: {images_path}")
    else:
        print(f"❌ {media_path} (not found)")
    
    # Termux-specific checks
    if is_termux:
        print("\n📱 ANDROID STORAGE ACCESS")
        print("-" * 70)
        
        storage_path = Path.home() / "storage" / "shared"
        if storage_path.exists():
            print(f"✅ Storage access granted")
            
            # Check common media folders
            android_folders = {
                'DCIM/Camera': 'Camera photos',
                'Pictures': 'Screenshots & images',
                'Movies': 'Video files',
                'Download': 'Downloaded files',
            }
            
            for folder, desc in android_folders.items():
                folder_path = storage_path / folder
                if folder_path.exists():
                    files = list(folder_path.iterdir())
                    print(f"   ✅ {folder} ({desc}): {len(files)} files")
                else:
                    print(f"   ⚠️  {folder} not found")
        else:
            print(f"❌ Storage access not granted")
            print(f"   Run: termux-setup-storage")
    
    # Configuration check
    print("\n⚙️  CONFIGURATION")
    print("-" * 70)
    
    config_file = base / "scripts" / "config.py"
    if config_file.exists():
        print(f"✅ config.py found")
        
        # Check environment variables
        env_vars = {
            'MEDIA_ROOT': os.getenv('MEDIA_ROOT'),
            'VIDEOS_FOLDER': os.getenv('VIDEOS_FOLDER'),
            'IMAGES_FOLDER': os.getenv('IMAGES_FOLDER'),
        }
        
        if any(env_vars.values()):
            print("   Custom paths configured:")
            for key, value in env_vars.items():
                if value:
                    print(f"      {key}={value}")
        else:
            print("   Using default paths")
            print("   To use custom paths, set environment variables:")
            print("      export MEDIA_ROOT=~/storage/shared")
            print("      export VIDEOS_FOLDER=Movies")
            print("      export IMAGES_FOLDER=DCIM/Camera")
    else:
        print(f"⚠️  config.py not found (using defaults)")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("-" * 70)
    
    # Check if catalog and filesystem match
    try:
        media_json = base / "data" / "media.json"
        if media_json.exists():
            with open(media_json) as f:
                data = json.load(f)
                catalog_videos = len(data.get('videos', []))
                catalog_images = len(data.get('images', []))
            
            videos_path = base / "media" / "videos" / "sd"
            images_path = base / "media" / "images" / "full"
            
            actual_videos = len([f for f in videos_path.iterdir() 
                               if f.is_file() and f.suffix.lower() in ['.mp4', '.webm', '.mov']]) if videos_path.exists() else 0
            actual_images = len([f for f in images_path.iterdir()
                               if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']]) if images_path.exists() else 0
            
            if catalog_videos != actual_videos or catalog_images != actual_images:
                print("⚠️  Catalog doesn't match filesystem!")
                print(f"   Catalog: {catalog_videos} videos, {catalog_images} images")
                print(f"   Filesystem: {actual_videos} videos, {actual_images} images")
                print("\n   Run this to fix:")
                print("   python scripts/catalog_manager_v2.py boot")
            else:
                print("✅ Catalog matches filesystem")
                
            if actual_videos == 0 and actual_images == 0:
                print("\n⚠️  No media files found!")
                if is_termux:
                    print("\n   To add media from Android storage:")
                    print("   bash scripts/setup_termux_paths.sh")
                else:
                    print("\n   Add files to:")
                    print(f"   Videos: {videos_path}")
                    print(f"   Images: {images_path}")
                    print("   Then run: python scripts/catalog_manager_v2.py boot")
                    
    except Exception as e:
        print(f"⚠️  Could not compare catalog and filesystem: {e}")
    
    print("\n" + "=" * 70)
    print("🔍 DIAGNOSTICS COMPLETE")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    main()
