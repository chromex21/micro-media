#!/usr/bin/env python3
"""
Content Availability Tracker
Tracks what media is available: local, scheduled, or online-only

Shows users:
- What's downloaded locally
- What's scheduled to download
- What's available via cloud links only
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set


class AvailabilityTracker:
    """Track media availability across different sources"""
    
    def __init__(self, base_path: str = ".."):
        self.base_path = Path(base_path).resolve()
        self.data_path = self.base_path / "data"
        self.media_path = self.base_path / "media"
        
        # Data files
        self.media_json = self.data_path / "media.json"
        self.availability_json = self.data_path / "availability.json"
        self.schedule_json = self.data_path / "download_schedule.json"
        
        # Load data
        self.catalog = self._load_catalog()
        self.availability = self._load_availability()
        self.schedule = self._load_schedule()
    
    def _load_catalog(self) -> Dict:
        """Load media catalog"""
        if self.media_json.exists():
            try:
                with open(self.media_json, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            "videos": [],
            "images": [],
            "cloud_links": []
        }
    
    def _load_availability(self) -> Dict:
        """Load availability tracking"""
        if self.availability_json.exists():
            try:
                with open(self.availability_json, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            "local": [],
            "scheduled": [],
            "online_only": [],
            "last_updated": None
        }
    
    def _save_availability(self):
        """Save availability data"""
        self.availability['last_updated'] = datetime.now().isoformat()
        
        with open(self.availability_json, 'w', encoding='utf-8') as f:
            json.dump(self.availability, f, indent=2, ensure_ascii=False)
    
    def _load_schedule(self) -> List[Dict]:
        """Load download schedule"""
        if self.schedule_json.exists():
            try:
                with open(self.schedule_json, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return []
    
    def _save_schedule(self):
        """Save download schedule"""
        with open(self.schedule_json, 'w', encoding='utf-8') as f:
            json.dump(self.schedule, f, indent=2, ensure_ascii=False)
    
    def scan_availability(self) -> Dict:
        """Scan and update availability status"""
        print("\n" + "="*60)
        print("🔍 SCANNING MEDIA AVAILABILITY")
        print("="*60)
        
        # Get all media IDs
        local_videos = {v['id']: v for v in self.catalog.get('videos', [])}
        local_images = {i['id']: i for i in self.catalog.get('images', [])}
        cloud_links = {c['id']: c for c in self.catalog.get('cloud_links', [])}
        
        # Check filesystem
        local_files: Set[str] = set()
        
        # Scan videos
        video_path = self.media_path / "videos" / "sd"
        if video_path.exists():
            for file in video_path.iterdir():
                if file.is_file():
                    # Find matching catalog entry
                    for vid_id, vid_data in local_videos.items():
                        if vid_data['file'] == file.name:
                            local_files.add(vid_id)
        
        # Scan images
        image_path = self.media_path / "images" / "full"
        if image_path.exists():
            for file in image_path.iterdir():
                if file.is_file():
                    # Find matching catalog entry
                    for img_id, img_data in local_images.items():
                        if img_data['file'] == file.name:
                            local_files.add(img_id)
        
        # Get scheduled downloads
        scheduled_ids = {item['id'] for item in self.schedule}
        
        # Categorize all media
        local_items = []
        scheduled_items = []
        online_only_items = []
        
        # Check videos
        for vid_id, vid_data in local_videos.items():
            if vid_id in local_files:
                local_items.append({
                    'id': vid_id,
                    'title': vid_data['title'],
                    'type': 'video',
                    'file': vid_data['file']
                })
            elif vid_id in scheduled_ids:
                scheduled_items.append({
                    'id': vid_id,
                    'title': vid_data['title'],
                    'type': 'video'
                })
            else:
                online_only_items.append({
                    'id': vid_id,
                    'title': vid_data['title'],
                    'type': 'video'
                })
        
        # Check images
        for img_id, img_data in local_images.items():
            if img_id in local_files:
                local_items.append({
                    'id': img_id,
                    'title': img_data['title'],
                    'type': 'image',
                    'file': img_data['file']
                })
            elif img_id in scheduled_ids:
                scheduled_items.append({
                    'id': img_id,
                    'title': img_data['title'],
                    'type': 'image'
                })
            else:
                online_only_items.append({
                    'id': img_id,
                    'title': img_data['title'],
                    'type': 'image'
                })
        
        # Cloud links are always online-only unless downloaded
        for cloud_id, cloud_data in cloud_links.items():
            online_only_items.append({
                'id': cloud_id,
                'title': cloud_data['title'],
                'type': 'cloud_link',
                'url': cloud_data['url']
            })
        
        # Update availability
        self.availability = {
            "local": local_items,
            "scheduled": scheduled_items,
            "online_only": online_only_items,
            "last_updated": datetime.now().isoformat()
        }
        
        self._save_availability()
        
        # Print summary
        print(f"\n📊 Availability Summary:")
        print(f"  💾 Local: {len(local_items)} items")
        print(f"  📅 Scheduled: {len(scheduled_items)} items")
        print(f"  ☁️  Online Only: {len(online_only_items)} items")
        print(f"  📈 Total: {len(local_items) + len(scheduled_items) + len(online_only_items)} items")
        
        print("\n" + "="*60 + "\n")
        
        return self.availability
    
    def schedule_download(self, media_id: str, priority: int = 5):
        """Schedule a media item for download"""
        # Check if already scheduled
        if any(item['id'] == media_id for item in self.schedule):
            print(f"ℹ️  {media_id} already scheduled")
            return
        
        # Check if already local
        if any(item['id'] == media_id for item in self.availability.get('local', [])):
            print(f"ℹ️  {media_id} already available locally")
            return
        
        # Add to schedule
        schedule_item = {
            'id': media_id,
            'priority': priority,
            'scheduled_date': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        self.schedule.append(schedule_item)
        self._save_schedule()
        
        print(f"✅ Scheduled {media_id} for download (priority: {priority})")
    
    def unschedule_download(self, media_id: str):
        """Remove item from download schedule"""
        self.schedule = [item for item in self.schedule if item['id'] != media_id]
        self._save_schedule()
        
        print(f"✅ Removed {media_id} from schedule")
    
    def list_scheduled(self):
        """List all scheduled downloads"""
        print("\n📅 SCHEDULED DOWNLOADS")
        print("="*60)
        
        if not self.schedule:
            print("No items scheduled")
            return
        
        # Sort by priority (higher = more urgent)
        sorted_schedule = sorted(self.schedule, key=lambda x: x['priority'], reverse=True)
        
        for item in sorted_schedule:
            print(f"\n{item['id']}")
            print(f"  Priority: {item['priority']}")
            print(f"  Status: {item['status']}")
            print(f"  Scheduled: {item['scheduled_date']}")
        
        print("\n" + "="*60 + "\n")
    
    def generate_feed_metadata(self):
        """Generate metadata for frontend feed display"""
        metadata = {
            'availability': self.availability,
            'download_queue': len(self.schedule),
            'local_count': len(self.availability.get('local', [])),
            'online_count': len(self.availability.get('online_only', [])),
            'scheduled_count': len(self.availability.get('scheduled', [])),
            'last_updated': datetime.now().isoformat()
        }
        
        # Save for frontend consumption
        metadata_file = self.data_path / "feed_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Generated feed metadata: {metadata_file}")
        return metadata


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Content Availability Tracker'
    )
    
    parser.add_argument(
        'action',
        choices=['scan', 'schedule', 'unschedule', 'list', 'metadata'],
        help='Action to perform'
    )
    
    parser.add_argument('--id', help='Media ID')
    parser.add_argument('--priority', type=int, default=5,
                       help='Download priority (1-10, higher = more urgent)')
    
    args = parser.parse_args()
    
    tracker = AvailabilityTracker()
    
    if args.action == 'scan':
        tracker.scan_availability()
    
    elif args.action == 'schedule':
        if not args.id:
            print("❌ --id required")
            return
        
        tracker.schedule_download(args.id, args.priority)
    
    elif args.action == 'unschedule':
        if not args.id:
            print("❌ --id required")
            return
        
        tracker.unschedule_download(args.id)
    
    elif args.action == 'list':
        tracker.list_scheduled()
    
    elif args.action == 'metadata':
        tracker.generate_feed_metadata()


if __name__ == '__main__':
    main()
