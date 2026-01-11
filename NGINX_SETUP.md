# Lite Media - Nginx Configuration Guide for Termux

## Installation Steps

### 1. Install Nginx in Termux
```bash
pkg update
pkg install nginx
```

### 2. Create nginx config
Edit: `$PREFIX/etc/nginx/nginx.conf`

```nginx
worker_processes 1;

events {
    worker_connections 256;
}

http {
    include mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    
    server {
        listen 8080;
        server_name localhost;
        
        # Point to your lite media directory
        root /data/data/com.termux/files/home/lite-media;
        
        index index.html;
        
        # Enable directory listing for media folders (required for auto-discovery)
        location /media/ {
            autoindex on;
            autoindex_format html;
        }
        
        # Serve static files
        location / {
            try_files $uri $uri/ =404;
        }
        
        # Cache media files
        location ~* \.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 3. Directory Setup
```bash
# Create lite-media directory in home
cd ~
mkdir lite-media

# Copy your files
cp -r /path/to/your/files/* lite-media/

# Create media directories if they don't exist
mkdir -p lite-media/media/images/full
mkdir -p lite-media/media/videos/sd
```

### 4. Start Nginx
```bash
nginx
```

### 5. Access Your Site
Open browser: `http://localhost:8080`

Or from another device on same network: `http://YOUR_PHONE_IP:8080`

### 6. Stop Nginx
```bash
nginx -s stop
```

### 7. Restart Nginx (after config changes)
```bash
nginx -s reload
```

## How It Works

1. **autoindex on** - Enables directory listing for `/media/` folders
2. JavaScript reads the directory listing HTML
3. Parses filenames and creates gallery cards automatically
4. Videos use their first frame as thumbnail (generated in browser)
5. No need to edit `index.html` when adding new media

## Adding Media

Just drop files into:
- Images: `lite-media/media/images/full/`
- Videos: `lite-media/media/videos/sd/`

Refresh the page - they appear automatically!

## Troubleshooting

**Gallery is empty:**
- Check nginx is running: `pgrep nginx`
- Check config: `nginx -t`
- Verify autoindex is on in config
- Check file permissions: `ls -la lite-media/media/`

**Videos not playing:**
- Use MP4 format (H.264 codec)
- Keep files under 100MB for phone performance
- Use 720p or lower resolution

**Can't access from other devices:**
- Find phone IP: `ifconfig` or `ip addr`
- Make sure both devices on same WiFi
- Check firewall: Termux usually has no restrictions
