#!/usr/bin/env python3
"""
Content Management System for Lite Media Gallery
Handles all media scanning, indexing, and persistence
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional


class MediaCatalog:
    """
    Medium-tier CMS with boot sequence support
    Python is the write authority - generates media.json
    """
    
    def __init__(self, base_path: str = "."):
        """Initialize CMS with base path"""
        self.base_path = Path(base_path).resolve()
        self.media_path = self.base_path / "media"
        self.videos_path = self.media_path / "videos" / "sd"
        self.images_path = self.media_path / "images" / "full"
        
        # Data files (source of truth)
        self.data_path = self.base_path / "data"
        self.media_json = self.data_path / "media.json"
        self.boot_status_json = self.data_path / "boot_status.json"
        
        # Supported formats
        self.video_extensions = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
        
        # Ensure directories exist
        self.data_path.mkdir(parents=True, exist_ok=True)
        self.videos_path.mkdir(parents=True, exist_ok=True)
        self.images_path.mkdir(parents=True, exist_ok=True)
        
        # Load existing data
        self.data = self._load_data()
    
    
    # ========================================================================
    # DATA PERSISTENCE (Write Authority)
    # ========================================================================
    
    def _load_data(self) -> Dict:
        """Load data from media.json (source of truth)"""
        if self.media_json.exists():
            try:
                with open(self.media_json, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("⚠️  media.json corrupted, creating new one")
        
        # Default structure
        return {
            'videos': [],
            'images': [],
            'deleted': [],
            'version': 1,
            'last_updated': None
        }
    
    def _save_data(self):
        """Save data to media.json (write authority)"""
        self.data['last_updated'] = datetime.now().isoformat()
        
        with open(self.media_json, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Data saved to {self.media_json.name}")
    
    def _update_boot_status(self, state: str, message: str, ready: bool = False):
        """Update boot status for frontend"""
        status = {
            'state': state,
            'message': message,
            'ready': ready,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(self.boot_status_json, 'w', encoding='utf-8') as f:
            json.dump(status, f, indent=2)
        
        print(f"→ {state}: {message}")
    
    
    # ========================================================================
    # BOOT SEQUENCE (System Initialization)
    # ========================================================================
    
    def boot_scan(self) -> bool:
        """
        Full system boot sequence
        This is the primary entry point for system initialization
        """
        print("\n→ Initializing system...")
        
        try:
            # Step 1: Initialize
            self._update_boot_status('initializing', 'Starting boot sequence')
            
            # Step 2: Scan filesystem
            self._update_boot_status('scanning', 'Scanning media folders')
            print("→ Scanning media folders...")
            scan_result = self.scan_media(auto_add=True)
            
            # Step 3: Organize and validate
            self._update_boot_status('indexing', 'Building content index')
            print("→ Building content index...")
            self._reindex_media()
            
            # Step 4: Verify integrity
            self._update_boot_status('verifying', 'Verifying feed integrity')
            print("→ Verifying integrity...")
            self._verify_integrity()
            
            # Step 5: Save and signal ready
            self._save_data()
            
            video_count = len(self.data['videos'])
            image_count = len(self.data['images'])
            message = f"Found {video_count} videos, {image_count} images"
            
            self._update_boot_status('ready', message, ready=True)
            
            print(f"→ Videos: {video_count}")
            print(f"→ Images: {image_count}")
            
            return True
            
        except Exception as e:
            error_msg = f"Boot failed: {str(e)}"
            print(f"\n❌ {error_msg}")
            self._update_boot_status('error', error_msg, ready=False)
            return False
    
    def _reindex_media(self):
        """
        Reindex media with sequential IDs
        Ensures all items have proper stable identifiers
        """
        # Reindex videos
        for i, video in enumerate(self.data['videos'], start=1):
            if not video.get('id') or not video['id'].startswith('v_'):
                video['id'] = self._generate_id('video', video['file'], i)
        
        # Reindex images
        for i, image in enumerate(self.data['images'], start=1):
            if not image.get('id') or not image['id'].startswith('i_'):
                image['id'] = self._generate_id('image', image['file'], i)
    
    def _verify_integrity(self):
        """Verify all media files exist on filesystem"""
        # Check videos
        missing_videos = []
        for video in self.data['videos']:
            file_path = self.base_path / video['path']
            if not file_path.exists():
                missing_videos.append(video['file'])
        
        # Check images
        missing_images = []
        for image in self.data['images']:
            file_path = self.base_path / image['path']
            if not file_path.exists():
                missing_images.append(image['file'])
        
        if missing_videos:
            print(f"⚠️  Warning: {len(missing_videos)} video(s) missing from filesystem")
        if missing_images:
            print(f"⚠️  Warning: {len(missing_images)} image(s) missing from filesystem")
    
    
    # ========================================================================
    # MEDIA SCANNING
    # ========================================================================
    
    def scan_media(self, auto_add: bool = True) -> Dict[str, List[str]]:
        """
        Scan media folders for new files
        
        Args:
            auto_add: Automatically add new files to catalog
        
        Returns:
            Dict with 'new_videos' and 'new_images' lists
        """
        new_videos = []
        new_images = []
        
        # Get existing filenames
        existing_videos = {item['file'] for item in self.data['videos']}
        existing_images = {item['file'] for item in self.data['images']}
        deleted_items = set(self.data['deleted'])
        
        # Scan videos
        if self.videos_path.exists():
            for file in sorted(self.videos_path.iterdir()):
                if file.suffix.lower() in self.video_extensions:
                    filename = file.name
                    
                    # Skip if deleted
                    if f"video:{filename}" in deleted_items:
                        continue
                    
                    # Check if new
                    if filename not in existing_videos:
                        new_videos.append(filename)
                        if auto_add:
                            self._add_video_item(filename, auto_generated=True)
        
        # Scan images
        if self.images_path.exists():
            for file in sorted(self.images_path.iterdir()):
                if file.suffix.lower() in self.image_extensions:
                    filename = file.name
                    
                    # Skip if deleted
                    if f"image:{filename}" in deleted_items:
                        continue
                    
                    # Check if new
                    if filename not in existing_images:
                        new_images.append(filename)
                        if auto_add:
                            self._add_image_item(filename, auto_generated=True)
        
        if new_videos or new_images:
            print(f"📊 Found {len(new_videos)} new video(s), {len(new_images)} new image(s)")
        
        return {
            'new_videos': new_videos,
            'new_images': new_images
        }
    
    
    # ========================================================================
    # ADD OPERATIONS
    # ========================================================================
    
    def _add_video_item(self, filename: str, title: str = "", 
                        description: str = "", auto_generated: bool = False, 
                        url: str = None, source: str = 'local'):
        """Add video item to catalog (internal)"""
        # Check if already exists
        if any(item['file'] == filename for item in self.data['videos']):
            return
        
        # Auto-generate title if needed
        if not title and auto_generated:
            title = self._generate_title(filename)
        
        # Get file stats
        file_path = self.videos_path / filename
        file_stat = file_path.stat() if file_path.exists() else None
        
        # Generate sequential ID
        next_index = len(self.data['videos']) + 1
        
        item = {
            'id': self._generate_id('video', filename, next_index),
            'type': 'video',
            'file': filename,
            'path': f'media/videos/sd/{filename}',
            'title': title,
            'desc': description,
            'created': int(file_stat.st_ctime) if file_stat else int(datetime.now().timestamp()),
            'added': datetime.now().isoformat()
        }
        
        self.data['videos'].append(item)
    
    def _add_image_item(self, filename: str, title: str = "",
                        description: str = "", auto_generated: bool = False):
        """Add image item to catalog (internal)"""
        # Check if already exists
        if any(item['file'] == filename for item in self.data['images']):
            return
        
        # Auto-generate title if needed
        if not title and auto_generated:
            title = self._generate_title(filename)
        
        # Get file stats
        file_path = self.images_path / filename
        file_stat = file_path.stat() if file_path.exists() else None
        
        # Generate sequential ID
        next_index = len(self.data['images']) + 1
        
        item = {
            'id': self._generate_id('image', filename, next_index),
            'type': 'image',
            'file': filename,
            'path': f'media/images/full/{filename}',
            'title': title,
            'desc': description,
            'created': int(file_stat.st_ctime) if file_stat else int(datetime.now().timestamp()),
            'added': datetime.now().isoformat()
        }
        
        self.data['images'].append(item)
    
    def add_video(self, filename: str, title: str = "", description: str = ""):
        """Add video to catalog (public API)"""
        self._add_video_item(filename, title, description, auto_generated=False)
        print(f"✅ Added video: {filename}")
    
    def add_image(self, filename: str, title: str = "", description: str = ""):
        """Add image to catalog (public API)"""
        self._add_image_item(filename, title, description, auto_generated=False)
        print(f"✅ Added image: {filename}")
    
    
    # ========================================================================
    # UPDATE OPERATIONS
    # ========================================================================
    
    def update_video(self, filename: str, title: Optional[str] = None,
                     description: Optional[str] = None) -> bool:
        """Update video metadata"""
        for item in self.data['videos']:
            if item['file'] == filename:
                if title is not None:
                    item['title'] = title
                if description is not None:
                    item['desc'] = description
                item['updated'] = datetime.now().isoformat()
                print(f"✅ Updated video: {filename}")
                return True
        
        print(f"❌ Video {filename} not found")
        return False
    
    def update_image(self, filename: str, title: Optional[str] = None,
                     description: Optional[str] = None) -> bool:
        """Update image metadata"""
        for item in self.data['images']:
            if item['file'] == filename:
                if title is not None:
                    item['title'] = title
                if description is not None:
                    item['desc'] = description
                item['updated'] = datetime.now().isoformat()
                print(f"✅ Updated image: {filename}")
                return True
        
        print(f"❌ Image {filename} not found")
        return False
    
    
    # ========================================================================
    # DELETE OPERATIONS
    # ========================================================================
    
    def delete_video(self, filename: str, remove_file: bool = False) -> bool:
        """Delete video from catalog"""
        # Remove from catalog
        self.data['videos'] = [
            item for item in self.data['videos'] 
            if item['file'] != filename
        ]
        
        # Add to deleted list (prevent re-adding)
        deleted_key = f"video:{filename}"
        if deleted_key not in self.data['deleted']:
            self.data['deleted'].append(deleted_key)
        
        # Optionally remove physical file
        if remove_file:
            file_path = self.videos_path / filename
            if file_path.exists():
                file_path.unlink()
                print(f"🗑️  Deleted file: {filename}")
        
        print(f"✅ Removed video from catalog: {filename}")
        return True
    
    def delete_image(self, filename: str, remove_file: bool = False) -> bool:
        """Delete image from catalog"""
        # Remove from catalog
        self.data['images'] = [
            item for item in self.data['images']
            if item['file'] != filename
        ]
        
        # Add to deleted list (prevent re-adding)
        deleted_key = f"image:{filename}"
        if deleted_key not in self.data['deleted']:
            self.data['deleted'].append(deleted_key)
        
        # Optionally remove physical file
        if remove_file:
            file_path = self.images_path / filename
            if file_path.exists():
                file_path.unlink()
                print(f"🗑️  Deleted file: {filename}")
        
        print(f"✅ Removed image from catalog: {filename}")
        return True
    
    
    # ========================================================================
    # UTILITIES
    # ========================================================================
    
    def _generate_id(self, media_type: str, filename: str, index: int) -> str:
        """Generate sequential, stable media ID"""
        prefix = 'v' if media_type == 'video' else 'i'
        # Use 4-digit sequential numbering
        return f"{prefix}_{index:04d}"
    
    def _generate_title(self, filename: str) -> str:
        """Generate human-readable title from filename"""
        name = Path(filename).stem
        name = name.replace('_', ' ').replace('-', ' ')
        name = name.title()
        return name
    
    def save(self):
        """Save all changes (public API)"""
        self._save_data()
    
    def stats(self):
        """Display catalog statistics"""
        print("\n📊 Catalog Statistics")
        print("=" * 50)
        print(f"Videos: {len(self.data['videos'])}")
        print(f"Images: {len(self.data['images'])}")
        print(f"Deleted items: {len(self.data['deleted'])}")
        print(f"Version: {self.data.get('version', 1)}")
        print(f"Last updated: {self.data.get('last_updated', 'Never')}")
        print(f"Source: {self.media_json}")
        print("=" * 50 + "\n")


# ============================================================================
# CLI INTERFACE (for manual operations)
# ============================================================================

def main():
    """Command-line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Lite Media Gallery CMS - Manual Operations'
    )
    
    parser.add_argument(
        'action',
        choices=['boot', 'scan', 'stats', 'save', 'add', 'update', 'delete'],
        help='Action to perform'
    )
    
    parser.add_argument('--video', help='Video filename')
    parser.add_argument('--image', help='Image filename')
    parser.add_argument('--title', help='Media title')
    parser.add_argument('--desc', help='Media description')
    parser.add_argument('--remove-file', action='store_true',
                       help='Also delete physical file (use with delete)')
    
    args = parser.parse_args()
    
    # Initialize CMS
    cms = MediaCatalog()
    
    # Execute action
    if args.action == 'boot':
        cms.boot_scan()
    
    elif args.action == 'scan':
        cms.scan_media(auto_add=True)
        cms.save()
    
    elif args.action == 'stats':
        cms.stats()
    
    elif args.action == 'save':
        cms.save()
    
    elif args.action == 'add':
        if args.video:
            cms.add_video(args.video, args.title or "", args.desc or "")
            cms.save()
        elif args.image:
            cms.add_image(args.image, args.title or "", args.desc or "")
            cms.save()
        else:
            print("❌ Specify --video or --image")
    
    elif args.action == 'update':
        if args.video:
            cms.update_video(args.video, args.title, args.desc)
            cms.save()
        elif args.image:
            cms.update_image(args.image, args.title, args.desc)
            cms.save()
        else:
            print("❌ Specify --video or --image")
    
    elif args.action == 'delete':
        if args.video:
            cms.delete_video(args.video, args.remove_file)
            cms.save()
        elif args.image:
            cms.delete_image(args.image, args.remove_file)
            cms.save()
        else:
            print("❌ Specify --video or --image")


if __name__ == '__main__':
    main()
