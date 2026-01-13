#!/usr/bin/env python3
"""
Configuration for Lite Media Gallery
Allows customizing media storage paths for different environments
"""

import os
from pathlib import Path

# Detect if running in Termux
IS_TERMUX = os.path.exists('/data/data/com.termux')

# Default base path (project root)
BASE_PATH = Path(__file__).parent.parent.resolve()

# Media paths configuration
# Override these with environment variables for custom locations
MEDIA_CONFIG = {
    # Root media folder
    'media_root': os.getenv('MEDIA_ROOT', str(BASE_PATH / 'media')),
    
    # Videos
    'videos_folder': os.getenv('VIDEOS_FOLDER', 'videos/sd'),
    
    # Images
    'images_folder': os.getenv('IMAGES_FOLDER', 'images/full'),
    
    # Thumbnails
    'video_thumbs': 'videos/thumbs',
    'image_thumbs': 'images/thumbs',
}

# For Termux: Suggest Android storage paths
if IS_TERMUX:
    ANDROID_PATHS = {
        'dcim': Path.home() / 'storage' / 'shared' / 'DCIM' / 'Camera',
        'pictures': Path.home() / 'storage' / 'shared' / 'Pictures',
        'movies': Path.home() / 'storage' / 'shared' / 'Movies',
        'downloads': Path.home() / 'storage' / 'shared' / 'Download',
    }
    
    print("🤖 Termux detected!")
    print("📱 Android storage paths available:")
    for name, path in ANDROID_PATHS.items():
        exists = "✅" if path.exists() else "❌"
        print(f"   {exists} {name}: {path}")
    print("\n💡 To use Android storage directly:")
    print("   export MEDIA_ROOT=~/storage/shared")
    print("   export VIDEOS_FOLDER=Movies")
    print("   export IMAGES_FOLDER=DCIM/Camera")
    print("   Then run: python scripts/catalog_manager_v2.py boot\n")

def get_media_path(media_type='videos'):
    """Get full path for media type"""
    root = Path(MEDIA_CONFIG['media_root'])
    
    if media_type == 'videos':
        return root / MEDIA_CONFIG['videos_folder']
    elif media_type == 'images':
        return root / MEDIA_CONFIG['images_folder']
    elif media_type == 'video_thumbs':
        return root / MEDIA_CONFIG['video_thumbs']
    elif media_type == 'image_thumbs':
        return root / MEDIA_CONFIG['image_thumbs']
    
    return root

def get_data_path():
    """Get data folder path"""
    return BASE_PATH / 'data'

def print_config():
    """Print current configuration"""
    print("\n📂 Current Media Configuration")
    print("=" * 60)
    print(f"Base Path: {BASE_PATH}")
    print(f"Media Root: {MEDIA_CONFIG['media_root']}")
    print(f"Videos: {get_media_path('videos')}")
    print(f"Images: {get_media_path('images')}")
    print(f"Data: {get_data_path()}")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    print_config()
