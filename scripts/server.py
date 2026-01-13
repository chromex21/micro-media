#!/usr/bin/env python3
"""
Simple HTTP server for development
Auto-reloads when media files change
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
PORT = 8000
DIRECTORY = Path(__file__).parent.parent.resolve()


class MediaFileHandler(FileSystemEventHandler):
    """Watch for changes in media folders"""
    
    def __init__(self, cms):
        self.cms = cms
        self.last_scan = 0
        self.cooldown = 2  # seconds
    
    def on_created(self, event):
        """Handle new files"""
        if event.is_directory:
            return
        
        # Cooldown to avoid multiple scans
        current_time = time.time()
        if current_time - self.last_scan < self.cooldown:
            return
        
        self.last_scan = current_time
        
        file_path = Path(event.src_path)
        print(f"\n🆕 New file detected: {file_path.name}")
        
        # Scan and update
        result = self.cms.scan_media(auto_add=True)
        if result['new_videos'] or result['new_images']:
            self.cms.save()
            print("✅ Catalog updated automatically\n")


class RequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with better logging"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def log_message(self, format, *args):
        """Custom logging"""
        if self.path.startswith('/media/'):
            # Only log media requests
            print(f"📁 {args[0]} - {self.path}")
        elif not self.path.startswith('/css/') and not self.path.startswith('/js/'):
            # Log page requests
            print(f"🌐 {args[0]} - {self.path}")


def start_file_watcher(cms):
    """Start watching media folders for changes"""
    print("👁️  Watching media folders for changes...")
    
    event_handler = MediaFileHandler(cms)
    observer = Observer()
    
    # Watch videos folder
    videos_path = DIRECTORY / "media" / "videos" / "sd"
    if videos_path.exists():
        observer.schedule(event_handler, str(videos_path), recursive=False)
    
    # Watch images folder
    images_path = DIRECTORY / "media" / "images" / "full"
    if images_path.exists():
        observer.schedule(event_handler, str(images_path), recursive=False)
    
    observer.start()
    return observer


def main():
    """Start development server"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Lite Media Gallery Development Server')
    parser.add_argument('--port', type=int, default=PORT, help='Port to run server on')
    parser.add_argument('--no-watch', action='store_true', help='Disable file watching')
    
    args = parser.parse_args()
    
    os.chdir(DIRECTORY)
    
    print("🚀 Lite Media Gallery - Development Server")
    print("=" * 50)
    print(f"📁 Directory: {DIRECTORY}")
    print(f"🌐 URL: http://localhost:{args.port}")
    print(f"📱 Mobile: http://<your-ip>:{args.port}")
    print("=" * 50)
    
    # Start file watcher if requested
    observer = None
    if not args.no_watch:
        try:
            from catalog_manager import MediaCatalog
            cms = MediaCatalog()
            observer = start_file_watcher(cms)
        except ImportError:
            print("⚠️  watchdog not installed, file watching disabled")
            print("   Install: pip install watchdog")
    
    # Start HTTP server
    with socketserver.TCPServer(("", args.port), RequestHandler) as httpd:
        print(f"\n✅ Server running on port {args.port}")
        print("   Press Ctrl+C to stop\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Shutting down server...")
            if observer:
                observer.stop()
                observer.join()
            print("✅ Server stopped")


if __name__ == '__main__':
    main()
