/**
 * Reusable Search Component
 * Provides client-side search/filter functionality for any content array
 * 
 * Usage:
 * const searcher = new ContentSearcher({
 *     searchInputId: 'my-search-input',
 *     clearButtonId: 'my-search-clear',
 *     resultsInfoId: 'my-results-info',
 *     searchableFields: ['title', 'desc', 'url'],
 *     onSearch: (filteredItems, searchTerm) => {
 *         // Render filtered items
 *     }
 * });
 * 
 * searcher.setData(myItemsArray);
 */

class ContentSearcher {
    constructor(options) {
        this.options = {
            searchInputId: options.searchInputId || 'search-input',
            clearButtonId: options.clearButtonId || 'search-clear',
            resultsInfoId: options.resultsInfoId || 'search-info',
            searchableFields: options.searchableFields || ['title', 'desc'],
            onSearch: options.onSearch || (() => {}),
            caseSensitive: options.caseSensitive || false,
            debounceMs: options.debounceMs || 150
        };
        
        this.allItems = [];
        this.filteredItems = [];
        this.currentSearchTerm = '';
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        this.searchInput = document.getElementById(this.options.searchInputId);
        this.clearButton = document.getElementById(this.options.clearButtonId);
        this.resultsInfo = document.getElementById(this.options.resultsInfoId);
        
        if (!this.searchInput) {
            console.error(`Search input with id "${this.options.searchInputId}" not found`);
            return;
        }
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Input event with debouncing
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Update clear button visibility
            if (this.clearButton) {
                this.clearButton.classList.toggle('visible', value.length > 0);
            }
            
            // Debounce search
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.performSearch(value);
            }, this.options.debounceMs);
        });
        
        // Clear button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Enter key to search (if no debounce needed)
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.debounceTimer);
                this.performSearch(this.searchInput.value);
            }
        });
    }
    
    setData(items) {
        this.allItems = items || [];
        this.performSearch(this.currentSearchTerm);
    }
    
    performSearch(searchTerm) {
        this.currentSearchTerm = searchTerm;
        
        if (!searchTerm.trim()) {
            this.filteredItems = [...this.allItems];
            this.updateResultsInfo(false);
            this.options.onSearch(this.filteredItems, '');
            return;
        }
        
        const term = this.options.caseSensitive 
            ? searchTerm 
            : searchTerm.toLowerCase();
        
        this.filteredItems = this.allItems.filter(item => {
            return this.options.searchableFields.some(field => {
                const value = this.getNestedValue(item, field);
                if (!value) return false;
                
                const stringValue = String(value);
                const searchValue = this.options.caseSensitive 
                    ? stringValue 
                    : stringValue.toLowerCase();
                
                return searchValue.includes(term);
            });
        });
        
        this.updateResultsInfo(true);
        this.options.onSearch(this.filteredItems, searchTerm);
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    updateResultsInfo(isSearching) {
        if (!this.resultsInfo) return;
        
        if (isSearching) {
            this.resultsInfo.textContent = 
                `Found ${this.filteredItems.length} of ${this.allItems.length} items`;
        } else if (this.allItems.length > 0) {
            this.resultsInfo.textContent = 
                `Showing all ${this.allItems.length} items`;
        } else {
            this.resultsInfo.textContent = '';
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        if (this.clearButton) {
            this.clearButton.classList.remove('visible');
        }
        this.performSearch('');
        this.searchInput.focus();
    }
    
    // Public method to programmatically set search term
    search(term) {
        this.searchInput.value = term;
        if (this.clearButton) {
            this.clearButton.classList.toggle('visible', term.length > 0);
        }
        this.performSearch(term);
    }
    
    // Public method to get current results
    getResults() {
        return {
            filtered: [...this.filteredItems],
            all: [...this.allItems],
            searchTerm: this.currentSearchTerm
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSearcher;
}
