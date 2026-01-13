// Feed enhancements for index.html
// Adds search, filter, sort, and counter functionality to the feed
(function() {
    'use strict';
    
    // Only run on feed page (index.html)
    if (!document.getElementById('feed-search')) return;
    
    const feedSearch = document.getElementById('feed-search');
    const feedTypeFilter = document.getElementById('feed-type-filter');
    const feedSort = document.getElementById('feed-sort');
    const feedCount = document.getElementById('feed-count');
    const gallery = document.querySelector('.gallery');
    
    let originalMediaItems = [];
    let filteredMediaItems = [];
    
    // Wait for gallery.js to load media
    function waitForMediaLoad() {
        const observer = new MutationObserver((mutations, obs) => {
            const mediaCards = gallery.querySelectorAll('.media-card');
            if (mediaCards.length > 0) {
                obs.disconnect();
                captureOriginalMedia();
                setupFilters();
                updateFeedCount();
            }
        });
        
        observer.observe(gallery, {
            childList: true,
            subtree: true
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
            observer.disconnect();
            captureOriginalMedia();
            setupFilters();
            updateFeedCount();
        }, 5000);
    }
    
    // Capture original media items
    function captureOriginalMedia() {
        const mediaCards = gallery.querySelectorAll('.media-card');
        originalMediaItems = Array.from(mediaCards).map(card => ({
            element: card,
            type: card.dataset.type,
            title: (card.dataset.title || '').toLowerCase(),
            desc: (card.dataset.desc || '').toLowerCase(),
            originalIndex: Array.from(mediaCards).indexOf(card)
        }));
        
        filteredMediaItems = [...originalMediaItems];
    }
    
    // Update feed counter
    function updateFeedCount() {
        if (!feedCount) return;
        
        const total = originalMediaItems.length;
        const visible = filteredMediaItems.length;
        
        if (visible === total) {
            feedCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
        } else {
            feedCount.textContent = `${visible} of ${total} items`;
        }
    }
    
    // Filter and sort media
    function filterAndSortMedia() {
        const searchTerm = feedSearch.value.toLowerCase();
        const typeFilter = feedTypeFilter.value;
        const sortBy = feedSort.value;
        
        // Filter
        filteredMediaItems = originalMediaItems.filter(item => {
            const matchesSearch = !searchTerm || 
                item.title.includes(searchTerm) ||
                item.desc.includes(searchTerm);
            
            const matchesType = typeFilter === 'all' || item.type === typeFilter;
            
            return matchesSearch && matchesType;
        });
        
        // Sort
        filteredMediaItems.sort((a, b) => {
            if (sortBy === 'recent') {
                // Most recent first (higher index = more recent)
                return b.originalIndex - a.originalIndex;
            } else if (sortBy === 'oldest') {
                // Oldest first
                return a.originalIndex - b.originalIndex;
            }
            return 0;
        });
        
        updateDisplay();
        updateFeedCount();
    }
    
    // Update display
    function updateDisplay() {
        // Hide all cards first
        originalMediaItems.forEach(item => {
            item.element.style.display = 'none';
        });
        
        // Show filtered cards in sorted order
        const galleryChildren = Array.from(gallery.children);
        const loadMoreBtn = galleryChildren.find(el => el.classList.contains('load-more-btn'));
        
        filteredMediaItems.forEach((item, index) => {
            item.element.style.display = '';
            
            // Move to correct position
            if (loadMoreBtn) {
                gallery.insertBefore(item.element, loadMoreBtn);
            } else {
                gallery.appendChild(item.element);
            }
        });
        
        // Show empty state if no results
        let emptyState = gallery.querySelector('.empty-feed-state');
        if (filteredMediaItems.length === 0 && originalMediaItems.length > 0) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-feed-state';
                emptyState.style.cssText = `
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-secondary);
                `;
                emptyState.innerHTML = `
                    <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">🔍</div>
                    <p style="font-size: 16px; margin-bottom: 8px;">No items match your filters</p>
                    <p style="font-size: 14px;">Try adjusting your search or filters</p>
                `;
                gallery.insertBefore(emptyState, gallery.firstChild);
            }
            emptyState.style.display = 'block';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    }
    
    // Setup filter listeners
    function setupFilters() {
        feedSearch.addEventListener('input', filterAndSortMedia);
        feedTypeFilter.addEventListener('change', filterAndSortMedia);
        feedSort.addEventListener('change', filterAndSortMedia);
        
        // Also listen for new media being added (from load more)
        const observer = new MutationObserver(() => {
            const currentCount = gallery.querySelectorAll('.media-card').length;
            if (currentCount !== originalMediaItems.length) {
                captureOriginalMedia();
                filterAndSortMedia();
            }
        });
        
        observer.observe(gallery, {
            childList: true,
            subtree: false
        });
    }
    
    // Setup real-time sync
    if (window.storageEvents) {
        window.storageEvents.on('media-videos', () => {
            console.log('📹 Videos updated, feed will refresh on next load');
        });
        window.storageEvents.on('media-images', () => {
            console.log('🖼️ Images updated, feed will refresh on next load');
        });
    }
    
    // Initialize
    waitForMediaLoad();
})();
