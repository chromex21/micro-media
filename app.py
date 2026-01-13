#!/usr/bin/env python3
"""
Lite Media Gallery - Unified Application Entry Point
Single command: python app.py

IMPROVEMENTS:
- Security: Token-based authentication for write operations
- Optimization: In-memory caching for media catalog
- Error Recovery: Automatic retry on boot failure
- Rate limiting: Protection against abuse
- Request logging: Better debugging
- File size limits: Prevent memory issues
- Concurrent operation safety: Threading locks

Architecture:
- Server starts immediately (port 8000)
- Boot sequence runs in background with retry
- Python stays alive as persistent authority
- Handles admin operations via API
"""

import os
import sys
import json
import threading
import time
from pathlib import Path
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
import hashlib

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))
from cms import MediaCatalog
from integrity_check import IntegrityChecker

# ============================================================================
# CONFIGURATION
# ============================================================================

PORT = int(os.environ.get('PORT', 8000))
HOST = os.environ.get('HOST', '0.0.0.0')  # Bind to all interfaces for Termux
BASE_DIR = Path(__file__).parent.resolve()

# SECURITY: Set ADMIN_TOKEN in environment or it will auto-generate
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN')
if not ADMIN_TOKEN:
    # Auto-generate secure token on first run
    ADMIN_TOKEN = hashlib.sha256(str(time.time()).encode()).hexdigest()[:32]
    print(f"\n⚠️  No ADMIN_TOKEN set. Generated: {ADMIN_TOKEN}")
    print("   Set it in environment: export ADMIN_TOKEN='your-secret-token'")
    print("   Or use in requests: ?token={ADMIN_TOKEN}\n")

# File upload limits
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
MAX_UPLOAD_FILES = 10  # Max concurrent uploads

# Cache settings
CACHE_ENABLED = True
CACHE_TTL = 300  # 5 minutes

# Rate limiting (simple in-memory)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100  # requests per window

# Boot retry settings
MAX_BOOT_RETRIES = 3
BOOT_RETRY_DELAY = 5  # seconds

