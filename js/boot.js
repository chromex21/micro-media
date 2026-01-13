/**
 * Boot Sequence System
 * Visual: Shows boot screen, waits for ready signal
 * Background: Python scans, organizes, signals ready
 * 
 * IMPORTANT: Only boots if system is NOT already ready
 */

(function() {
    'use strict';
    
    const BOOT_CHECK_INTERVAL = 500; // Check every 500ms
    const MAX_BOOT_TIME = 10000; // 10 second timeout
    const BOOT_STATUS_FILE = 'data/boot_status.json';
    
    let bootStartTime = Date.now();
    let checkInterval = null;
    
    // Boot states
    const STATES = {
        INITIALIZING: 'Initializing system',
        SCANNING: 'Scanning media folders',
        INDEXING: 'Indexing content',
        VERIFYING: 'Verifying feed integrity',
        READY: 'System ready'
    };
    
    // Create boot screen HTML
    function createBootScreen() {
        const bootScreen = document.createElement('div');
        bootScreen.id = 'boot-screen';
        bootScreen.className = 'boot-screen';
        bootScreen.innerHTML = `
            <div class="boot-logo">▶</div>
            <div class="boot-status">
                <div class="boot-status-text" id="boot-status-text">${STATES.INITIALIZING}<span class="boot-dots"></span></div>
                <div class="boot-status-detail" id="boot-status-detail">Starting boot sequence...</div>
            </div>
        `;
        
        document.body.insertBefore(bootScreen, document.body.firstChild);
        document.body.classList.add('booting');
    }
    
    // Update boot status
    function updateBootStatus(status, detail = '') {
        const statusEl = document.getElementById('boot-status-text');
        const detailEl = document.getElementById('boot-status-detail');
        
        if (statusEl) {
            statusEl.innerHTML = `${status}<span class="boot-dots"></span>`;
        }
        if (detailEl && detail) {
            detailEl.textContent = detail;
        }
    }
    
    // Check if system is ready
    async function checkBootStatus() {
        try {
            // Check if media.json exists and is valid
            const mediaResponse = await fetch('data/media.json?t=' + Date.now());
            if (!mediaResponse.ok) {
                return {
                    ready: false,
                    state: 'scanning',
                    message: 'Waiting for content scan...'
                };
            }
            
            const mediaData = await mediaResponse.json();
            
            // Validate structure
            if (!mediaData.videos || !mediaData.images) {
                return {
                    ready: false,
                    state: 'indexing',
                    message: 'Building content index...'
                };
            }
            
            // Check for boot_status.json (optional detailed status)
            try {
                const statusResponse = await fetch(BOOT_STATUS_FILE + '?t=' + Date.now());
                if (statusResponse.ok) {
                    const bootStatus = await statusResponse.json();
                    
                    if (bootStatus.ready) {
                        return {
                            ready: true,
                            state: 'ready',
                            message: `Found ${mediaData.videos.length} videos, ${mediaData.images.length} images`
                        };
                    }
                    
                    return {
                        ready: false,
                        state: bootStatus.state || 'processing',
                        message: bootStatus.message || 'Processing...'
                    };
                }
            } catch (e) {
                // boot_status.json is optional, continue
            }
            
            // If media.json is valid, consider system ready
            return {
                ready: true,
                state: 'ready',
                message: `Loaded ${mediaData.videos.length} videos, ${mediaData.images.length} images`
            };
            
        } catch (error) {
            console.error('Boot check error:', error);
            
            // Check if we've exceeded max boot time
            if (Date.now() - bootStartTime > MAX_BOOT_TIME) {
                return {
                    ready: false,
                    state: 'error',
                    message: 'Boot timeout - system may need manual scan',
                    error: true
                };
            }
            
            return {
                ready: false,
                state: 'initializing',
                message: 'Checking system status...'
            };
        }
    }
    
    // Quick check if system is already ready (skip boot)
    async function isSystemReady() {
        try {
            const response = await fetch('data/media.json?t=' + Date.now());
            if (!response.ok) return false;
            
            const data = await response.json();
            
            // System is ready if media.json is valid
            return (data.videos && data.images);
        } catch (e) {
            return false;
        }
    }
    
    // Boot sequence loop
    async function bootSequence() {
        updateBootStatus(STATES.INITIALIZING, 'Checking system status...');
        
        checkInterval = setInterval(async () => {
            const status = await checkBootStatus();
            
            // Update UI based on state
            if (status.state === 'scanning') {
                updateBootStatus(STATES.SCANNING, status.message);
            } else if (status.state === 'indexing') {
                updateBootStatus(STATES.INDEXING, status.message);
            } else if (status.state === 'verifying') {
                updateBootStatus(STATES.VERIFYING, status.message);
            } else if (status.state === 'ready' && status.ready) {
                updateBootStatus(STATES.READY, status.message);
                setTimeout(() => finishBoot(), 500);
            } else if (status.error) {
                showBootError(status.message);
            }
            
        }, BOOT_CHECK_INTERVAL);
    }
    
    // Finish boot sequence
    function finishBoot() {
        clearInterval(checkInterval);
        
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            bootScreen.classList.add('ready');
            setTimeout(() => {
                bootScreen.remove();
                document.body.classList.remove('booting');
                
                // Signal that boot is complete
                window.dispatchEvent(new CustomEvent('bootcomplete'));
                console.log('✅ Boot sequence complete');
            }, 500);
        }
    }
    
    // Show boot error
    function showBootError(message) {
        clearInterval(checkInterval);
        
        const bootScreen = document.getElementById('boot-screen');
        if (!bootScreen) return;
        
        const statusContainer = bootScreen.querySelector('.boot-status');
        statusContainer.innerHTML = `
            <div class="boot-error">
                <div class="boot-error-title">⚠️ Boot Error</div>
                <div class="boot-error-message">${message}</div>
                <div class="boot-error-action">
                    Refresh the page or check server logs
                </div>
                <button class="boot-retry-btn" onclick="window.location.reload()">
                    Retry
                </button>
            </div>
        `;
    }
    
    // Auto-trigger boot on page load
    async function init() {
        // Check if we should skip boot (for admin pages, etc)
        const skipBoot = document.body.dataset.skipBoot === 'true';
        
        if (skipBoot) {
            console.log('→ Boot sequence skipped (skip-boot flag)');
            return;
        }
        
        // CRITICAL: Check if system is already ready
        const alreadyReady = await isSystemReady();
        
        if (alreadyReady) {
            console.log('✅ System already ready - skipping boot sequence');
            // Signal that boot is complete (system was already ready)
            window.dispatchEvent(new CustomEvent('bootcomplete'));
            return;
        }
        
        // System not ready, show boot sequence
        console.log('→ Starting boot sequence...');
        createBootScreen();
        bootSequence();
    }
    
    // Export for manual control if needed
    window.bootSequence = {
        init,
        checkStatus: checkBootStatus,
        finish: finishBoot
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
