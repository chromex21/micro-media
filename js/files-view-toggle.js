// Files View Toggle System
// Allows switching between Grid and List views
(function() {
    'use strict';
    
    class FilesViewManager {
        constructor() {
            this.currentView = 'grid'; // default view
            this.storageKey = 'files-view-preference';
            this.init();
        }
        
        init() {
            // Load saved preference
            this.loadViewPreference();
            
            // Create view toggle controls
            this.createViewToggle();
        }
        
        // Create view toggle buttons
        createViewToggle() {
            // Check if we're on standalone Files page
            const filesPage = document.querySelector('.files-page-header');
            if (filesPage) {
                this.injectStandaloneToggle(filesPage);
                return; // Only inject on Files page, NOT in admin
            }
        }
        

        
        // Inject toggle into standalone page
        injectStandaloneToggle(header) {
            if (header.querySelector('.view-toggle-group')) return; // Already added
            
            const toggleGroup = this.createToggleButtons();
            header.appendChild(toggleGroup);
            
            this.applyView('files-container');
        }
        
        // Create toggle button group
        createToggleButtons() {
            const group = document.createElement('div');
            group.className = 'view-toggle-group';
            group.innerHTML = `
                <button class="view-toggle-btn ${this.currentView === 'grid' ? 'active' : ''}" 
                        data-view="grid" 
                        title="Grid View"
                        aria-label="Grid View">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>
                <button class="view-toggle-btn ${this.currentView === 'list' ? 'active' : ''}" 
                        data-view="list" 
                        title="List View"
                        aria-label="List View">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </button>
            `;
            
            // Attach click handlers
            const buttons = group.querySelectorAll('.view-toggle-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.setView(view);
                });
            });
            
            return group;
        }
        
        // Set and apply view
        setView(view) {
            if (view !== 'grid' && view !== 'list') return;
            
            this.currentView = view;
            this.saveViewPreference();
            
            // Update button states
            document.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            
            // Apply view to all file containers
            this.applyView('files-list');
            this.applyView('files-container');
        }
        
        // Apply view to container
        applyView(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Remove existing view classes
            container.classList.remove('view-grid', 'view-list');
            
            // Add new view class
            container.classList.add(`view-${this.currentView}`);
            
            // Re-render if needed (for admin panel)
            if (containerId === 'files-list' && window.adminGallery && window.adminGallery.renderFiles) {
                // Don't re-render immediately, let the CSS handle it
            }
        }
        
        // Save preference to storage
        saveViewPreference() {
            try {
                localStorage.setItem(this.storageKey, this.currentView);
            } catch (e) {
                console.warn('Failed to save view preference:', e);
            }
        }
        
        // Load preference from storage
        loadViewPreference() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved === 'grid' || saved === 'list') {
                    this.currentView = saved;
                }
            } catch (e) {
                console.warn('Failed to load view preference:', e);
            }
        }
        
        // Public API
        toggleView() {
            const newView = this.currentView === 'grid' ? 'list' : 'grid';
            this.setView(newView);
        }
        
        getCurrentView() {
            return this.currentView;
        }
    }
    
    // Export to global scope
    window.FilesViewManager = FilesViewManager;
    window.filesViewManager = new FilesViewManager();
    
})();
