// Storage Event System - Real-time sync across pages
// Enables live updates when data changes in storage
(function() {
    'use strict';
    
    // Event emitter for storage changes
    class StorageEventEmitter {
        constructor() {
            this.listeners = new Map();
            this.setupStorageListener();
        }
        
        // Listen for storage changes from other tabs/windows
        setupStorageListener() {
            // Custom event for same-page updates
            window.addEventListener('storage-update', (e) => {
                this.emit(e.detail.key, e.detail.value);
            });
            
            // Native storage event for cross-tab updates
            window.addEventListener('storage', (e) => {
                if (e.key && e.newValue) {
                    this.emit(e.key, e.newValue);
                }
            });
        }
        
        // Register a listener for a specific storage key
        on(key, callback) {
            if (!this.listeners.has(key)) {
                this.listeners.set(key, []);
            }
            this.listeners.get(key).push(callback);
        }
        
        // Remove a listener
        off(key, callback) {
            if (!this.listeners.has(key)) return;
            
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        
        // Emit event to all listeners
        emit(key, value) {
            if (!this.listeners.has(key)) return;
            
            const callbacks = this.listeners.get(key);
            callbacks.forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.error('Storage event listener error:', error);
                }
            });
        }
        
        // Trigger update manually (for same-page updates)
        trigger(key, value) {
            // Dispatch custom event
            const event = new CustomEvent('storage-update', {
                detail: { key, value }
            });
            window.dispatchEvent(event);
        }
    }
    
    // Create global instance
    window.storageEvents = new StorageEventEmitter();
    
    // Enhance storage.set to trigger events
    if (window.storage && window.storage.set) {
        const originalSet = window.storage.set;
        window.storage.set = async function(key, value) {
            const result = await originalSet.call(this, key, value);
            
            // Trigger event for listeners
            window.storageEvents.trigger(key, value);
            
            return result;
        };
    }
    
    console.log('✅ Storage event system initialized');
    
})();