# Initialize Flask app
app = Flask(__name__, 
            static_folder=str(BASE_DIR),
            static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# ============================================================================
# GLOBAL STATE
# ============================================================================

# CMS instance (persistent authority)
cms = None
boot_complete = threading.Event()
boot_error = None
boot_attempts = 0

# Thread safety
cms_lock = threading.RLock()  # Reentrant lock for nested operations
upload_semaphore = threading.Semaphore(MAX_UPLOAD_FILES)

# In-memory cache
media_cache = {
    'data': None,
    'timestamp': None,
    'lock': threading.Lock()
}

# Rate limiting storage
rate_limit_storage = {}
rate_limit_lock = threading.Lock()


# ============================================================================
# SECURITY MIDDLEWARE
# ============================================================================

def require_auth(f):
    """Decorator to require authentication for write operations"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for token in header (preferred)
        token = request.headers.get('X-Admin-Token')
        
        # Or check for query parameter (less secure, but convenient)
        if not token:
            token = request.args.get('token')
        
        # Or check JSON body
        if not token and request.is_json:
            token = request.get_json(silent=True, force=True).get('token')
        
        if token != ADMIN_TOKEN:
            return jsonify({'error': 'Unauthorized - Invalid or missing token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


def check_rate_limit():
    """Simple rate limiting check"""
    if not hasattr(check_rate_limit, 'enabled') or not check_rate_limit.enabled:
        return True
    
    client_ip = request.remote_addr
    current_time = time.time()
    
    with rate_limit_lock:
        # Clean old entries
        expired_threshold = current_time - RATE_LIMIT_WINDOW
        rate_limit_storage[client_ip] = [
            ts for ts in rate_limit_storage.get(client_ip, [])
            if ts > expired_threshold
        ]
        
        # Check limit
        request_count = len(rate_limit_storage.get(client_ip, []))
        if request_count >= RATE_LIMIT_MAX_REQUESTS:
            return False
        
        # Add current request
        if client_ip not in rate_limit_storage:
            rate_limit_storage[client_ip] = []
        rate_limit_storage[client_ip].append(current_time)
        
        return True

check_rate_limit.enabled = True  # Can be toggled


# ============================================================================
# REQUEST LOGGING & MIDDLEWARE
# ============================================================================

@app.before_request
def before_request():
    """Log requests and check rate limiting"""
    # Log request
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {request.method} {request.path} from {request.remote_addr}")
    
    # Rate limiting check for API endpoints
    if request.path.startswith('/api/') and not check_rate_limit():
        return jsonify({'error': 'Rate limit exceeded. Try again later.'}), 429


@app.after_request
def after_request(response):
    """Add security headers"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'}), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    print(f"❌ Internal error: {e}")
    return jsonify({'error': 'Internal server error. Check logs.'}), 500


# ============================================================================
# CACHE MANAGEMENT
# ============================================================================

def get_cached_media():
    """Get media catalog from cache or disk"""
    if not CACHE_ENABLED:
        return load_media_from_disk()
    
    with media_cache['lock']:
        # Check if cache is valid
        if media_cache['data'] and media_cache['timestamp']:
            age = time.time() - media_cache['timestamp']
            if age < CACHE_TTL:
                return media_cache['data']
        
        # Load from disk and cache
        data = load_media_from_disk()
        media_cache['data'] = data
        media_cache['timestamp'] = time.time()
        return data


def invalidate_cache():
    """Invalidate media catalog cache"""
    with media_cache['lock']:
        media_cache['data'] = None
        media_cache['timestamp'] = None


def load_media_from_disk():
    """Load media catalog from disk"""
    media_file = BASE_DIR / 'data' / 'media.json'
    
    if not media_file.exists():
        return None
    
    try:
        with open(media_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading media.json: {e}")
        return None


# ============================================================================
# BOOT SEQUENCE (Background Thread with Retry)
# ============================================================================

def boot_sequence():
    """
    Background boot sequence with automatic retry
    Runs while server is already available
    """
    global cms, boot_error, boot_attempts
    
    print("\n" + "="*60)
    print("🚀 BOOT SEQUENCE STARTING (Background)")
    print("="*60)
    
    # Step 0: Integrity check
    print("\n🔍 Running integrity check...")
    try:
        checker = IntegrityChecker(BASE_DIR)
        is_healthy = checker.check()
        
        if not is_healthy:
            print("\n⚠️  System integrity issues detected")
            print("→ Attempting automatic repair...\n")
            checker.repair(auto_confirm=True)
            print("✅ Integrity restored\n")
        else:
            print("✅ Integrity check passed\n")
    except Exception as e:
        print(f"⚠️  Integrity check error (non-fatal): {e}\n")
    
    while boot_attempts < MAX_BOOT_RETRIES:
        boot_attempts += 1
        
        try:
            print(f"\n📍 Boot attempt {boot_attempts}/{MAX_BOOT_RETRIES}")
            
            # Initialize CMS with lock
            with cms_lock:
                cms = MediaCatalog(base_path=str(BASE_DIR))
                
                # Run full boot scan
                success = cms.boot_scan()
            
            if success:
                boot_complete.set()
                print("\n✅ BOOT COMPLETE - System Ready")
                print("="*60 + "\n")
                return
            else:
                raise Exception("Boot scan returned failure")
        
        except Exception as e:
            boot_error = f"Boot error (attempt {boot_attempts}): {str(e)}"
            print(f"\n❌ BOOT ERROR: {e}")
            
            if boot_attempts < MAX_BOOT_RETRIES:
                print(f"⏳ Retrying in {BOOT_RETRY_DELAY} seconds...")
                time.sleep(BOOT_RETRY_DELAY)
            else:
                print(f"\n❌ BOOT FAILED after {MAX_BOOT_RETRIES} attempts")
                print("="*60 + "\n")
                print("💡 Try:")
                print("   1. Check that media folders exist")
                print("   2. Verify data/media.json is valid JSON")
                print("   3. Run: python scripts/cms.py boot")
                return


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
    try:
        return send_from_directory(str(BASE_DIR), path)
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404


# ============================================================================
# API ENDPOINTS - READ OPERATIONS (No auth required)
# ============================================================================

@app.route('/api/boot-status')
def boot_status():
    """Get current boot status"""
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
            'attempts': boot_attempts,
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
            'message': f'Boot in progress (attempt {boot_attempts}/{MAX_BOOT_RETRIES})...',
            'ready': False,
            'attempts': boot_attempts,
            'timestamp': datetime.now().isoformat()
        })


