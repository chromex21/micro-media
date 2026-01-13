// Facebook-style Mobile Header Controller
// Handles expandable search and filter modal on mobile
(function() {
    'use strict';
    
    // Only run on mobile
    if (window.innerWidth > 768) return;
    
    let currentPage = '';
    let searchOverlay, filterModal, filterBackdrop;
    let searchInput, typeFilter, sortFilter;
    let activeFilters = {
        type: 'all',
        sort: 'recent'
    };
    
    // Detect current page
    function detectPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path.endsWith('/')) {
            return { name: 'feed', title: 'Media Feed', icon: '▶' };
        } else if (path.includes('files.html')) {
            return { name: 'files', title: 'Files', icon: '📁' };
        } else if (path.includes('links.html')) {
            return { name: 'links', title: 'Links', icon: '🔗' };
        }
        return { name: 'feed', title: 'Media Feed', icon: '▶' };
    }
    
    // Create mobile header
    function createMobileHeader() {
        const page = detectPage();
        currentPage = page.name;
        
        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `
            <a href="index.html" class="mobile-header-logo">${page.icon}</a>
            <div class="mobile-header-title">${page.title}</div>
            <button class="mobile-search-btn" aria-label="Search">🔍</button>
            <button class="mobile-filter-btn" aria-label="Filters">⚙️</button>
        `;
        
        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(header, mainContent.firstChild);
        }
        
        // Setup event listeners
        const searchBtn = header.querySelector('.mobile-search-btn');
        const filterBtn = header.querySelector('.mobile-filter-btn');
        
        searchBtn.addEventListener('click', openSearch);
        filterBtn.addEventListener('click', openFilters);
    }
    
    // Create search overlay
    function createSearchOverlay() {
        searchOverlay = document.createElement('div');
        searchOverlay.className = 'mobile-search-overlay';
        searchOverlay.innerHTML = `
            <div class="mobile-search-header">
                <button class="mobile-search-back" aria-label="Back">←</button>
                <input type="search" class="mobile-search-input" placeholder="Search..." autofocus>
            </div>
            <div class="mobile-search-results" style="display: none;"></div>
        `;
        
        document.body.appendChild(searchOverlay);
        
        const backBtn = searchOverlay.querySelector('.mobile-search-back');
        searchInput = searchOverlay.querySelector('.mobile-search-input');
        
        backBtn.addEventListener('click', closeSearch);
        
        // Connect to existing search functionality
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Create filter modal
    function createFilterModal() {
        // Create backdrop
        filterBackdrop = document.createElement('div');
        filterBackdrop.className = 'mobile-filter-backdrop';
        filterBackdrop.addEventListener('click', closeFilters);
        document.body.appendChild(filterBackdrop);
        
        // Create modal
        filterModal = document.createElement('div');
        filterModal.className = 'mobile-filter-modal';
        
        const filterOptions = getFilterOptionsForPage();
        
        filterModal.innerHTML = `
            <div class="mobile-filter-header">
                <div class="mobile-filter-title">Filters</div>
                <button class="mobile-filter-close" aria-label="Close">×</button>
            </div>
            ${filterOptions}
            <div class="mobile-filter-apply">
                <button class="mobile-filter-apply-btn">Apply Filters</button>
            </div>
        `;
        
        document.body.appendChild(filterModal);
        
        const closeBtn = filterModal.querySelector('.mobile-filter-close');
        const applyBtn = filterModal.querySelector('.mobile-filter-apply-btn');
        
        closeBtn.addEventListener('click', closeFilters);
        applyBtn.addEventListener('click', applyFilters);
        
        // Setup filter option listeners
        setupFilterListeners();
    }
    
    // Get filter options based on current page
    function getFilterOptionsForPage() {
        if (currentPage === 'feed') {
            return `
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Type</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-type="all">
                            <input type="radio" name="type" value="all" checked>
                            <span>All Media</span>
                        </label>
                        <label class="mobile-filter-option" data-type="image">
                            <input type="radio" name="type" value="image">
                            <span>Images</span>
                        </label>
                        <label class="mobile-filter-option" data-type="video">
                            <input type="radio" name="type" value="video">
                            <span>Videos</span>
                        </label>
                    </div>
                </div>
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Sort By</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-sort="recent">
                            <input type="radio" name="sort" value="recent" checked>
                            <span>Recently Added</span>
                        </label>
                        <label class="mobile-filter-option" data-sort="oldest">
                            <input type="radio" name="sort" value="oldest">
                            <span>Oldest First</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (currentPage === 'files') {
            return `
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Type</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-type="all">
                            <input type="radio" name="type" value="all" checked>
                            <span>All Types</span>
                        </label>
                        <label class="mobile-filter-option" data-type="pdf">
                            <input type="radio" name="type" value="pdf">
                            <span>PDFs</span>
                        </label>
                        <label class="mobile-filter-option" data-type="doc">
                            <input type="radio" name="type" value="doc,docx">
                            <span>Documents</span>
                        </label>
                        <label class="mobile-filter-option" data-type="image">
                            <input type="radio" name="type" value="jpg,jpeg,png,gif">
                            <span>Images</span>
                        </label>
                    </div>
                </div>
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Sort By</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-sort="name-asc">
                            <input type="radio" name="sort" value="name-asc" checked>
                            <span>Name (A-Z)</span>
                        </label>
                        <label class="mobile-filter-option" data-sort="date-desc">
                            <input type="radio" name="sort" value="date-desc">
                            <span>Newest First</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (currentPage === 'links') {
            return `
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Category</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-category="all">
                            <input type="radio" name="category" value="all" checked>
                            <span>All Categories</span>
                        </label>
                        <label class="mobile-filter-option" data-category="social">
                            <input type="radio" name="category" value="social">
                            <span>Social Media</span>
                        </label>
                        <label class="mobile-filter-option" data-category="dev">
                            <input type="radio" name="category" value="dev">
                            <span>Development</span>
                        </label>
                        <label class="mobile-filter-option" data-category="video">
                            <input type="radio" name="category" value="video">
                            <span>Video</span>
                        </label>
                    </div>
                </div>
                <div class="mobile-filter-section">
                    <div class="mobile-filter-section-title">Sort By</div>
                    <div class="mobile-filter-options">
                        <label class="mobile-filter-option active" data-sort="recent">
                            <input type="radio" name="sort" value="recent" checked>
                            <span>Recently Added</span>
                        </label>
                        <label class="mobile-filter-option" data-sort="title-asc">
                            <input type="radio" name="sort" value="title-asc">
                            <span>Title (A-Z)</span>
                        </label>
                    </div>
                </div>
            `;
        }
        return '';
    }
    
    // Setup filter option listeners
    function setupFilterListeners() {
        const options = filterModal.querySelectorAll('.mobile-filter-option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                const section = this.closest('.mobile-filter-section');
                const siblings = section.querySelectorAll('.mobile-filter-option');
                siblings.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                // Check the radio button
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });
    }
    
    // Open search overlay
    function openSearch() {
        searchOverlay.classList.add('active');
        searchInput.focus();
    }
    
    // Close search overlay
    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        
        // Clear search in desktop input
        const desktopSearch = getDesktopSearchInput();
        if (desktopSearch) {
            desktopSearch.value = '';
            desktopSearch.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Open filter modal
    function openFilters() {
        filterBackdrop.classList.add('active');
        filterModal.classList.add('active');
    }
    
    // Close filter modal
    function closeFilters() {
        filterBackdrop.classList.remove('active');
        filterModal.classList.remove('active');
    }
    
    // Apply filters
    function applyFilters() {
        const typeInput = filterModal.querySelector('input[name="type"]:checked');
        const sortInput = filterModal.querySelector('input[name="sort"]:checked');
        const categoryInput = filterModal.querySelector('input[name="category"]:checked');
        
        // Update desktop filters
        if (currentPage === 'feed') {
            const typeFilter = document.getElementById('feed-type-filter');
            const sortFilter = document.getElementById('feed-sort');
            
            if (typeFilter && typeInput) {
                typeFilter.value = typeInput.value;
                typeFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (sortFilter && sortInput) {
                sortFilter.value = sortInput.value;
                sortFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (currentPage === 'files') {
            const typeFilter = document.getElementById('file-type-filter');
            const sortFilter = document.getElementById('file-sort');
            
            if (typeFilter && typeInput) {
                typeFilter.value = typeInput.value;
                typeFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (sortFilter && sortInput) {
                sortFilter.value = sortInput.value;
                sortFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (currentPage === 'links') {
            const categoryFilter = document.getElementById('link-category-filter');
            const sortFilter = document.getElementById('link-sort');
            
            if (categoryFilter && categoryInput) {
                categoryFilter.value = categoryInput.value;
                categoryFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (sortFilter && sortInput) {
                sortFilter.value = sortInput.value;
                sortFilter.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Update filter button indicator
        updateFilterIndicator();
        
        closeFilters();
    }
    
    // Handle search input
    function handleSearch() {
        const value = searchInput.value;
        
        // Update desktop search
        const desktopSearch = getDesktopSearchInput();
        if (desktopSearch) {
            desktopSearch.value = value;
            desktopSearch.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Get desktop search input based on page
    function getDesktopSearchInput() {
        if (currentPage === 'feed') {
            return document.getElementById('feed-search');
        } else if (currentPage === 'files') {
            return document.getElementById('file-search');
        } else if (currentPage === 'links') {
            return document.getElementById('links-search');
        }
        return null;
    }
    
    // Update filter button indicator
    function updateFilterIndicator() {
        const filterBtn = document.querySelector('.mobile-filter-btn');
        if (!filterBtn) return;
        
        const hasActiveFilters = filterModal.querySelectorAll('.mobile-filter-option.active[data-type]:not([data-type="all"])').length > 0 ||
                                filterModal.querySelectorAll('.mobile-filter-option.active[data-category]:not([data-category="all"])').length > 0;
        
        if (hasActiveFilters) {
            filterBtn.classList.add('has-filters');
        } else {
            filterBtn.classList.remove('has-filters');
        }
    }
    
    // Initialize
    function init() {
        createMobileHeader();
        createSearchOverlay();
        createFilterModal();
        
        console.log('✨ Mobile header initialized (Facebook-style)');
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
