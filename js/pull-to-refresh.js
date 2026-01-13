// Pull-to-Refresh Component
// Reusable pull-to-refresh functionality for content pages
(function() {
    'use strict';
    
    /**
     * Initialize pull-to-refresh on a page
     * @param {Function} onRefresh - Callback function to execute when refresh is triggered
     * @param {Object} options - Configuration options
     */
    function initPullToRefresh(onRefresh, options = {}) {
        const defaults = {
            container: document.querySelector('.main-content'), // Element to attach pull listener to
            threshold: 80, // How far to pull before triggering refresh (px)
            maxPull: 120, // Maximum pull distance
            indicatorText: '↓ Pull to refresh',
            releaseText: '↑ Release to refresh',
            refreshingText: '⟳ Refreshing...'
        };
        
        const config = { ...defaults, ...options };
        const container = config.container;
        
        if (!container) {
            console.warn('Pull-to-refresh: container not found');
            return;
        }
        
        // State tracking
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let indicator = null;
        
        // Create pull indicator
        function createIndicator() {
            indicator = document.createElement('div');
            indicator.style.cssText = `
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
                transition: top 0.3s ease;
                z-index: 100;
                font-size: 14px;
                color: var(--text-secondary);
                font-weight: 500;
            `;
            indicator.innerHTML = `<span>${config.indicatorText}</span>`;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        // Get or create indicator
        if (!indicator) {
            indicator = createIndicator();
        }
        
        // Get content element (first child of container)
        const content = container.children[0];
        if (!content) {
            console.warn('Pull-to-refresh: no content element found');
            return;
        }
        
        // Touch start handler
        container.addEventListener('touchstart', (e) => {
            // Only start if we're at the top of the scroll
            if (container.scrollTop === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });
        
        // Touch move handler
        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            
            // Only allow pulling down
            if (diff > 0 && container.scrollTop === 0) {
                // Calculate pull amount with resistance
                const pullAmount = Math.min(diff * 0.4, config.maxPull);
                
                // Apply transform to content
                if (content) {
                    content.style.transform = `translateY(${pullAmount}px)`;
                    content.style.transition = 'none';
                }
                
                // Update indicator
                const span = indicator.querySelector('span');
                if (diff > config.threshold) {
                    indicator.style.top = '0';
                    if (span) span.textContent = config.releaseText;
                } else if (diff > 30) {
                    indicator.style.top = '0';
                    if (span) span.textContent = config.indicatorText;
                }
            }
        }, { passive: true });
        
        // Touch end handler
        container.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            const diff = currentY - startY;
            
            // Reset content position
            if (content) {
                content.style.transform = '';
                content.style.transition = 'transform 0.3s ease';
            }
            
            // Trigger refresh if pulled far enough
            if (diff > config.threshold) {
                const span = indicator.querySelector('span');
                if (span) span.textContent = config.refreshingText;
                indicator.style.top = '0';
                
                // Call the refresh callback
                setTimeout(() => {
                    onRefresh();
                    
                    // Hide indicator after refresh
                    setTimeout(() => {
                        indicator.style.top = '-60px';
                        const span = indicator.querySelector('span');
                        if (span) span.textContent = config.indicatorText;
                    }, 500);
                }, 800);
            } else {
                // Reset indicator
                indicator.style.top = '-60px';
            }
            
            // Reset state
            isPulling = false;
            startY = 0;
            currentY = 0;
        });
    }
    
    // Export to global scope
    window.pullToRefresh = {
        init: initPullToRefresh
    };
    
})();
