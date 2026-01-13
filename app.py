#!/usr/bin/env python3
"""
Lite Media Gallery - Unified Application Entry Point
Single command: python app.py

Architecture:
- Server starts immediately (port 8000)
- Boot sequence runs in background
- Python stays alive as persistent authority
- Handles admin operations via API
"""

import os
import sys
import json
import threading
import time
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
from cms import MediaCatalog

# Configuration
PORT = int(os.environ.get('PORT', 8000))
HOST = os.environ.get('HOST', '0.0.0.0')  # Bind to all interfaces for Termux
BASE_DIR = Path(__file__).parent.resolve()

# Initialize Flask app
app = Flask(__name__, 
            static_folder=str(BASE_DIR),
            static_url_path='')

# Global CMS instance (persistent authority)
cms = None
boot_complete = threading.Event()
boot_error = None


# ============================================================================
# BOOT SEQUENCE (Background Thread)
# ============================================================================

def boot_sequence():
    """
    Background boot sequence
    Runs while server is already available
    """
    global cms, boot_error
    
    print("\n" + "="*60)
    print("🚀 BOOT SEQUENCE STARTING (Background)")
    print("="*60)
    
    try:
        # Initialize CMS
        cms = MediaCatalog(base_path=str(BASE_DIR))
        
        # Run full boot scan
        success = cms.boot_scan()
        
        if success:
            boot_complete.set()
            print("\n✅ BOOT COMPLETE - System Ready")
            print("="*60 + "\n")
        else:
            boot_error = "Boot scan failed"
            print("\n❌ BOOT FAILED")
            print("="*60 + "\n")
            
    except Exception as e:
        boot_error = f"Boot error: {str(e)}"
        print(f"\n❌ BOOT ERROR: {e}")
        print("="*60 + "\n")


# ============================================================================
# STATIC FILE SERVING
# ============================================================================

