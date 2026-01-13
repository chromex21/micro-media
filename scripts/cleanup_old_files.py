#!/usr/bin/env python3
"""
Archive Old Scripts
Run ONLY after confirming new app.py works correctly

This script:
1. Creates scripts/archive/ folder
2. Moves old scripts to archive
3. Creates cleanup log
"""

import shutil
from pathlib import Path
from datetime import datetime

# Base directory
BASE_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = BASE_DIR / 'scripts'
ARCHIVE_DIR = SCRIPTS_DIR / 'archive'

# Files to archive
FILES_TO_ARCHIVE = [
    'catalog_manager.py',      # Old lite-tier CMS
    'server.py',                # Merged into app.py
    'deploy.py',                # No longer needed
]

def archive_files():
    """Archive old scripts"""
    print("🗄️  ARCHIVING OLD SCRIPTS")
    print("=" * 60)
    
    # Create archive directory
    ARCHIVE_DIR.mkdir(exist_ok=True)
    print(f"✅ Created: {ARCHIVE_DIR}")
    
    archived = []
    not_found = []
    
    for filename in FILES_TO_ARCHIVE:
        source = SCRIPTS_DIR / filename
        destination = ARCHIVE_DIR / filename
        
        if source.exists():
            shutil.move(str(source), str(destination))
            archived.append(filename)
            print(f"📦 Archived: {filename}")
        else:
            not_found.append(filename)
            print(f"⚠️  Not found: {filename}")
    
    # Create cleanup log
    create_cleanup_log(archived, not_found)
    
    print("\n" + "=" * 60)
    print("✅ ARCHIVE COMPLETE")
    print(f"   Archived: {len(archived)} files")
    print(f"   Location: {ARCHIVE_DIR}")
    print("=" * 60 + "\n")


def create_cleanup_log(archived, not_found):
    """Create log documenting what was archived"""
    log_content = f"""# CLEANUP LOG

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Archived Files

These files were moved to `scripts/archive/` because they are no longer needed in the new unified architecture:

"""
    
    for filename in archived:
        if filename == 'catalog_manager.py':
            reason = "Old lite-tier CMS - replaced by scripts/cms.py"
        elif filename == 'server.py':
            reason = "Development server - merged into app.py"
        elif filename == 'deploy.py':
            reason = "Deploy helper - no longer needed (use python app.py)"
        else:
            reason = "Obsolete"
        
        log_content += f"- **{filename}** - {reason}\n"
    
    if not_found:
        log_content += "\n## Not Found\n\n"
        for filename in not_found:
            log_content += f"- {filename}\n"
    
    log_content += """
## Why These Were Archived

The new architecture uses a single entry point:

```bash
python app.py
```

This replaces:
- `python scripts/server.py` (now built into app.py)
- `python scripts/deploy.py setup` (now automatic on first run)
- `python scripts/catalog_manager.py` (replaced by scripts/cms.py)

## New Architecture

**Old way:**
```
scripts/server.py        → Development server
scripts/catalog_manager.py → CMS operations
scripts/deploy.py        → Setup helper
```

**New way:**
```
app.py                   → Unified entry point (server + boot + CMS)
scripts/cms.py           → CMS library (imported by app.py)
scripts/thumbnail_generator.py → Still used for thumbnails
```

## Can I Delete These?

**Safe to delete from archive after confirming system works:**
- `catalog_manager.py` - Fully replaced
- `server.py` - Fully merged into app.py
- `deploy.py` - No longer needed

**Keep as reference:**
If you're paranoid, keep the archive folder for 1-2 weeks, then delete it once you're confident the new system works perfectly.

## Restoration

If you need to restore old scripts:
```bash
# Copy back from archive
cp scripts/archive/server.py scripts/
```

But you shouldn't need to - the new system is superior in every way.
"""
    
    log_file = BASE_DIR / 'CLEANUP_LOG.md'
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(log_content)
    
    print(f"📝 Created: CLEANUP_LOG.md")


def main():
    """Main entry point"""
    print("\n⚠️  WARNING: This will archive old scripts!")
    print("   Only run this AFTER confirming app.py works correctly.\n")
    
    response = input("Continue? (yes/no): ").strip().lower()
    
    if response == 'yes':
        archive_files()
        print("\n✅ You can now safely delete scripts/archive/ if you want.")
        print("   Or keep it as backup for a few weeks.\n")
    else:
        print("\n❌ Cancelled - no files were moved\n")


if __name__ == '__main__':
    main()
