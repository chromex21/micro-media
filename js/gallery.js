// Gallery functionality with pagination and search
// MEDIUM TIER: Prioritizes data/media.json (Python write authority)
(function() {
    'use strict';
    
    // Elements
    const modal = document.querySelector('.modal');
    const modalMedia = document.querySelector('.modal-media');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const gallery = document.querySelector('.gallery');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    }
    
    // Pull to refresh state
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullToRefreshEl = null;
    
    // Pagination state
    let allMediaItems = [];
    let displayedCount = 0;
    const ITEMS_PER_LOAD = 5;
    
    // Show loading skeleton
    function showLoadingSkeleton(count = 3) {
        if (!gallery) return;
        
        const skeletonHTML = `
            <div class="gallery-loading">
                ${Array(count).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-media"></div>
                        <div class="skeleton-caption">
                            <div class="skeleton-title"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        gallery.innerHTML = skeletonHTML;
    }
    
    // MEDIUM TIER: Load media files with priority chain
    function loadMediaFiles() {
        if (!gallery) return;
        
        showLoadingSkeleton();
        
        // Small delay to show skeleton before processing
        setTimeout(async () => {
            gallery.innerHTML = '';
            allMediaItems = [];
            displayedCount = 0;
            
            // MEDIUM TIER PRIORITY:
            // 1. Try data/media.json (Python write authority)
            // 2. Fall back to storage (admin edits)
            // 3. Fall back to media-catalog.js (legacy)
            // 4. Fall back to nginx autoindex
            
            try {
                console.log('→ Trying data/media.json (Medium Tier source)...');
                await loadFromMediaJson();
            } catch (err) {
                console.log('→ media.json not available, falling back to catalog...');
                if (typeof mediaCatalog !== 'undefined') {
                    console.log('→ Loading from media-catalog.js');
                    await loadFromCatalog();
                } else {
                    console.log('→ Trying nginx autoindex');
                    loadFromNginx();
                }
            }
        }, 150); // Short delay to show skeleton
    }
    
    // MEDIUM TIER: Load from data/media.json (PRIMARY SOURCE)
    async function loadFromMediaJson() {
        const response = await fetch('data/media.json');
        if (!response.ok) throw new Error('media.json not found');
        
        const data = await response.json();
        console.log('✅ Loaded from data/media.json (Medium Tier)');
        
        // Check for storage overrides (admin panel edits)
        let videos = data.videos || [];
        let images = data.images || [];
        let cloudLinks = data.cloud_links || [];
        
        try {
            const videosData = await window.storage.get('media-videos');
            const imagesData = await window.storage.get('media-images');
            
            if (videosData && videosData.value) {
                const storageVideos = JSON.parse(videosData.value);
                console.log('→ Using storage override for videos');
                videos = storageVideos;
            }
            if (imagesData && imagesData.value) {
                const storageImages = JSON.parse(imagesData.value);
                console.log('→ Using storage override for images');
                images = storageImages;
            }
        } catch (e) {
            console.log('→ No storage overrides, using media.json as-is');
        }
        
        // Process videos (detect cloud links)
        videos.forEach(item => {
            // Check if it's a cloud link
            if (item.isCloudLink || item.url) {
                allMediaItems.push({
                    id: item.id,
                    type: 'cloud-link',
                    cloudType: 'video',
                    url: item.url,
                    title: item.title || 'Cloud Video',
                    desc: item.desc || ''
                });
            } else {
                // Regular local video
                allMediaItems.push({
                    id: item.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'video',
                    path: item.path || `media/videos/sd/${item.file}`,
                    file: item.file,
                    title: item.title || '',
                    desc: item.desc || ''
                });
            }
        });
        
        // Process images (detect cloud links)
        images.forEach(item => {
            // Check if it's a cloud link
            if (item.isCloudLink || item.url) {
                allMediaItems.push({
                    id: item.id,
                    type: 'cloud-link',
                    cloudType: 'image',
                    url: item.url,
                    title: item.title || 'Cloud Image',
                    desc: item.desc || ''
                });
            } else {
                // Regular local image
                allMediaItems.push({
                    id: item.id || `i_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'image',
                    path: item.path || `media/images/full/${item.file}`,
                    file: item.file,
                    title: item.title || '',
                    desc: item.desc || ''
                });
            }
        });
        
        // Process cloud links
        cloudLinks.forEach(item => {
            allMediaItems.push({
                id: item.id,
                type: 'cloud-link',
                cloudType: item.type || 'video',
                url: item.url,
                title: item.title || 'Cloud Media',
                desc: item.desc || ''
            });
        });
        
        if (allMediaItems.length === 0) {
            showMessage('No media in catalog', 'Add files and run: python catalog_manager_v2.py scan');
            return;
        }
        
        console.log(`→ Loaded ${videos.length} videos, ${images.length} images, ${cloudLinks.length} cloud links`);
        displayNextBatch();
    }
    
    // Load from media-catalog.js with storage support (LEGACY FALLBACK)
    async function loadFromCatalog() {
        let catalog = mediaCatalog;
        
        // Try to get updated catalog from storage first
        try {
            const videosData = await window.storage.get('media-videos');
            const imagesData = await window.storage.get('media-images');
            
            if (videosData && videosData.value) {
                catalog.videos = JSON.parse(videosData.value);
            }
            if (imagesData && imagesData.value) {
                catalog.images = JSON.parse(imagesData.value);
            }
        } catch (e) {
            console.log('Using default catalog');
        }
        
        // Collect all media items
        allMediaItems = [];
        
        // Load videos
        if (catalog.videos && catalog.videos.length > 0) {
            catalog.videos.forEach(function(item) {
                if (typeof item === 'string') {
                    allMediaItems.push({
                        id: `v_legacy_${Math.random().toString(36).substr(2, 9)}`,
                        type: 'video',
                        path: 'media/videos/sd/' + item,
                        file: item,
                        title: '',
                        desc: ''
                    });
                } else if (item.file) {
                    allMediaItems.push({
                        id: item.id || `v_legacy_${Math.random().toString(36).substr(2, 9)}`,
                        type: 'video',
                        path: 'media/videos/sd/' + item.file,
                        file: item.file,
                        title: item.title || '',
                        desc: item.desc || ''
                    });
                }
            });
        }
        
        // Load images
        if (catalog.images && catalog.images.length > 0) {
            catalog.images.forEach(function(item) {
                if (typeof item === 'string') {
                    allMediaItems.push({
                        id: `i_legacy_${Math.random().toString(36).substr(2, 9)}`,
                        type: 'image',
                        path: 'media/images/full/' + item,
                        file: item,
                        title: '',
                        desc: ''
                    });
                } else if (item.file) {
                    allMediaItems.push({
                        id: item.id || `i_legacy_${Math.random().toString(36).substr(2, 9)}`,
                        type: 'image',
                        path: 'media/images/full/' + item.file,
                        file: item.file,
                        title: item.title || '',
                        desc: item.desc || ''
                    });
                }
            });
        }
        
        if (allMediaItems.length === 0) {
            showMessage('No media in catalog', 'Add files and use admin panel');
            return;
        }
        
        displayNextBatch();
    }
    
    // Display next batch of items
    function displayNextBatch() {
        if (!gallery) return;
        
        const endIndex = Math.min(displayedCount + ITEMS_PER_LOAD, allMediaItems.length);
        
        for (let i = displayedCount; i < endIndex; i++) {
            const item = allMediaItems[i];
            if (item.type === 'video') {
                createVideoCard(item);
            } else if (item.type === 'image') {
                createImageCard(item);
            } else if (item.type === 'cloud-link') {
                createCloudLinkCard(item);
            }
        }
        
        displayedCount = endIndex;
        
        // Add "Load More" button if there are more items
        removeLoadMoreButton();
        
        if (displayedCount < allMediaItems.length) {
            addLoadMoreButton();
        }
    }
    
    // Add "Load More" button
    function addLoadMoreButton() {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
            <span>Load More</span>
            <span style="font-size: 12px; opacity: 0.8;">(${allMediaItems.length - displayedCount} remaining)</span>
        `;
        loadMoreBtn.style.cssText = `
            grid-column: 1 / -1;
            padding: 16px 32px;
            background: var(--accent-color);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin: var(--spacing-lg) auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;
            transition: opacity 0.2s;
        `;
        
        loadMoreBtn.addEventListener('click', function() {
            displayNextBatch();
        });
        
        loadMoreBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '0.9';
        });
        
        loadMoreBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
        
        gallery.appendChild(loadMoreBtn);
    }
    
    // Remove existing "Load More" button
    function removeLoadMoreButton() {
        const existingBtn = gallery.querySelector('.load-more-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
    }
    
    // Load from nginx autoindex (LAST RESORT)
    function loadFromNginx() {
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExts = ['mp4', 'webm', 'mov'];
        
        allMediaItems = [];
        
        // Load videos
        fetch('media/videos/sd/')
            .then(function(response) { return response.text(); })
            .then(function(html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');
                
                links.forEach(function(link) {
                    const filename = link.getAttribute('href');
                    if (!filename || filename === '../') return;
                    
                    const ext = filename.split('.').pop().toLowerCase();
                    if (videoExts.includes(ext)) {
                        allMediaItems.push({
                            id: `v_nginx_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'video',
                            path: 'media/videos/sd/' + filename,
                            file: filename,
                            title: '',
                            desc: ''
                        });
                    }
                });
                
                displayNextBatch();
            })
            .catch(function(err) {
                console.log('Nginx autoindex not available:', err);
                showMessage('No media found', 'Run: python catalog_manager_v2.py scan');
            });
        
        // Load images
        fetch('media/images/full/')
            .then(function(response) { return response.text(); })
            .then(function(html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');
                
                links.forEach(function(link) {
                    const filename = link.getAttribute('href');
                    if (!filename || filename === '../') return;
                    
                    const ext = filename.split('.').pop().toLowerCase();
                    if (imageExts.includes(ext)) {
                        allMediaItems.push({
                            id: `i_nginx_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'image',
                            path: 'media/images/full/' + filename,
                            file: filename,
                            title: '',
                            desc: ''
                        });
                    }
                });
                
                displayNextBatch();
            })
            .catch(function(err) {
                console.log('Image directory error:', err);
            });
    }
    
    // Create video card with custom controls
    function createVideoCard(item) {
        const article = document.createElement('article');
        article.className = 'media-card';
        article.dataset.type = 'video';
        article.dataset.title = (item.title || item.file || '').toLowerCase();
        article.dataset.desc = (item.desc || '').toLowerCase();
        
        const container = document.createElement('div');
        container.className = 'media-container';
        
        const video = document.createElement('video');
        video.className = 'media-item';
        video.dataset.full = item.path;
        video.preload = 'metadata';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.disablePictureInPicture = true;
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        
        video.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        const source = document.createElement('source');
        source.src = item.path;
        source.type = 'video/mp4';
        
        source.addEventListener('error', function() {
            article.classList.add('media-error');
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'media-error-overlay';
            errorOverlay.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
                    <div style="font-size: 14px;">Video unavailable</div>
                    <div style="font-size: 12px; margin-top: 4px;">File may have been removed</div>
                </div>
            `;
            container.appendChild(errorOverlay);
        });
        
        video.appendChild(source);
        
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'video-play-btn';
        playBtn.innerHTML = '▶';
        playBtn.setAttribute('aria-label', 'Play video');
        
        overlay.appendChild(playBtn);
        
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'video-control-btn play-pause';
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.setAttribute('aria-label', 'Play/Pause');
        
        const muteBtn = document.createElement('button');
        muteBtn.className = 'video-control-btn mute';
        muteBtn.innerHTML = '🔇';
        muteBtn.setAttribute('aria-label', 'Mute/Unmute');
        
        const progress = document.createElement('div');
        progress.className = 'video-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'video-progress-bar';
        progress.appendChild(progressBar);
        
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'video-control-btn fullscreen';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.setAttribute('aria-label', 'Fullscreen');
        
        controls.appendChild(playPauseBtn);
        controls.appendChild(muteBtn);
        controls.appendChild(progress);
        controls.appendChild(fullscreenBtn);
        
        container.appendChild(video);
        container.appendChild(overlay);
        container.appendChild(controls);
        article.appendChild(container);
        
        const caption = document.createElement('div');
        caption.className = 'media-caption';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'media-title';
        
        if (item.title && item.title.trim()) {
            titleEl.textContent = item.title;
        } else {
            const fileName = item.file || item.path.split('/').pop();
            titleEl.textContent = fileName.replace(/\.[^/.]+$/, '');
        }
        
        caption.appendChild(titleEl);
        
        // Add description if available
        if (item.desc && item.desc.trim()) {
            const descEl = document.createElement('div');
            descEl.className = 'media-description';
            descEl.textContent = item.desc;
            caption.appendChild(descEl);
        }
        
        article.appendChild(caption);
        
        video.addEventListener('loadedmetadata', function() {
            if (video.videoWidth && video.videoHeight) {
                const aspectRatio = video.videoWidth / video.videoHeight;
                
                if (aspectRatio < 0.8) {
                    container.classList.add('portrait');
                } else if (aspectRatio > 1.4) {
                    container.classList.add('landscape');
                }
            }
        });
        
        // Add interactions section
        if (typeof createInteractionsSection === 'function') {
            const interactions = createInteractionsSection();
            article.appendChild(interactions);
        }
        
        // MEDIUM TIER: Use stable ID from media.json or generate fallback
        article.dataset.mediaId = item.id || `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        gallery.appendChild(article);
        
        setupVideoControls(video, container, playBtn, playPauseBtn, muteBtn, progress, progressBar, fullscreenBtn, overlay);
        videoObserver.observe(video);
    }
    
    // Setup video controls functionality
    function setupVideoControls(video, container, playBtn, playPauseBtn, muteBtn, progress, progressBar, fullscreenBtn, overlay) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.paused) {
                video.play();
                container.classList.add('playing');
            } else {
                video.pause();
                container.classList.remove('playing');
            }
        });
        
        playPauseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.paused) {
                video.play();
                playPauseBtn.innerHTML = '⏸';
                container.classList.add('playing');
            } else {
                video.pause();
                playPauseBtn.innerHTML = '▶';
                container.classList.remove('playing');
            }
        });
        
        muteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '🔇' : '🔊';
        });
        
        video.addEventListener('timeupdate', function() {
            const percent = (video.currentTime / video.duration) * 100;
            progressBar.style.width = percent + '%';
        });
        
        progress.addEventListener('click', function(e) {
            e.stopPropagation();
            const rect = progress.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });
        
        fullscreenBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        });
        
        video.addEventListener('play', function() {
            playPauseBtn.innerHTML = '⏸';
            container.classList.add('playing');
        });
        
        video.addEventListener('pause', function() {
            playPauseBtn.innerHTML = '▶';
            container.classList.remove('playing');
        });
        
        container.addEventListener('click', function(e) {
            if (!e.target.closest('.video-controls') && 
                !e.target.closest('.video-play-btn') &&
                !e.target.closest('.video-overlay')) {
                if (video.paused) {
                    video.play();
                    container.classList.add('playing');
                } else {
                    video.pause();
                    container.classList.remove('playing');
                }
            }
        });
    }
    
    // Create image card
    function createImageCard(item) {
        const article = document.createElement('article');
        article.className = 'media-card';
        article.dataset.type = 'image';
        article.dataset.title = (item.title || item.file || '').toLowerCase();
        article.dataset.desc = (item.desc || '').toLowerCase();
        
        const container = document.createElement('div');
        container.className = 'media-container';
        
        const img = document.createElement('img');
        img.className = 'media-item';
        img.src = item.path;
        img.dataset.full = item.path;
        img.alt = '';
        
        img.addEventListener('error', function() {
            article.classList.add('media-error');
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'media-error-overlay';
            errorOverlay.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
                    <div style="font-size: 14px;">Image unavailable</div>
                    <div style="font-size: 12px; margin-top: 4px;">File may have been removed</div>
                </div>
            `;
            container.appendChild(errorOverlay);
        });
        
        container.appendChild(img);
        article.appendChild(container);
        
        const caption = document.createElement('div');
        caption.className = 'media-caption';
        const titleEl = document.createElement('div');
        titleEl.className = 'media-title';
        
        if (item.title && item.title.trim()) {
            titleEl.textContent = item.title;
        } else {
            const fileName = item.file || item.path.split('/').pop();
            titleEl.textContent = fileName.replace(/\.[^/.]+$/, '');
        }
        
        caption.appendChild(titleEl);
        
        // Add description if available
        if (item.desc && item.desc.trim()) {
            const descEl = document.createElement('div');
            descEl.className = 'media-description';
            descEl.textContent = item.desc;
            caption.appendChild(descEl);
        }
        
        article.appendChild(caption);
        
        // Add interactions section
        if (typeof createInteractionsSection === 'function') {
            const interactions = createInteractionsSection();
            article.appendChild(interactions);
        }
        
        // MEDIUM TIER: Use stable ID from media.json or generate fallback
        article.dataset.mediaId = item.id || `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        gallery.appendChild(article);
    }
    
    // Create cloud link card (embedded iframe)
    function createCloudLinkCard(item) {
        const article = document.createElement('article');
        article.className = 'media-card';
        article.dataset.type = 'cloud-link';
        article.dataset.title = (item.title || '').toLowerCase();
        article.dataset.desc = (item.desc || '').toLowerCase();
        
        const container = document.createElement('div');
        container.className = 'media-container';
        
        // Convert cloud storage URLs to embeddable format
        const embedUrl = convertToEmbedUrl(item.url);
        
        if (embedUrl) {
            // Check if it's a direct image or video URL
            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            const videoExts = ['.mp4', '.webm', '.mov'];
            const urlLower = embedUrl.toLowerCase();
            
            if (imageExts.some(ext => urlLower.endsWith(ext))) {
                // Direct image embed
                const img = document.createElement('img');
                img.className = 'media-item cloud-embed';
                img.src = embedUrl;
                img.alt = item.title || 'Cloud Image';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                
                img.addEventListener('error', function() {
                    article.classList.add('media-error');
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'media-error-overlay';
                    errorOverlay.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary);">
                            <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
                            <div style="font-size: 14px;">Image unavailable</div>
                            <div style="font-size: 12px; margin-top: 4px;">Cloud link may be expired</div>
                        </div>
                    `;
                    container.appendChild(errorOverlay);
                });
                
                container.appendChild(img);
            } else if (videoExts.some(ext => urlLower.endsWith(ext))) {
                // Direct video embed
                const video = document.createElement('video');
                video.className = 'media-item cloud-embed';
                video.src = embedUrl;
                video.controls = true;
                video.style.width = '100%';
                video.style.height = '100%';
                
                video.addEventListener('error', function() {
                    article.classList.add('media-error');
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'media-error-overlay';
                    errorOverlay.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary);">
                            <div style="font-size: 48px; margin-bottom: 8px;">⚠️</div>
                            <div style="font-size: 14px;">Video unavailable</div>
                            <div style="font-size: 12px; margin-top: 4px;">Cloud link may be expired</div>
                        </div>
                    `;
                    container.appendChild(errorOverlay);
                });
                
                container.appendChild(video);
            } else {
                // iframe embed (YouTube, Vimeo, Drive, etc.)
                const iframe = document.createElement('iframe');
                iframe.className = 'media-item cloud-embed';
                iframe.src = embedUrl;
                iframe.setAttribute('allowfullscreen', '');
                iframe.setAttribute('allow', 'autoplay; encrypted-media');
                iframe.style.border = 'none';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                
                container.appendChild(iframe);
            }
        } else {
            // Fallback: show link button if can't embed
            const linkOverlay = document.createElement('div');
            linkOverlay.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: var(--spacing-lg);
                text-align: center;
            `;
            linkOverlay.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">🔗</div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Cloud Media</div>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" 
                   style="display: inline-block; padding: 12px 24px; background: white; color: #667eea; 
                          border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                    Open Link →
                </a>
            `;
            container.appendChild(linkOverlay);
        }
        
        article.appendChild(container);
        
        const caption = document.createElement('div');
        caption.className = 'media-caption';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'media-title';
        titleEl.textContent = item.title || 'Cloud Media';
        caption.appendChild(titleEl);
        
        if (item.desc && item.desc.trim()) {
            const descEl = document.createElement('div');
            descEl.className = 'media-description';
            descEl.textContent = item.desc;
            caption.appendChild(descEl);
        }
        
        // Add cloud source indicator
        const cloudIndicator = document.createElement('div');
        cloudIndicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            font-size: 12px;
            color: var(--accent-color);
        `;
        cloudIndicator.innerHTML = `<span>☁️</span><span>Cloud Storage</span>`;
        caption.appendChild(cloudIndicator);
        
        article.appendChild(caption);
        
        // Add interactions section
        if (typeof createInteractionsSection === 'function') {
            const interactions = createInteractionsSection();
            article.appendChild(interactions);
        }
        
        article.dataset.mediaId = item.id;
        gallery.appendChild(article);
    }
    
    // Convert cloud storage URLs to embeddable format
    function convertToEmbedUrl(url) {
        // YouTube: Convert to embed format
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                videoId = urlParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            }
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }
        
        // Vimeo: Convert to embed format
        if (url.includes('vimeo.com')) {
            const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
            if (videoIdMatch) {
                return `https://player.vimeo.com/video/${videoIdMatch[1]}`;
            }
        }
        
        // Dropbox: Convert to raw/preview format
        if (url.includes('dropbox.com')) {
            if (url.includes('?dl=0')) {
                return url.replace('?dl=0', '?raw=1');
            }
            return url + (url.includes('?') ? '&raw=1' : '?raw=1');
        }
        
        // Google Drive: Convert to preview format
        if (url.includes('drive.google.com')) {
            const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch) {
                return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
        }
        
        // OneDrive: Try to use embed parameter
        if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
            return url + (url.includes('?') ? '&embed=1' : '?embed=1');
        }
        
        // For direct image/video links, try to embed directly
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const videoExts = ['.mp4', '.webm', '.mov'];
        const urlLower = url.toLowerCase();
        
        if (imageExts.some(ext => urlLower.endsWith(ext))) {
            return url; // Direct image URL
        }
        if (videoExts.some(ext => urlLower.endsWith(ext))) {
            return url; // Direct video URL
        }
        
        // Default: return null to show link fallback
        return null;
    }
    
    // Show message
    function showMessage(title, subtitle) {
        const message = document.createElement('div');
        message.style.padding = '40px';
        message.style.textAlign = 'center';
        message.style.color = 'var(--text-secondary)';
        message.innerHTML = '<p style="font-size: 16px; margin-bottom: 8px;">' + title + '</p><p style="font-size: 14px;">' + subtitle + '</p>';
        gallery.appendChild(message);
    }
    
    // Open modal with media
    function openModal(mediaElement) {
        if (!modal || !modalMedia) return;
        
        modalMedia.innerHTML = '';
        
        const fullPath = mediaElement.dataset.full;
        if (!fullPath) return;
        
        const mediaType = mediaElement.tagName.toLowerCase();
        let newMedia;
        
        if (mediaType === 'img') {
            newMedia = document.createElement('img');
            newMedia.src = fullPath;
            newMedia.alt = mediaElement.alt || '';
        } else if (mediaType === 'video') {
            newMedia = document.createElement('video');
            newMedia.src = fullPath;
            newMedia.controls = true;
            newMedia.autoplay = true;
            newMedia.loop = true;
            newMedia.playsInline = true;
            newMedia.load();
        }
        
        if (newMedia) {
            modalMedia.appendChild(newMedia);
            modal.removeAttribute('hidden');
            document.body.classList.add('modal-open');
        }
    }
    
    // Close modal
    function closeModal() {
        if (!modal) return;
        
        modal.setAttribute('hidden', '');
        document.body.classList.remove('modal-open');
        
        if (modalMedia) {
            const video = modalMedia.querySelector('video');
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
            modalMedia.innerHTML = '';
        }
    }
    
    // Toggle sidebar
    function toggleSidebar() {
        if (!sidebar) return;
        sidebar.classList.toggle('is-open');
    }
    
    // Event listeners
    if (gallery) {
        gallery.addEventListener('click', function(e) {
            if (e.target.closest('.video-controls') || 
                e.target.closest('.video-play-btn') ||
                e.target.closest('.video-overlay')) {
                return;
            }
            
            const mediaContainer = e.target.closest('.media-container');
            if (mediaContainer) {
                const mediaItem = mediaContainer.querySelector('.media-item');
                if (mediaItem && mediaItem.tagName.toLowerCase() === 'img') {
                    openModal(mediaItem);
                }
            }
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) {
            closeModal();
        }
    });
    
    // Auto-play videos when in viewport
    const videoObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(function() {});
            } else {
                video.pause();
            }
        });
    }, {
        threshold: 0.5
    });
    
    // Pull to refresh functionality
    function initPullToRefresh() {
        if (!mainContent) return;
        
        pullToRefreshEl = document.createElement('div');
        pullToRefreshEl.style.cssText = `
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            transition: top 0.3s;
            z-index: 100;
            font-size: 14px;
            color: var(--text-secondary);
        `;
        pullToRefreshEl.innerHTML = '<span>↓ Pull to refresh</span>';
        document.body.appendChild(pullToRefreshEl);
        
        mainContent.addEventListener('touchstart', function(e) {
            if (mainContent.scrollTop === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', function(e) {
            if (!isPulling) return;
            
            currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            
            if (diff > 0 && mainContent.scrollTop === 0) {
                const pullAmount = Math.min(diff * 0.4, 60);
                if (gallery) {
                    gallery.style.transform = 'translateY(' + pullAmount + 'px)';
                    gallery.style.transition = 'none';
                }
                
                if (diff > 80) {
                    pullToRefreshEl.querySelector('span').textContent = '↑ Release to refresh';
                    pullToRefreshEl.style.top = '0';
                }
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchend', function() {
            if (!isPulling) return;
            
            const diff = currentY - startY;
            
            if (gallery) {
                gallery.style.transform = '';
                gallery.style.transition = 'transform 0.3s';
            }
            
            if (diff > 80) {
                pullToRefreshEl.querySelector('span').textContent = '⟳ Refreshing...';
                
                setTimeout(function() {
                    loadMediaFiles();
                    
                    setTimeout(function() {
                        pullToRefreshEl.style.top = '-60px';
                        pullToRefreshEl.querySelector('span').textContent = '↓ Pull to refresh';
                    }, 500);
                }, 800);
            } else {
                pullToRefreshEl.style.top = '-60px';
            }
            
            isPulling = false;
            startY = 0;
            currentY = 0;
        });
    }
    
    // Initialize
    loadMediaFiles();
    initPullToRefresh();

})();