@app.route('/')
def index():
    """Serve main gallery page"""
    return send_from_directory(str(BASE_DIR), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve any static file"""
    return send_from_directory(str(BASE_DIR), path)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/boot-status')
def boot_status():
    """
    Get current boot status
    Frontend polls this during boot sequence
    """
    # Read from boot_status.json if exists
    boot_status_file = BASE_DIR / 'data' / 'boot_status.json'
    
    if boot_status_file.exists():
        try:
            with open(boot_status_file, 'r') as f:
                status = json.load(f)
                return jsonify(status)
        except:
            pass
    
    # Fallback status
    if boot_error:
        return jsonify({
            'state': 'error',
            'message': boot_error,
            'ready': False,
            'timestamp': datetime.now().isoformat()
        })
    elif boot_complete.is_set():
        return jsonify({
            'state': 'ready',
            'message': 'System ready',
            'ready': True,
            'timestamp': datetime.now().isoformat()
        })
    else:
        return jsonify({
            'state': 'initializing',
            'message': 'Boot in progress...',
            'ready': False,
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/media')
def get_media():
    """
    Get media catalog
    Returns data/media.json content
    """
    media_file = BASE_DIR / 'data' / 'media.json'
    
    if not media_file.exists():
        return jsonify({'error': 'Media catalog not found'}), 404
    
    try:
        with open(media_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/update', methods=['POST'])
def update_media():
    """
    Update media item (title/description)
    POST body: { "type": "video|image", "filename": "...", "title": "...", "desc": "..." }
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    media_type = data.get('type')
    filename = data.get('filename')
    title = data.get('title')
    desc = data.get('desc')
    
    if not media_type or not filename:
        return jsonify({'error': 'Missing type or filename'}), 400
    
    try:
        if media_type == 'video':
            success = cms.update_video(filename, title, desc)
        elif media_type == 'image':
            success = cms.update_image(filename, title, desc)
        else:
            return jsonify({'error': 'Invalid media type'}), 400
        
        if success:
            cms.save()
            return jsonify({'success': True, 'message': 'Updated successfully'})
        else:
            return jsonify({'error': 'Item not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/delete', methods=['POST'])
def delete_media():
    """
    Delete media item
    POST body: { "type": "video|image", "filename": "...", "removeFile": true|false }
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    media_type = data.get('type')
    filename = data.get('filename')
    remove_file = data.get('removeFile', False)
    
    if not media_type or not filename:
        return jsonify({'error': 'Missing type or filename'}), 400
    
    try:
        if media_type == 'video':
            success = cms.delete_video(filename, remove_file)
        elif media_type == 'image':
            success = cms.delete_image(filename, remove_file)
        else:
            return jsonify({'error': 'Invalid media type'}), 400
        
        if success:
            cms.save()
            return jsonify({'success': True, 'message': 'Deleted successfully'})
        else:
            return jsonify({'error': 'Item not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/rescan', methods=['POST'])
def rescan_media():
    """
    Trigger manual rescan
    Useful after dropping new files
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    try:
        result = cms.scan_media(auto_add=True)
        cms.save()
        
        return jsonify({
            'success': True,
            'new_videos': result['new_videos'],
            'new_images': result['new_images']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-links', methods=['GET'])
def get_cloud_links():
    """
    Get all cloud storage links
    Returns cloud_links from data/media.json
    """
    media_file = BASE_DIR / 'data' / 'media.json'
    
    if not media_file.exists():
        return jsonify({'cloud_links': []})
    
    try:
        with open(media_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify({'cloud_links': data.get('cloud_links', [])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-links/add', methods=['POST'])
def add_cloud_link():
    """
    Add a cloud storage link
    POST body: { "url": "...", "title": "...", "desc": "...", "type": "video|image" }
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    url = data.get('url', '').strip()
    title = data.get('title', '').strip()
    desc = data.get('desc', '').strip()
    media_type = data.get('type', 'video').strip()
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        media_file = BASE_DIR / 'data' / 'media.json'
        
        # Load existing data
        with open(media_file, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        
        # Create new cloud link entry
        new_link = {
            'id': f'cl_{int(time.time())}_{len(catalog.get("cloud_links", []))}',
            'url': url,
            'title': title or url,
            'desc': desc,
            'type': media_type,
            'created': int(time.time())
        }
        
        # Add to cloud_links array
        if 'cloud_links' not in catalog:
            catalog['cloud_links'] = []
        catalog['cloud_links'].append(new_link)
        catalog['last_updated'] = datetime.now().isoformat()
        
        # Save
        with open(media_file, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2)
        
        return jsonify({'success': True, 'link': new_link})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-links/delete', methods=['POST'])
def delete_cloud_link():
    """
    Delete a cloud storage link
    POST body: { "id": "..." }
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    link_id = data.get('id')
    if not link_id:
        return jsonify({'error': 'Link ID is required'}), 400
    
    try:
        media_file = BASE_DIR / 'data' / 'media.json'
        
        # Load existing data
        with open(media_file, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        
        # Find and remove link
        cloud_links = catalog.get('cloud_links', [])
        original_count = len(cloud_links)
        cloud_links = [link for link in cloud_links if link.get('id') != link_id]
        
        if len(cloud_links) == original_count:
            return jsonify({'error': 'Link not found'}), 404
        
        catalog['cloud_links'] = cloud_links
        catalog['last_updated'] = datetime.now().isoformat()
        
        # Save
        with open(media_file, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2)
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/upload', methods=['POST'])
def upload_media():
    """
    Upload media file
    Multipart form data with 'file' field
    """
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # Secure filename
    filename = secure_filename(file.filename)
    
    # Determine media type from extension
    ext = Path(filename).suffix.lower()
    video_exts = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
    
    if ext in video_exts:
        upload_path = BASE_DIR / 'media' / 'videos' / 'sd' / filename
    elif ext in image_exts:
        upload_path = BASE_DIR / 'media' / 'images' / 'full' / filename
    else:
        return jsonify({'error': 'Unsupported file type'}), 400
    
    # Check if file exists
    if upload_path.exists():
        return jsonify({'error': 'File already exists'}), 409
    
    try:
        # Save file
        file.save(str(upload_path))
        
        # Add to catalog
        if ext in video_exts:
            cms.add_video(filename)
        else:
            cms.add_image(filename)
        
        cms.save()
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'File uploaded successfully'
        })
        
    except Exception as e:
        # Clean up file if catalog add failed
        if upload_path.exists():
            upload_path.unlink()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# FILE WATCHER (Optional - can be enabled via flag)
# ============================================================================

def start_file_watcher():
    """
    Watch media folders for changes
    Triggers automatic rescan when files are added
    """
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
        
        class MediaFileHandler(FileSystemEventHandler):
            def __init__(self):
                self.last_scan = 0
                self.cooldown = 2  # seconds
            
            def on_created(self, event):
                if event.is_directory:
                    return
                
                # Cooldown to avoid multiple scans
                current_time = time.time()
                if current_time - self.last_scan < self.cooldown:
                    return
                
                self.last_scan = current_time
                file_path = Path(event.src_path)
                
                print(f"\n🆕 New file detected: {file_path.name}")
                
                # Rescan
                if cms and boot_complete.is_set():
                    result = cms.scan_media(auto_add=True)
                    if result['new_videos'] or result['new_images']:
                        cms.save()
                        print("✅ Catalog updated automatically\n")
        
        observer = Observer()
        handler = MediaFileHandler()
        
        # Watch folders
        videos_path = BASE_DIR / 'media' / 'videos' / 'sd'
        images_path = BASE_DIR / 'media' / 'images' / 'full'
        
        if videos_path.exists():
            observer.schedule(handler, str(videos_path), recursive=False)
        if images_path.exists():
            observer.schedule(handler, str(images_path), recursive=False)
        
        observer.start()
        print("👁️  File watching enabled")
        return observer
        
    except ImportError:
        print("⚠️  watchdog not installed - file watching disabled")
        print("   Install: pip install watchdog")
        return None


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """
    Main entry point
    Single command: python app.py
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Lite Media Gallery - Unified Application'
    )
    parser.add_argument('--port', type=int, default=PORT,
                       help='Port to run server on')
    parser.add_argument('--host', default=HOST,
                       help='Host to bind to (default: 0.0.0.0 for Termux)')
    parser.add_argument('--no-watch', action='store_true',
                       help='Disable file watching')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug mode')
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("🚀 LITE MEDIA GALLERY")
    print("="*60)
    print(f"📁 Directory: {BASE_DIR}")
    print(f"🌐 Server: http://{args.host}:{args.port}")
    print(f"📱 Mobile: http://<your-ip>:{args.port}")
    print("="*60)
    print("\n→ Server starting immediately...")
    print("→ Boot sequence will run in background...")
    print("→ Watch for 'BOOT COMPLETE' message\n")
    
    # Start boot sequence in background
    boot_thread = threading.Thread(target=boot_sequence, daemon=True)
    boot_thread.start()
    
    # Start file watcher if enabled
    observer = None
    if not args.no_watch:
        observer = start_file_watcher()
    
    # Start Flask server (blocks here)
    try:
        app.run(
            host=args.host,
            port=args.port,
            debug=args.debug,
            use_reloader=False  # Don't use reloader (conflicts with threads)
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        if observer:
            observer.stop()
            observer.join()
        print("✅ Server stopped")


if __name__ == '__main__':
    main()
