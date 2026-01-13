#!/usr/bin/env python3
"""
RSS Content Auto-Importer
Automatically pulls content from RSS feeds and adds to gallery

Features:
- Multiple RSS feed support
- Auto-import on schedule
- Duplicate detection
- Media URL extraction
- Cloud link creation
"""

import json
import time
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import xml.etree.ElementTree as ET


class RSSImporter:
    """Automated RSS content importer"""
    
    def __init__(self, base_path: str = ".."):
        self.base_path = Path(base_path).resolve()
        self.data_path = self.base_path / "data"
        
        # Configuration files
        self.feeds_config = self.data_path / "rss_feeds.json"
        self.import_log = self.data_path / "import_log.json"
        
        # Media catalog
        self.media_json = self.data_path / "media.json"
        
        # Ensure data path exists
        self.data_path.mkdir(parents=True, exist_ok=True)
        
        # Load configuration
        self.feeds = self._load_feeds()
        self.import_history = self._load_import_log()
    
    def _load_feeds(self) -> List[Dict]:
        """Load RSS feed configuration"""
        if self.feeds_config.exists():
            try:
                with open(self.feeds_config, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        # Default feeds (examples)
        return [
            {
                "id": "example_feed",
                "name": "Example Feed",
                "url": "https://example.com/feed.xml",
                "active": False,
                "last_sync": None,
                "item_count": 0
            }
        ]
    
    def _save_feeds(self):
        """Save feed configuration"""
        with open(self.feeds_config, 'w', encoding='utf-8') as f:
            json.dump(self.feeds, f, indent=2, ensure_ascii=False)
    
    def _load_import_log(self) -> Dict:
        """Load import history"""
        if self.import_log.exists():
            try:
                with open(self.import_log, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {"imported_urls": {}, "failed_urls": {}}
    
    def _save_import_log(self):
        """Save import history"""
        with open(self.import_log, 'w', encoding='utf-8') as f:
            json.dump(self.import_history, f, indent=2, ensure_ascii=False)
    
    def _load_media_catalog(self) -> Dict:
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
            "cloud_links": [],
            "deleted": [],
            "version": 1
        }
    
    def _save_media_catalog(self, catalog: Dict):
        """Save media catalog"""
        catalog['last_updated'] = datetime.now().isoformat()
        
        with open(self.media_json, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
    
    def _generate_url_hash(self, url: str) -> str:
        """Generate hash for URL deduplication"""
        return hashlib.md5(url.encode()).hexdigest()[:12]
    
    def fetch_rss(self, feed_url: str) -> Optional[List[Dict]]:
        """Fetch and parse RSS feed"""
        try:
            print(f"📡 Fetching {feed_url}...")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; LiteMediaBot/1.0)'
            }
            
            response = requests.get(feed_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Parse XML
            root = ET.fromstring(response.content)
            
            items = []
            
            # Handle different RSS/Atom formats
            if root.tag == '{http://www.w3.org/2005/Atom}feed':
                # Atom feed
                for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                    item = self._parse_atom_entry(entry)
                    if item:
                        items.append(item)
            else:
                # RSS feed
                for item_elem in root.findall('.//item'):
                    item = self._parse_rss_item(item_elem)
                    if item:
                        items.append(item)
            
            print(f"✅ Fetched {len(items)} items")
            return items
            
        except Exception as e:
            print(f"❌ Failed to fetch feed: {str(e)}")
            return None
    
    def _parse_rss_item(self, item_elem) -> Optional[Dict]:
        """Parse RSS item"""
        try:
            title = item_elem.findtext('title', '').strip()
            link = item_elem.findtext('link', '').strip()
            description = item_elem.findtext('description', '').strip()
            pub_date = item_elem.findtext('pubDate', '').strip()
            
            # Try to find media URL
            media_url = None
            
            # Check for media:content
            media_content = item_elem.find('.//{http://search.yahoo.com/mrss/}content')
            if media_content is not None:
                media_url = media_content.get('url')
            
            # Check for enclosure
            if not media_url:
                enclosure = item_elem.find('enclosure')
                if enclosure is not None:
                    media_url = enclosure.get('url')
            
            # Use link as fallback
            if not media_url:
                media_url = link
            
            return {
                'title': title,
                'url': media_url or link,
                'link': link,
                'description': description,
                'pub_date': pub_date,
                'type': self._detect_media_type(media_url or link)
            }
            
        except Exception as e:
            print(f"⚠️  Failed to parse item: {str(e)}")
            return None
    
    def _parse_atom_entry(self, entry) -> Optional[Dict]:
        """Parse Atom entry"""
        try:
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            title = entry.findtext('atom:title', '', namespaces=ns).strip()
            link_elem = entry.find('atom:link[@rel="alternate"]', namespaces=ns)
            link = link_elem.get('href') if link_elem is not None else ''
            description = entry.findtext('atom:summary', '', namespaces=ns).strip()
            pub_date = entry.findtext('atom:published', '', namespaces=ns).strip()
            
            return {
                'title': title,
                'url': link,
                'link': link,
                'description': description,
                'pub_date': pub_date,
                'type': self._detect_media_type(link)
            }
            
        except Exception as e:
            print(f"⚠️  Failed to parse entry: {str(e)}")
            return None
    
    def _detect_media_type(self, url: str) -> str:
        """Detect media type from URL"""
        url_lower = url.lower()
        
        # Video platforms
        if any(x in url_lower for x in ['youtube.com', 'youtu.be', 'vimeo.com']):
            return 'video'
        
        # Image extensions
        if any(url_lower.endswith(x) for x in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
            return 'image'
        
        # Video extensions
        if any(url_lower.endswith(x) for x in ['.mp4', '.webm', '.mov', '.avi']):
            return 'video'
        
        # Default to link
        return 'link'
    
    def import_feed(self, feed_id: str, max_items: int = 10) -> int:
        """Import items from a specific feed"""
        # Find feed
        feed = next((f for f in self.feeds if f['id'] == feed_id), None)
        
        if not feed:
            print(f"❌ Feed {feed_id} not found")
            return 0
        
        if not feed.get('active', False):
            print(f"⏸️  Feed {feed['name']} is not active")
            return 0
        
        print(f"\n🔄 Importing from: {feed['name']}")
        print(f"   URL: {feed['url']}")
        
        # Fetch feed
        items = self.fetch_rss(feed['url'])
        
        if not items:
            return 0
        
        # Load current catalog
        catalog = self._load_media_catalog()
        
        # Import items
        imported_count = 0
        
        for item in items[:max_items]:
            url_hash = self._generate_url_hash(item['url'])
            
            # Skip if already imported
            if url_hash in self.import_history['imported_urls']:
                continue
            
            # Add to catalog as cloud link
            cloud_link = {
                'id': f"rss_{url_hash}",
                'title': item['title'],
                'url': item['url'],
                'desc': item['description'],
                'source': feed['name'],
                'type': item['type'],
                'imported_from': 'rss',
                'imported_date': datetime.now().isoformat(),
                'pub_date': item.get('pub_date', '')
            }
            
            catalog['cloud_links'].append(cloud_link)
            
            # Record in import log
            self.import_history['imported_urls'][url_hash] = {
                'url': item['url'],
                'title': item['title'],
                'feed': feed['name'],
                'date': datetime.now().isoformat()
            }
            
            imported_count += 1
            print(f"  ✅ Imported: {item['title']}")
        
        # Update feed stats
        feed['last_sync'] = datetime.now().isoformat()
        feed['item_count'] = imported_count
        
        # Save everything
        if imported_count > 0:
            self._save_media_catalog(catalog)
            self._save_import_log()
            self._save_feeds()
            
            print(f"\n✅ Imported {imported_count} new items from {feed['name']}")
        else:
            print(f"\nℹ️  No new items from {feed['name']}")
        
        return imported_count
    
    def import_all_feeds(self, max_items_per_feed: int = 10) -> int:
        """Import from all active feeds"""
        print("\n" + "="*60)
        print("📡 AUTO-IMPORTING FROM RSS FEEDS")
        print("="*60)
        
        total_imported = 0
        
        active_feeds = [f for f in self.feeds if f.get('active', False)]
        
        if not active_feeds:
            print("⚠️  No active feeds configured")
            return 0
        
        for feed in active_feeds:
            count = self.import_feed(feed['id'], max_items_per_feed)
            total_imported += count
            
            # Small delay between feeds
            time.sleep(1)
        
        print("\n" + "="*60)
        print(f"✅ IMPORT COMPLETE - {total_imported} total items")
        print("="*60 + "\n")
        
        return total_imported
    
    def add_feed(self, name: str, url: str, active: bool = True):
        """Add new RSS feed"""
        feed_id = f"feed_{int(time.time())}"
        
        feed = {
            "id": feed_id,
            "name": name,
            "url": url,
            "active": active,
            "last_sync": None,
            "item_count": 0
        }
        
        self.feeds.append(feed)
        self._save_feeds()
        
        print(f"✅ Added feed: {name}")
        return feed_id
    
    def remove_feed(self, feed_id: str):
        """Remove RSS feed"""
        self.feeds = [f for f in self.feeds if f['id'] != feed_id]
        self._save_feeds()
        
        print(f"✅ Removed feed: {feed_id}")
    
    def list_feeds(self):
        """List all feeds"""
        print("\n📡 RSS FEEDS")
        print("="*60)
        
        if not self.feeds:
            print("No feeds configured")
            return
        
        for feed in self.feeds:
            status = "✅ Active" if feed.get('active') else "⏸️  Paused"
            last_sync = feed.get('last_sync', 'Never')
            
            print(f"\n{feed['name']}")
            print(f"  ID: {feed['id']}")
            print(f"  URL: {feed['url']}")
            print(f"  Status: {status}")
            print(f"  Last Sync: {last_sync}")
            print(f"  Items: {feed.get('item_count', 0)}")
        
        print("\n" + "="*60 + "\n")


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='RSS Content Auto-Importer'
    )
    
    parser.add_argument(
        'action',
        choices=['import', 'import-all', 'add', 'remove', 'list'],
        help='Action to perform'
    )
    
    parser.add_argument('--feed-id', help='Feed ID')
    parser.add_argument('--name', help='Feed name (for add)')
    parser.add_argument('--url', help='Feed URL (for add)')
    parser.add_argument('--max-items', type=int, default=10,
                       help='Maximum items to import per feed')
    
    args = parser.parse_args()
    
    importer = RSSImporter()
    
    if args.action == 'import':
        if not args.feed_id:
            print("❌ --feed-id required")
            return
        
        importer.import_feed(args.feed_id, args.max_items)
    
    elif args.action == 'import-all':
        importer.import_all_feeds(args.max_items)
    
    elif args.action == 'add':
        if not args.name or not args.url:
            print("❌ --name and --url required")
            return
        
        importer.add_feed(args.name, args.url)
    
    elif args.action == 'remove':
        if not args.feed_id:
            print("❌ --feed-id required")
            return
        
        importer.remove_feed(args.feed_id)
    
    elif args.action == 'list':
        importer.list_feeds()


if __name__ == '__main__':
    main()
