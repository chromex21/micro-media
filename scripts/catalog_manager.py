#!/usr/bin/env python3
"""
Lite Media Gallery - Content Management System
Automates media scanning, metadata management, and catalog generation
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

class MediaCatalog:
    """Main content management system"""
    
    def __init__(self, base_path: str = ".."):
        """Initialize CMS with base path"""
        self.base_path = Path(base_path).resolve()
        self.media_path = self.base_path / "media"
        self.videos_path = self.media_path / "videos" / "sd"
        self.images_path = self.media_path / "images" / "full"
        self.metadata_file = self.base_path / "scripts" / "metadata.json"
        self.catalog_file = self.base_path / "js" / "media-catalog.js"
        
        # Supported formats
        self.video_extensions = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
        self.image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
        
        # Load existing metadata
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        """Load metadata from JSON file"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("⚠️  Metadata file corrupted, creating new one")
        
        return {
            'videos': {},
            'images': {},
            'deleted': [],
            'last_updated': None
        }
    
    def _save_metadata(self):
        """Save metadata to JSON file"""
        self.metadata['last_updated'] = datetime.now().isoformat()
        
        # Create directory if it doesn't exist
        self.metadata_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Metadata saved to {self.metadata_file}")
    
    def scan_media(self, auto_add: bool = True) -> Dict[str, List[str]]:
        """
        Scan media folders for new files
        
        Args:
            auto_add: Automatically add new files to metadata
        
        Returns:
            Dict with 'new_videos' and 'new_images' lists
        """
        print("🔍 Scanning media folders...")
        
        new_videos = []
        new_images = []
        
        # Scan videos
        if self.videos_path.exists():
            for file in self.videos_path.iterdir():
                if file.suffix.lower() in self.video_extensions:
                    filename = file.name
                    
                    # Skip if deleted
                    if f"video:{filename}" in self.metadata['deleted']:
                        continue
                    
                    # Check if new
                    if filename not in self.metadata['videos']:
                        new_videos.append(filename)
                        
                        if auto_add:
                            self.add_video(filename, auto_generated=True)
        
        # Scan images
        if self.images_path.exists():
            for file in self.images_path.iterdir():
                if file.suffix.lower() in self.image_extensions:
                    filename = file.name
                    
                    # Skip if deleted
                    if f"image:{filename}" in self.metadata['deleted']:
                        continue
                    
                    # Check if new
                    if filename not in self.metadata['images']:
                        new_images.append(filename)
                        
                        if auto_add:
                            self.add_image(filename, auto_generated=True)
        
        print(f"📊 Found {len(new_videos)} new video(s) and {len(new_images)} new image(s)")
        
        return {
            'new_videos': new_videos,
            'new_images': new_images
        }
    
    def add_video(self, filename: str, title: str = "", description: str = "", 
                  auto_generated: bool = False):
        """Add video to catalog"""
        if filename in self.metadata['videos']:
            print(f"⚠️  Video {filename} already exists")
            return
        
        # Auto-generate title from filename if not provided
        if not title and auto_generated:
            title = self._generate_title(filename)
        
        self.metadata['videos'][filename] = {
            'file': filename,
            'title': title,
            'desc': description,
            'added': datetime.now().isoformat(),
            'type': 'video'
        }
        
        if not auto_generated:
            print(f"✅ Added video: {filename}")
    
    def add_image(self, filename: str, title: str = "", description: str = "",
                  auto_generated: bool = False):
        """Add image to catalog"""
        if filename in self.metadata['images']:
            print(f"⚠️  Image {filename} already exists")
            return
        
        # Auto-generate title from filename if not provided
        if not title and auto_generated:
            title = self._generate_title(filename)
        
        self.metadata['images'][filename] = {
            'file': filename,
            'title': title,
            'desc': description,
            'added': datetime.now().isoformat(),
            'type': 'image'
        }
        
        if not auto_generated:
            print(f"✅ Added image: {filename}")
    
    def update_video(self, filename: str, title: Optional[str] = None, 
                     description: Optional[str] = None):
        """Update video metadata"""
        if filename not in self.metadata['videos']:
            print(f"❌ Video {filename} not found")
            return False
        
        if title is not None:
            self.metadata['videos'][filename]['title'] = title
        
        if description is not None:
            self.metadata['videos'][filename]['desc'] = description
        
        self.metadata['videos'][filename]['updated'] = datetime.now().isoformat()
        print(f"✅ Updated video: {filename}")
        return True
    
    def update_image(self, filename: str, title: Optional[str] = None,
                     description: Optional[str] = None):
        """Update image metadata"""
        if filename not in self.metadata['images']:
            print(f"❌ Image {filename} not found")
            return False
        
        if title is not None:
            self.metadata['images'][filename]['title'] = title
        
        if description is not None:
            self.metadata['images'][filename]['desc'] = description
        
        self.metadata['images'][filename]['updated'] = datetime.now().isoformat()
        print(f"✅ Updated image: {filename}")
        return True
    
    def delete_video(self, filename: str, remove_file: bool = False):
        """Delete video from catalog"""
        if filename not in self.metadata['videos']:
            print(f"⚠️  Video {filename} not in catalog")
            return False
        
        # Remove from catalog
        del self.metadata['videos'][filename]
        
        # Add to deleted list to prevent re-adding
        deleted_key = f"video:{filename}"
        if deleted_key not in self.metadata['deleted']:
            self.metadata['deleted'].append(deleted_key)
        
        # Optionally remove actual file
        if remove_file:
            file_path = self.videos_path / filename
            if file_path.exists():
                file_path.unlink()
                print(f"🗑️  Deleted file: {filename}")
        
        print(f"✅ Removed video from catalog: {filename}")
        return True
    
    def delete_image(self, filename: str, remove_file: bool = False):
        """Delete image from catalog"""
        if filename not in self.metadata['images']:
            print(f"⚠️  Image {filename} not in catalog")
            return False
        
        # Remove from catalog
        del self.metadata['images'][filename]
        
        # Add to deleted list to prevent re-adding
        deleted_key = f"image:{filename}"
        if deleted_key not in self.metadata['deleted']:
            self.metadata['deleted'].append(deleted_key)
        
        # Optionally remove actual file
        if remove_file:
            file_path = self.images_path / filename
            if file_path.exists():
                file_path.unlink()
                print(f"🗑️  Deleted file: {filename}")
        
        print(f"✅ Removed image from catalog: {filename}")
        return True
    
    def generate_catalog_js(self):
        """Generate media-catalog.js file"""
        print("📝 Generating media-catalog.js...")
        
        # Prepare video list
        video_list = []
        for filename, data in self.metadata['videos'].items():
            if data.get('title') or data.get('desc'):
                video_list.append({
                    'file': filename,
                    'title': data.get('title', ''),
                    'desc': data.get('desc', '')
                })
            else:
                video_list.append(filename)
        
        # Prepare image list
        image_list = []
        for filename, data in self.metadata['images'].items():
            if data.get('title') or data.get('desc'):
                image_list.append({
                    'file': filename,
                    'title': data.get('title', ''),
                    'desc': data.get('desc', '')
                })
            else:
                image_list.append(filename)
        
        # Generate JavaScript content
        js_content = f"""// Media catalog - Auto-generated by catalog_manager.py
// Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// DO NOT EDIT MANUALLY - Run 'python scripts/catalog_manager.py' to update

const mediaCatalog = {{
    videos: {json.dumps(video_list, indent=8)},
    images: {json.dumps(image_list, indent=8)}
}};

// Storage-based catalog loading for instant updates from admin panel
async function getStorageCatalog() {{
    try {{
        const videosData = await window.storage.get('media-videos');
        const imagesData = await window.storage.get('media-images');
        
        return {{
            videos: videosData && videosData.value ? JSON.parse(videosData.value) : mediaCatalog.videos,
            images: imagesData && imagesData.value ? JSON.parse(imagesData.value) : mediaCatalog.images
        }};
    }} catch (error) {{
        console.log('Using fallback catalog');
        return mediaCatalog;
    }}
}}
"""
        
        # Write to file
        with open(self.catalog_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print(f"✅ Generated {self.catalog_file}")
        print(f"   📹 Videos: {len(video_list)}")
        print(f"   🖼️  Images: {len(image_list)}")
    
    def _generate_title(self, filename: str) -> str:
        """Generate title from filename"""
        # Remove extension
        name = Path(filename).stem
        
        # Replace underscores and hyphens with spaces
        name = name.replace('_', ' ').replace('-', ' ')
        
        # Title case
        name = name.title()
        
        return name
    
    def save(self):
        """Save metadata and regenerate catalog"""
        self._save_metadata()
        self.generate_catalog_js()
        print("✅ All changes saved!")
    
    def stats(self):
        """Show catalog statistics"""
        print("\n📊 Catalog Statistics")
        print("=" * 50)
        print(f"Videos: {len(self.metadata['videos'])}")
        print(f"Images: {len(self.metadata['images'])}")
        print(f"Deleted items: {len(self.metadata['deleted'])}")
        print(f"Last updated: {self.metadata.get('last_updated', 'Never')}")
        print("=" * 50)


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Lite Media Gallery Content Management System'
    )
    
    parser.add_argument(
        'action',
        choices=['scan', 'stats', 'save', 'add', 'update', 'delete'],
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
    if args.action == 'scan':
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
