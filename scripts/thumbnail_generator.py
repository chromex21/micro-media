#!/usr/bin/env python3
"""
Thumbnail generator for videos and images
Optimizes media for faster gallery loading
"""

import os
import sys
from pathlib import Path
from PIL import Image
import subprocess
from typing import Optional

class ThumbnailGenerator:
    """Generate thumbnails for media files"""
    
    def __init__(self, base_path: str = ".."):
        self.base_path = Path(base_path).resolve()
        self.media_path = self.base_path / "media"
        
        # Thumbnail directories
        self.video_thumbs = self.media_path / "videos" / "thumbs"
        self.image_thumbs = self.media_path / "images" / "thumbs"
        
        # Create thumb directories
        self.video_thumbs.mkdir(parents=True, exist_ok=True)
        self.image_thumbs.mkdir(parents=True, exist_ok=True)
        
        # Thumbnail size
        self.thumb_size = (400, 400)
        self.thumb_quality = 85
    
    def generate_image_thumbnail(self, image_path: Path, 
                                output_path: Optional[Path] = None) -> Optional[Path]:
        """Generate thumbnail for image"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Create thumbnail
                img.thumbnail(self.thumb_size, Image.Resampling.LANCZOS)
                
                # Output path
                if output_path is None:
                    output_path = self.image_thumbs / f"{image_path.stem}_thumb.jpg"
                
                # Save
                img.save(output_path, "JPEG", quality=self.thumb_quality, optimize=True)
                
                print(f"✅ Generated image thumbnail: {output_path.name}")
                return output_path
        
        except Exception as e:
            print(f"❌ Failed to generate thumbnail for {image_path.name}: {e}")
            return None
    
    def generate_video_thumbnail(self, video_path: Path,
                                output_path: Optional[Path] = None) -> Optional[Path]:
        """Generate thumbnail from video using ffmpeg"""
        try:
            # Output path
            if output_path is None:
                output_path = self.video_thumbs / f"{video_path.stem}_thumb.jpg"
            
            # Check if ffmpeg is available
            try:
                subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("⚠️  ffmpeg not found, skipping video thumbnail")
                return None
            
            # Extract frame at 1 second
            cmd = [
                'ffmpeg',
                '-i', str(video_path),
                '-ss', '00:00:01.000',
                '-vframes', '1',
                '-vf', f'scale={self.thumb_size[0]}:{self.thumb_size[1]}:force_original_aspect_ratio=decrease',
                '-y',  # Overwrite
                str(output_path)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Generated video thumbnail: {output_path.name}")
                return output_path
            else:
                print(f"❌ Failed to generate video thumbnail: {result.stderr}")
                return None
        
        except Exception as e:
            print(f"❌ Failed to generate thumbnail for {video_path.name}: {e}")
            return None
    
    def generate_all(self):
        """Generate thumbnails for all media"""
        print("🖼️  Generating thumbnails...")
        
        video_count = 0
        image_count = 0
        
        # Process videos
        videos_path = self.media_path / "videos" / "sd"
        if videos_path.exists():
            for video in videos_path.glob('*'):
                if video.suffix.lower() in ['.mp4', '.webm', '.mov']:
                    thumb_path = self.video_thumbs / f"{video.stem}_thumb.jpg"
                    
                    # Skip if thumbnail exists
                    if thumb_path.exists():
                        continue
                    
                    if self.generate_video_thumbnail(video):
                        video_count += 1
        
        # Process images
        images_path = self.media_path / "images" / "full"
        if images_path.exists():
            for image in images_path.glob('*'):
                if image.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    thumb_path = self.image_thumbs / f"{image.stem}_thumb.jpg"
                    
                    # Skip if thumbnail exists
                    if thumb_path.exists():
                        continue
                    
                    if self.generate_image_thumbnail(image):
                        image_count += 1
        
        print(f"\n✅ Generated {video_count} video thumbnails")
        print(f"✅ Generated {image_count} image thumbnails")


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate thumbnails for media')
    parser.add_argument('--video', help='Generate thumbnail for specific video')
    parser.add_argument('--image', help='Generate thumbnail for specific image')
    parser.add_argument('--all', action='store_true', help='Generate all missing thumbnails')
    
    args = parser.parse_args()
    
    generator = ThumbnailGenerator()
    
    if args.all:
        generator.generate_all()
    elif args.video:
        video_path = Path(args.video)
        generator.generate_video_thumbnail(video_path)
    elif args.image:
        image_path = Path(args.image)
        generator.generate_image_thumbnail(image_path)
    else:
        print("Specify --all, --video FILE, or --image FILE")


if __name__ == '__main__':
    main()