@app.route('/api/media')
def get_media():
    """Get media catalog (cached)"""
    data = get_cached_media()
    
    if data is None:
        return jsonify({'error': 'Media catalog not found'}), 404
    
    return jsonify(data)


@app.route('/api/cloud-links', methods=['GET'])
def get_cloud_links():
    """Get all cloud storage links"""
    data = get_cached_media()
    
    if data is None:
        return jsonify({'cloud_links': []})
    
    return jsonify({'cloud_links': data.get('cloud_links', [])})


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'boot_complete': boot_complete.is_set(),
        'cache_enabled': CACHE_ENABLED,
        'timestamp': datetime.now().isoformat()
    })


# ============================================================================
# API ENDPOINTS - WRITE OPERATIONS (Auth required)
# ============================================================================

@app.route('/api/media/update', methods=['POST'])
@require_auth
def update_media():
    """Update media item (title/description) - AUTH REQUIRED"""
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
        with cms_lock:
            if media_type == 'video':
                success = cms.update_video(filename, title, desc)
            elif media_type == 'image':
                success = cms.update_image(filename, title, desc)
            else:
                return jsonify({'error': 'Invalid media type'}), 400
            
            if success:
                cms.save()
                invalidate_cache()
                return jsonify({'success': True, 'message': 'Updated successfully'})
            else:
                return jsonify({'error': 'Item not found'}), 404
    
    except Exception as e:
        print(f"❌ Update error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/delete', methods=['POST'])
@require_auth
def delete_media():
    """Delete media item - AUTH REQUIRED"""
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
        with cms_lock:
            if media_type == 'video':
                success = cms.delete_video(filename, remove_file)
            elif media_type == 'image':
                success = cms.delete_image(filename, remove_file)
            else:
                return jsonify({'error': 'Invalid media type'}), 400
            
            if success:
                cms.save()
                invalidate_cache()
                return jsonify({'success': True, 'message': 'Deleted successfully'})
            else:
                return jsonify({'error': 'Item not found'}), 404
    
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/rescan', methods=['POST'])
@require_auth
def rescan_media():
    """Trigger manual rescan - AUTH REQUIRED"""
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    try:
        with cms_lock:
            result = cms.scan_media(auto_add=True)
            cms.save()
            invalidate_cache()
        
        return jsonify({
            'success': True,
            'new_videos': result['new_videos'],
            'new_images': result['new_images']
        })
    except Exception as e:
        print(f"❌ Rescan error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-links/add', methods=['POST'])
@require_auth
def add_cloud_link():
    """Add a cloud storage link - AUTH REQUIRED"""
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
        
        with cms_lock:
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
            
            invalidate_cache()
        
        return jsonify({'success': True, 'link': new_link})
    
    except Exception as e:
        print(f"❌ Add cloud link error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cloud-links/delete', methods=['POST'])
@require_auth
def delete_cloud_link():
    """Delete a cloud storage link - AUTH REQUIRED"""
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
        
        with cms_lock:
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
            
            invalidate_cache()
        
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"❌ Delete cloud link error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/upload', methods=['POST'])
@require_auth
def upload_media():
    """Upload media file - AUTH REQUIRED"""
    if not cms or not boot_complete.is_set():
        return jsonify({'error': 'System not ready'}), 503
    
    # Use semaphore to limit concurrent uploads
    if not upload_semaphore.acquire(blocking=False):
        return jsonify({'error': f'Too many concurrent uploads. Maximum: {MAX_UPLOAD_FILES}'}), 429
    
    try:
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
            return jsonify({'error': f'Unsupported file type: {ext}'}), 400
        
        # Check if file exists
        if upload_path.exists():
            return jsonify({'error': 'File already exists'}), 409
        
        # Save file
        file.save(str(upload_path))
        
        # Add to catalog
        with cms_lock:
            if ext in video_exts:
                cms.add_video(filename)
            else:
                cms.add_image(filename)
            
            cms.save()
            invalidate_cache()
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'File uploaded successfully'
        })
    
    except Exception as e:
        # Clean up file if catalog add failed
        if 'upload_path' in locals() and upload_path.exists():
            upload_path.unlink()
        print(f"❌ Upload error: {e}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        upload_semaphore.release()


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.route('/api/admin/cache/clear', methods=['POST'])
@require_auth
def clear_cache():
    """Clear media catalog cache - AUTH REQUIRED"""
    invalidate_cache()
    return jsonify({'success': True, 'message': 'Cache cleared'})


@app.route('/api/admin/stats')
@require_auth
def admin_stats():
    """Get system statistics - AUTH REQUIRED"""
    data = get_cached_media()
    
    return jsonify({
        'boot_complete': boot_complete.is_set(),
        'boot_attempts': boot_attempts,
        'cache_enabled': CACHE_ENABLED,
        'cache_age': time.time() - media_cache['timestamp'] if media_cache['timestamp'] else None,
        'video_count': len(data.get('videos', [])) if data else 0,
        'image_count': len(data.get('images', [])) if data else 0,
        'deleted_count': len(data.get('deleted', [])) if data else 0,
        'cloud_links_count': len(data.get('cloud_links', [])) if data else 0,
        'timestamp': datetime.now().isoformat()
    })


# ============================================================================
# FILE WATCHER (Optional)
# ============================================================================

def start_file_watcher():
    """Watch media folders for changes"""
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
                    with cms_lock:
                        result = cms.scan_media(auto_add=True)
                        if result['new_videos'] or result['new_images']:
                            cms.save()
                            invalidate_cache()
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
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Lite Media Gallery - Unified Application (Enhanced)'
    )
    parser.add_argument('--port', type=int, default=PORT,
                       help='Port to run server on')
    parser.add_argument('--host', default=HOST,
                       help='Host to bind to (default: 0.0.0.0 for Termux)')
    parser.add_argument('--no-watch', action='store_true',
                       help='Disable file watching')
    parser.add_argument('--no-cache', action='store_true',
                       help='Disable caching')
    parser.add_argument('--no-rate-limit', action='store_true',
                       help='Disable rate limiting')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Apply settings
    global CACHE_ENABLED
    CACHE_ENABLED = not args.no_cache
    check_rate_limit.enabled = not args.no_rate_limit
    
    print("\n" + "="*60)
    print("🚀 LITE MEDIA GALLERY (ENHANCED)")
    print("="*60)
    print(f"📁 Directory: {BASE_DIR}")
    print(f"🌐 Server: http://{args.host}:{args.port}")
    print(f"📱 Mobile: http://<your-ip>:{args.port}")
    print("="*60)
    print("\n🔐 SECURITY FEATURES:")
    print(f"   • Token auth: {ADMIN_TOKEN}")
    print(f"   • Rate limiting: {'enabled' if check_rate_limit.enabled else 'disabled'}")
    print(f"   • Max file size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print(f"   • Max uploads: {MAX_UPLOAD_FILES} concurrent")
    print("\n⚡ PERFORMANCE:")
    print(f"   • Caching: {'enabled' if CACHE_ENABLED else 'disabled'} (TTL: {CACHE_TTL}s)")
    print(f"   • Boot retry: {MAX_BOOT_RETRIES} attempts")
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
            use_reloader=False,  # Don't use reloader (conflicts with threads)
            threaded=True  # Enable threading for concurrent requests
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        if observer:
            observer.stop()
            observer.join()
        print("✅ Server stopped")


if __name__ == '__main__':
    main()
