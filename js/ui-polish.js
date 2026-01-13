// UI Polish & Enhancements
// Adds smooth animations, better loading states, and premium feel
(function() {
    'use strict';
    
    // === SITE CONFIGURATION ===
    
    // Save site name and description
    async function saveSiteConfig() {
        const siteName = document.getElementById('site-name')?.value.trim() || 'Lite Media';
        const siteDesc = document.getElementById('site-desc')?.value.trim() || 'Personal media gallery';
        
        try {
            await window.storage.set('site-name', siteName);
            await window.storage.set('site-description', siteDesc);
            
            // Update sidebar immediately
            updateSidebarInfo();
            
            showAlert('Site configuration saved!', 'success');
            showSaveIndicator();
        } catch (e) {
            showAlert('Failed to save configuration', 'error');
        }
    }
    
    // Update sidebar with site info
    async function updateSidebarInfo() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        // Get saved values
        let siteName = 'Lite Media';
        let siteDesc = 'Personal media gallery';
        
        try {
            const nameData = await window.storage.get('site-name');
            if (nameData && nameData.value) siteName = nameData.value;
            
            const descData = await window.storage.get('site-description');
            if (descData && descData.value) siteDesc = descData.value;
        } catch (e) {
            console.log('Using default site info');
        }
        
        // Update logo text
        const logoText = sidebar.querySelector('.logo-text');
        if (logoText) {
            logoText.textContent = siteName;
        }
        
        // Remove old site-info if exists
        const oldInfo = sidebar.querySelector('.site-info');
        if (oldInfo) oldInfo.remove();
        
        // Add site description between nav and settings
        const navList = sidebar.querySelector('.nav-list');
        if (!navList) return;
        
        const siteInfo = document.createElement('div');
        siteInfo.className = 'site-info';
        siteInfo.innerHTML = `
            <div class="site-info-content">
                <p class="site-info-desc">${siteDesc}</p>
            </div>
        `;
        
        // Insert before the last nav-item (Settings)
        const navItems = navList.querySelectorAll('.nav-item');
        const settingsItem = navItems[navItems.length - 1];
        
        navList.insertBefore(siteInfo, settingsItem);
    }
    
    // === LOADING STATES ===
    
    // Show skeleton loading
    function showSkeletonLoader(container, count = 3) {
        if (!container) return;
        
        const skeletons = Array(count).fill(0).map(() => `
            <div class="skeleton-card">
                <div class="skeleton-media"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `).join('');
        
        container.innerHTML = `<div class="skeleton-grid">${skeletons}</div>`;
    }
    
    // Show loading spinner
    function showLoadingSpinner(message = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner-icon"></div>
            <p class="spinner-text">${message}</p>
        `;
        document.body.appendChild(spinner);
        return spinner;
    }
    
    // Hide loading spinner
    function hideLoadingSpinner(spinner) {
        if (spinner) {
            spinner.classList.add('fade-out');
            setTimeout(() => spinner.remove(), 300);
        }
    }
    
    // === ANIMATIONS ===
    
    // Fade in elements
    function fadeIn(element, delay = 0) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }
    
    // Stagger animation for multiple elements
    function staggerFadeIn(elements, delayBetween = 50) {
        elements.forEach((element, index) => {
            fadeIn(element, index * delayBetween);
        });
    }
    
    // Pulse animation
    function pulseElement(element) {
        if (!element) return;
        
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 600);
    }
    
    // === SAVE INDICATOR ===
    
    function showSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (!indicator) return;
        
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2000);
    }
    
    // === ALERTS ===
    
    function showAlert(message, type = 'info') {
        const container = document.getElementById('alert-container');
        if (!container) {
            console.log(`Alert: ${message}`);
            return;
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} slide-in`;
        alert.innerHTML = `
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
    
    // === SMOOTH SCROLLING ===
    
    function smoothScrollTo(element) {
        if (!element) return;
        
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    // === CARD ANIMATIONS ===
    
    // Animate card removal
    function animateCardRemoval(card, onComplete) {
        if (!card) {
            if (onComplete) onComplete();
            return;
        }
        
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            card.remove();
            if (onComplete) onComplete();
        }, 300);
    }
    
    // Animate card addition
    function animateCardAddition(card) {
        if (!card) return;
        
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, 10);
    }
    
    // === EMPTY STATES ===
    
    function createEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-subtitle">${subtitle}</p>
            </div>
        `;
    }
    
    // === TAB ANIMATIONS ===
    
    function animateTabSwitch(oldTab, newTab) {
        if (!oldTab || !newTab) return;
        
        oldTab.style.transition = 'opacity 0.2s ease';
        oldTab.style.opacity = '0';
        
        setTimeout(() => {
            oldTab.classList.remove('active');
            oldTab.style.display = 'none';
            
            newTab.style.display = 'block';
            newTab.style.opacity = '0';
            
            setTimeout(() => {
                newTab.classList.add('active');
                newTab.style.transition = 'opacity 0.2s ease';
                newTab.style.opacity = '1';
            }, 10);
        }, 200);
    }
    
    // === INITIALIZATION ===
    
    async function init() {
        // Initialize sidebar info
        await updateSidebarInfo();
        
        // Add CSS classes for animations
        addAnimationStyles();
        
        // Enhance existing elements
        enhanceExistingUI();
        
        // Listen for storage changes
        if (window.storageEvents) {
            window.storageEvents.on('site-name', updateSidebarInfo);
            window.storageEvents.on('site-description', updateSidebarInfo);
        }
        
        console.log('✨ UI Polish initialized');
    }
    
    function addAnimationStyles() {
        if (document.getElementById('ui-polish-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ui-polish-styles';
        style.textContent = `
            /* Site Info in Sidebar */
            .site-info {
                padding: var(--spacing-md) var(--spacing-lg);
                margin: var(--spacing-lg) 0;
                border-top: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
            }
            
            .site-info-desc {
                font-size: 13px;
                line-height: 1.5;
                color: var(--text-secondary);
                margin: 0;
            }
            
            /* Skeleton Loaders */
            .skeleton-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: var(--spacing-md);
                padding: var(--spacing-lg) 0;
            }
            
            .skeleton-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                animation: skeleton-pulse 1.5s ease-in-out infinite;
            }
            
            .skeleton-media {
                width: 100%;
                height: 150px;
                background: var(--bg-primary);
                border-radius: var(--radius-sm);
                margin-bottom: var(--spacing-sm);
            }
            
            .skeleton-text {
                width: 100%;
                height: 16px;
                background: var(--bg-primary);
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .skeleton-text.short {
                width: 60%;
            }
            
            @keyframes skeleton-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            /* Loading Spinner */
            .loading-spinner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            }
            
            .loading-spinner.fade-out {
                animation: fadeOut 0.3s ease forwards;
            }
            
            .spinner-icon {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            
            .spinner-text {
                color: white;
                margin-top: var(--spacing-md);
                font-size: 16px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Pulse Animation */
            .pulse {
                animation: pulse 0.6s ease-out;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            /* Slide In Animation */
            .slide-in {
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            /* Fade Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            /* Alert Close Button */
            .alert-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
                margin-left: 12px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .alert-close:hover {
                opacity: 1;
            }
            
            /* Empty State */
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                animation: fadeIn 0.5s ease;
            }
            
            .empty-state-icon {
                font-size: 72px;
                margin-bottom: 16px;
                opacity: 0.5;
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .empty-state-title {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-primary);
            }
            
            .empty-state-subtitle {
                font-size: 14px;
                color: var(--text-secondary);
            }
            
            /* Save Indicator Enhancement */
            .save-indicator {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: var(--accent-color);
                color: white;
                padding: 12px 20px;
                border-radius: 50px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                z-index: 1000;
                font-weight: 500;
                font-size: 14px;
            }
            
            .save-indicator.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            /* Button Hover Effects */
            .btn {
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .btn:active {
                transform: translateY(0);
            }
            
            /* Card Hover Effects */
            .media-item,
            .link-item,
            .file-item,
            .source-card {
                transition: all 0.3s ease;
            }
            
            .media-item:hover,
            .link-item:hover,
            .file-item:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            }
            
            /* Tab Transition */
            .tab-content {
                animation: fadeIn 0.3s ease;
            }
            
            /* Smooth transitions for all interactive elements */
            button, a, input, select, textarea {
                transition: all 0.2s ease;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    function enhanceExistingUI() {
        // Add hover effects to existing buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                pulseElement(this);
            });
        });
        
        // Animate existing cards on load
        const cards = document.querySelectorAll('.media-item, .link-item, .file-item');
        staggerFadeIn(Array.from(cards), 30);
    }
    
    // === EXPORT ===
    
    window.uiPolish = {
        saveSiteConfig,
        updateSidebarInfo,
        showSkeletonLoader,
        showLoadingSpinner,
        hideLoadingSpinner,
        fadeIn,
        staggerFadeIn,
        pulseElement,
        showSaveIndicator,
        showAlert,
        smoothScrollTo,
        animateCardRemoval,
        animateCardAddition,
        createEmptyState,
        animateTabSwitch
    };
    
    // Add to adminGallery for compatibility
    if (window.adminGallery) {
        window.adminGallery.saveAccountSettings = saveSiteConfig;
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
