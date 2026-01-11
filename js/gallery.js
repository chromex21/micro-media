// Gallery functionality
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
    
    // Pull to refresh state
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullToRefreshEl = null;
    
    // Load media from catalog or nginx autoindex
    function loadMediaFiles() {
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        // Check if media catalog exists (for testing without nginx)
        if (typeof mediaCatalog !== 'undefined') {
            console.log('Loading from media catalog');
            loadFromCatalog();
            return;
        }
        
        // Try nginx autoindex
        console.log('Trying nginx autoindex');
        loadFromNginx();
    }
    
    // Load from media-catalog.js with storage support
    async function loadFromCatalog() {
        let catalog = mediaCatalog;
        
        // Try to get updated catalog from storage first
        if (typeof getStorageCatalog === 'function') {
            try {
                catalog = await getStorageCatalog();
            } catch (e) {
                console.log('Using default catalog');
            }
        }
        
        // Load videos
        if (catalog.videos && catalog.videos.length > 0) {
            catalog.videos.forEach(function(item) {
                // Support both string filenames and objects with descriptions
                if (typeof item === 'string') {
                    createVideoCard('media/videos/sd/' + item, item, '', '');
                } else if (item.file) {
                    createVideoCard('media/videos/sd/' + item.file, item.file, item.title || '', item.desc || '');
                }
            });
        }
        
        // Load images
        if (catalog.images && catalog.images.length > 0) {
            catalog.images.forEach(function(item) {
                // Support both string filenames and objects with descriptions
                if (typeof item === 'string') {
                    createImageCard('media/images/full/' + item, item, '', '');
                } else if (item.file) {
                    createImageCard('media/images/full/' + item.file, item.file, item.title || '', item.desc || '');
                }
            });
        }
        
        // Show message if catalog is empty
        if ((!catalog.videos || catalog.videos.length === 0) && 
            (!catalog.images || catalog.images.length === 0)) {
            showMessage('No media in catalog', 'Add files and use admin panel');
        }
    }
    
    // Load from nginx autoindex
    function loadFromNginx() {
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExts = ['mp4', 'webm', 'mov'];
        
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
                        createVideoCard('media/videos/sd/' + filename, filename);
                    }
                });
            })
            .catch(function(err) {
                console.log('Nginx autoindex not available:', err);
                showMessage('No media found', 'Enable nginx autoindex or use media-catalog.js');
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
                        createImageCard('media/images/full/' + filename, filename);
                    }
                });
            })
            .catch(function(err) {
                console.log('Image directory error:', err);
            });
    }
    
    // Create video card with custom controls
    function createVideoCard(videoPath, displayName, title, description) {
        const article = document.createElement('article');
        article.className = 'media-card';
        article.dataset.type = 'video';
        
        const container = document.createElement('div');
        container.className = 'media-container';
        
        const video = document.createElement('video');
        video.className = 'media-item';
        video.dataset.full = videoPath;
        video.preload = 'metadata';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.disablePictureInPicture = true;
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        
        // Prevent context menu
        video.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        const source = document.createElement('source');
        source.src = videoPath;
        source.type = 'video/mp4';
        
        video.appendChild(source);
        
        // Create overlay with play button
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        
        const playBtn = document.createElement('button');
        playBtn.className = 'video-play-btn';
        playBtn.innerHTML = '▶';
        playBtn.setAttribute('aria-label', 'Play video');
        
        overlay.appendChild(playBtn);
        
        // Create controls bar
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
        
        // Add caption with metadata
        const caption = document.createElement('div');
        caption.className = 'media-caption';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'media-title';
        const fileName = displayName || videoPath.split('/').pop();
        
        // Use title if available, otherwise show filename
        if (title && title.trim()) {
            titleEl.textContent = title;
        } else {
            titleEl.textContent = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        }
        
        const metadata = document.createElement('div');
        metadata.className = 'media-metadata';
        
        // Duration placeholder
        const durationItem = document.createElement('div');
        durationItem.className = 'metadata-item';
        durationItem.innerHTML = '<span>⏱</span><span class="video-duration">--:--</span>';
        
        // Resolution placeholder
        const resolutionItem = document.createElement('div');
        resolutionItem.className = 'metadata-item';
        resolutionItem.innerHTML = '<span>📐</span><span class="video-resolution">--</span>';
        
        metadata.appendChild(durationItem);
        metadata.appendChild(resolutionItem);
        
        caption.appendChild(titleEl);
        caption.appendChild(metadata);
        article.appendChild(caption);
        
        // Load metadata
        video.addEventListener('loadedmetadata', function() {
            // Duration
            const duration = Math.floor(video.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationSpan = caption.querySelector('.video-duration');
            if (durationSpan) {
                durationSpan.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            }
            
            // Resolution
            const resolutionSpan = caption.querySelector('.video-resolution');
            if (resolutionSpan && video.videoWidth && video.videoHeight) {
                resolutionSpan.textContent = video.videoWidth + 'x' + video.videoHeight;
            }
            
            // Determine aspect ratio and apply class
            if (video.videoWidth && video.videoHeight) {
                const aspectRatio = video.videoWidth / video.videoHeight;
                
                if (aspectRatio < 0.8) {
                    // Portrait (like TikTok/Reels: 9:16)
                    container.classList.add('portrait');
                } else if (aspectRatio > 1.4) {
                    // Landscape (like YouTube: 16:9)
                    container.classList.add('landscape');
                } else {
                    // Square-ish (like Instagram: 1:1 or 4:5)
                    // Keep default square aspect ratio
                }
            }
        });
        
        gallery.appendChild(article);
        
        // Setup video controls
        setupVideoControls(video, container, playBtn, playPauseBtn, muteBtn, progress, progressBar, fullscreenBtn, overlay);
        
        // Setup auto-play observer
        videoObserver.observe(video);
    }
    
    // Setup video controls functionality
    function setupVideoControls(video, container, playBtn, playPauseBtn, muteBtn, progress, progressBar, fullscreenBtn, overlay) {
        // Play button in overlay
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
        
        // Play/pause button in controls
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
        
        // Mute button
        muteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '🔇' : '🔊';
        });
        
        // Progress bar
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
        
        // Fullscreen button
        fullscreenBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        });
        
        // Show controls on play
        video.addEventListener('play', function() {
            playPauseBtn.innerHTML = '⏸';
            container.classList.add('playing');
        });
        
        video.addEventListener('pause', function() {
            playPauseBtn.innerHTML = '▶';
            container.classList.remove('playing');
        });
        
        // Prevent default video click behavior
        container.addEventListener('click', function(e) {
            // Only toggle play if not clicking on controls
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
    function createImageCard(imagePath, displayName, title, description) {
        const article = document.createElement('article');
        article.className = 'media-card';
        article.dataset.type = 'image';
        
        const container = document.createElement('div');
        container.className = 'media-container';
        
        const img = document.createElement('img');
        img.className = 'media-item';
        img.src = imagePath;
        img.dataset.full = imagePath;
        img.alt = '';
        
        container.appendChild(img);
        article.appendChild(container);
        
        // Add caption
        const caption = document.createElement('div');
        caption.className = 'media-caption';
        const titleEl = document.createElement('div');
        titleEl.className = 'media-title';
        
        // Use title if available, otherwise show filename
        if (title && title.trim()) {
            titleEl.textContent = title;
        } else {
            const fileName = displayName || imagePath.split('/').pop();
            titleEl.textContent = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        }
        
        caption.appendChild(titleEl);
        article.appendChild(caption);
        
        gallery.appendChild(article);
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
            // Ensure video loads
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
            // Don't open modal if clicking on video controls
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
                video.play().catch(function() {
                    // Auto-play blocked
                });
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
        
        // Create pull to refresh indicator
        pullToRefreshEl = document.createElement('div');
        pullToRefreshEl.className = 'pull-to-refresh';
        pullToRefreshEl.innerHTML = '<div class="refresh-spinner" style="display:none;"></div><span>Pull to refresh</span>';
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
                // Add visual feedback - move gallery down
                const pullAmount = Math.min(diff * 0.4, 100);
                if (gallery) {
                    gallery.classList.add('pulling');
                    gallery.style.transform = 'translateY(' + pullAmount + 'px)';
                }
                
                const span = pullToRefreshEl.querySelector('span');
                if (diff > 80) {
                    pullToRefreshEl.classList.add('visible');
                    if (span) span.textContent = 'Release to refresh';
                } else if (diff > 30) {
                    pullToRefreshEl.classList.add('visible');
                    if (span) span.textContent = 'Pull to refresh';
                }
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchend', function() {
            if (!isPulling) return;
            
            const diff = currentY - startY;
            
            // Reset gallery position
            if (gallery) {
                gallery.style.transform = '';
                setTimeout(function() {
                    gallery.classList.remove('pulling');
                }, 200);
            }
            
            if (diff > 80) {
                // Trigger refresh
                const spinner = pullToRefreshEl.querySelector('.refresh-spinner');
                const span = pullToRefreshEl.querySelector('span');
                if (spinner) spinner.style.display = 'block';
                if (span) span.textContent = 'Refreshing...';
                pullToRefreshEl.classList.add('refreshing');
                
                // Reload media
                setTimeout(function() {
                    loadMediaFiles();
                    
                    // Hide indicator after refresh
                    setTimeout(function() {
                        pullToRefreshEl.classList.remove('visible', 'refreshing');
                        if (spinner) spinner.style.display = 'none';
                        if (span) span.textContent = 'Pull to refresh';
                    }, 500);
                }, 1000);
            } else {
                pullToRefreshEl.classList.remove('visible');
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
