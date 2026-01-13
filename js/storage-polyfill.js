/**
 * Storage Polyfill for Local Development
 * 
 * Provides window.storage API compatible with Claude.ai artifacts
 * but uses browser's localStorage instead
 */

(function() {
    'use strict';
    
    // Check if already defined (in Claude.ai environment)
    if (window.storage) {
        console.log('✅ Using native window.storage');
        return;
    }
    
    console.log('🔧 Initializing localStorage polyfill for window.storage');
    
    /**
     * Storage API Implementation
     */
    window.storage = {
        /**
         * Get a value from storage
         * @param {string} key - Storage key
         * @param {boolean} shared - Ignored in polyfill (local only)
         * @returns {Promise<{key: string, value: string, shared: boolean}|null>}
         */
        async get(key, shared = false) {
            try {
                const value = localStorage.getItem(key);
                if (value === null) {
                    throw new Error(`Key '${key}' not found in storage`);
                }
                return {
                    key: key,
                    value: value,
                    shared: shared
                };
            } catch (error) {
                throw error;
            }
        },
        
        /**
         * Set a value in storage
         * @param {string} key - Storage key
         * @param {string} value - Value to store
         * @param {boolean} shared - Ignored in polyfill (local only)
         * @returns {Promise<{key: string, value: string, shared: boolean}|null>}
         */
        async set(key, value, shared = false) {
            try {
                // Validate key
                if (!key || typeof key !== 'string') {
                    throw new Error('Invalid key');
                }
                
                // Validate key format (no whitespace, slashes, quotes)
                if (/[\s\/\\'"']/.test(key)) {
                    throw new Error('Key contains invalid characters');
                }
                
                // Check key length
                if (key.length > 200) {
                    throw new Error('Key too long (max 200 characters)');
                }
                
                // Check value size (5MB limit)
                const valueSize = new Blob([value]).size;
                if (valueSize > 5 * 1024 * 1024) {
                    throw new Error('Value too large (max 5MB)');
                }
                
                localStorage.setItem(key, value);
                
                return {
                    key: key,
                    value: value,
                    shared: shared
                };
            } catch (error) {
                console.error('Storage set error:', error);
                return null;
            }
        },
        
        /**
         * Delete a value from storage
         * @param {string} key - Storage key
         * @param {boolean} shared - Ignored in polyfill (local only)
         * @returns {Promise<{key: string, deleted: boolean, shared: boolean}|null>}
         */
        async delete(key, shared = false) {
            try {
                localStorage.removeItem(key);
                return {
                    key: key,
                    deleted: true,
                    shared: shared
                };
            } catch (error) {
                console.error('Storage delete error:', error);
                return null;
            }
        },
        
        /**
         * List keys with optional prefix filter
         * @param {string} prefix - Optional prefix to filter keys
         * @param {boolean} shared - Ignored in polyfill (local only)
         * @returns {Promise<{keys: string[], prefix?: string, shared: boolean}|null>}
         */
        async list(prefix = '', shared = false) {
            try {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (!prefix || key.startsWith(prefix))) {
                        keys.push(key);
                    }
                }
                
                return {
                    keys: keys,
                    prefix: prefix || undefined,
                    shared: shared
                };
            } catch (error) {
                console.error('Storage list error:', error);
                return null;
            }
        }
    };
    
    /**
     * Utility: Clear all storage (for development)
     */
    window.storage.clearAll = function() {
        if (confirm('⚠️ Clear ALL storage data? This cannot be undone!')) {
            localStorage.clear();
            console.log('✅ All storage cleared');
            window.location.reload();
        }
    };
    
    /**
     * Utility: Export all data (for backup)
     */
    window.storage.export = function() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    };
    
    /**
     * Utility: Import data (for restore)
     */
    window.storage.import = function(data) {
        Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
        });
        console.log('✅ Imported', Object.keys(data).length, 'items');
    };
    
    console.log('✅ Storage polyfill loaded successfully');
    
})();
