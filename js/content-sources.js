// Content Sources Manager
// Handles RSS feeds, APIs, and external content auto-import
(function() {
    'use strict';
    
    const contentSources = {
        sources: [],
        settings: {
            autoSync: true,
            showSourceLabel: true,
            maxItems: 10,
            syncInterval: 3600000 // 1 hour
        },
        syncTimer: null,
        
        async init() {
            await this.loadSources();
            await this.loadSettings();
            this.render();
            
            if (this.settings.autoSync) {
                this.startAutoSync();
            }
            
            console.log('📡 Content Sources initialized');
        },
        
        async loadSources() {
            try {
                const data = await window.storage.get('content-sources');
                if (data && data.value) {
                    this.sources = JSON.parse(data.value);
                }
            } catch (e) {
                this.sources = [];
            }
        },
        
        async saveSources() {
            try {
                await window.storage.set('content-sources', JSON.stringify(this.sources));
                this.showAlert('Sources saved successfully!', 'success');
            } catch (e) {
                this.showAlert('Failed to save sources', 'error');
            }
        },
        
        async loadSettings() {
            try {
                const data = await window.storage.get('content-sources-settings');
                if (data && data.value) {
                    this.settings = { ...this.settings, ...JSON.parse(data.value) };
                }
            } catch (e) {
                // Use defaults
            }
            
            // Update UI
            document.getElementById('auto-sync').checked = this.settings.autoSync;
            document.getElementById('show-source-label').checked = this.settings.showSourceLabel;
            document.getElementById('max-items').value = this.settings.maxItems;
        },
        
        async saveSettings() {
            this.settings.autoSync = document.getElementById('auto-sync').checked;
            this.settings.showSourceLabel = document.getElementById('show-source-label').checked;
            this.settings.maxItems = parseInt(document.getElementById('max-items').value) || 10;
            
            try {
                await window.storage.set('content-sources-settings', JSON.stringify(this.settings));
                this.showAlert('Settings saved!', 'success');
                
                // Restart auto-sync if needed
                if (this.settings.autoSync) {
                    this.startAutoSync();
                } else {
                    this.stopAutoSync();
                }
            } catch (e) {
                this.showAlert('Failed to save settings', 'error');
            }
        },
        
        render() {
            const list = document.getElementById('sources-list');
            const count = document.getElementById('sources-count');
            const lastSync = document.getElementById('last-sync');
            
            if (!list) return;
            
            count.textContent = this.sources.length;
            
            // Get last sync time
            const lastSyncTime = this.sources.reduce((latest, source) => {
                return source.lastSync && source.lastSync > latest ? source.lastSync : latest;
            }, 0);
            
            if (lastSyncTime) {
                const date = new Date(lastSyncTime);
                lastSync.textContent = this.formatRelativeTime(date);
            } else {
                lastSync.textContent = 'Never';
            }
            
            if (this.sources.length === 0) {
                list.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <p style="font-size: 48px; margin-bottom: 16px;">📭</p>
                        <p>No content sources yet</p>
                        <p style="font-size: 14px; margin-top: 8px;">Add an RSS feed or API to get started!</p>
                    </div>
                `;
                return;
            }
            
            list.innerHTML = this.sources.map(source => this.renderSourceCard(source)).join('');
        },
        
        renderSourceCard(source) {
            const statusColor = source.active ? 'var(--accent-color)' : 'var(--text-secondary)';
            const statusIcon = source.active ? '✓' : '○';
            const typeIcons = {
                'rss': '📢',
                'youtube': '🎬',
                'api': '🔌',
                'webhook': '🔔'
            };
            
            return `
                <div class="link-item" style="display: flex; gap: 16px; align-items: start;">
                    <div style="font-size: 32px; flex-shrink: 0;">
                        ${typeIcons[source.type] || '📡'}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">
                                    ${source.name}
                                </div>
                                <div style="font-size: 13px; color: var(--text-secondary); word-break: break-all;">
                                    ${source.url}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 12px;">
                                <button 
                                    class="btn btn-small" 
                                    onclick="window.contentSources.editSource('${source.id}')"
                                    style="background: var(--bg-secondary); color: var(--text-primary);"
                                >
                                    ✏️
                                </button>
                                <button 
                                    class="btn btn-small btn-danger" 
                                    onclick="window.contentSources.deleteSource('${source.id}')"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                            <span style="color: ${statusColor};">
                                ${statusIcon} ${source.active ? 'Active' : 'Paused'}
                            </span>
                            <span>
                                ${source.itemCount || 0} items imported
                            </span>
                            <span>
                                Last sync: ${source.lastSync ? this.formatRelativeTime(new Date(source.lastSync)) : 'Never'}
                            </span>
                        </div>
                        ${source.error ? `
                            <div style="margin-top: 8px; padding: 8px 12px; background: #f8d7da; color: #721c24; border-radius: 4px; font-size: 12px;">
                                ⚠️ ${source.error}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        },
        
        // Add RSS Feed
        async addRSSFeed() {
            const modal = this.createModal('Add RSS Feed', `
                <div class="form-group">
                    <label>Feed Name</label>
                    <input type="text" id="source-name" placeholder="My Blog" style="padding: 10px;">
                </div>
                <div class="form-group">
                    <label>RSS Feed URL</label>
                    <input type="url" id="source-url" placeholder="https://example.com/feed.xml" style="padding: 10px;">
                    <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 4px;">
                        Enter the RSS or Atom feed URL
                    </small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="source-active" checked>
                        <span style="margin-left: 8px;">Active (start syncing immediately)</span>
                    </label>
                </div>
            `, async () => {
                const name = document.getElementById('source-name').value.trim();
                const url = document.getElementById('source-url').value.trim();
                const active = document.getElementById('source-active').checked;
                
                if (!name || !url) {
                    this.showAlert('Please fill in all fields', 'error');
                    return;
                }
                
                const source = {
                    id: `rss_${Date.now()}`,
                    type: 'rss',
                    name,
                    url,
                    active,
                    itemCount: 0,
                    lastSync: null,
                    error: null
                };
                
                this.sources.push(source);
                await this.saveSources();
                
                if (active) {
                    await this.syncSource(source);
                }
                
                this.render();
                modal.close();
            });
        },
        
        // Add YouTube Channel
        async addYouTubeChannel() {
            const modal = this.createModal('Add YouTube Channel', `
                <div class="form-group">
                    <label>Channel Name</label>
                    <input type="text" id="source-name" placeholder="Tech Channel" style="padding: 10px;">
                </div>
                <div class="form-group">
                    <label>Channel URL or ID</label>
                    <input type="text" id="source-url" placeholder="@ChannelName or UCxxxxxxxxxxxxxxxxxx" style="padding: 10px;">
                    <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 4px;">
                        Enter YouTube channel handle (@username) or channel ID (UC...)
                    </small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="source-active" checked>
                        <span style="margin-left: 8px;">Active (start syncing immediately)</span>
                    </label>
                </div>
            `, async () => {
                const name = document.getElementById('source-name').value.trim();
                let url = document.getElementById('source-url').value.trim();
                const active = document.getElementById('source-active').checked;
                
                if (!name || !url) {
                    this.showAlert('Please fill in all fields', 'error');
                    return;
                }
                
                // Convert to RSS feed URL
                if (url.startsWith('@')) {
                    // Handle format
                    url = `https://www.youtube.com/feeds/videos.xml?user=${url.substring(1)}`;
                } else if (url.startsWith('UC')) {
                    // Channel ID format
                    url = `https://www.youtube.com/feeds/videos.xml?channel_id=${url}`;
                } else if (url.includes('youtube.com/channel/')) {
                    // Full URL format
                    const channelId = url.match(/channel\\/([^/]+)/)[1];
                    url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
                } else if (url.includes('youtube.com/@')) {
                    // Handle URL format
                    const handle = url.match(/@([^/]+)/)[1];
                    url = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
                }
                
                const source = {
                    id: `youtube_${Date.now()}`,
                    type: 'youtube',
                    name,
                    url,
                    active,
                    itemCount: 0,
                    lastSync: null,
                    error: null
                };
                
                this.sources.push(source);
                await this.saveSources();
                
                if (active) {
                    await this.syncSource(source);
                }
                
                this.render();
                modal.close();
            });
        },
        
        // Add Custom API
        async addCustomAPI() {
            const modal = this.createModal('Add Custom API', `
                <div class="form-group">
                    <label>API Name</label>
                    <input type="text" id="source-name" placeholder="News API" style="padding: 10px;">
                </div>
                <div class="form-group">
                    <label>API Endpoint URL</label>
                    <input type="url" id="source-url" placeholder="https://api.example.com/posts" style="padding: 10px;">
                </div>
                <div class="form-group">
                    <label>API Key (optional)</label>
                    <input type="password" id="api-key" placeholder="your-api-key" style="padding: 10px;">
                    <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 4px;">
                        Leave blank if no authentication required
                    </small>
                </div>
                <div class="form-group">
                    <label>Response Path (optional)</label>
                    <input type="text" id="response-path" placeholder="data.posts or items" style="padding: 10px;">
                    <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 4px;">
                        JSON path to the array of items (e.g., "data.posts" or "items")
                    </small>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="source-active" checked>
                        <span style="margin-left: 8px;">Active (start syncing immediately)</span>
                    </label>
                </div>
            `, async () => {
                const name = document.getElementById('source-name').value.trim();
                const url = document.getElementById('source-url').value.trim();
                const apiKey = document.getElementById('api-key').value.trim();
                const responsePath = document.getElementById('response-path').value.trim();
                const active = document.getElementById('source-active').checked;
                
                if (!name || !url) {
                    this.showAlert('Please fill in all required fields', 'error');
                    return;
                }
                
                const source = {
                    id: `api_${Date.now()}`,
                    type: 'api',
                    name,
                    url,
                    apiKey: apiKey || null,
                    responsePath: responsePath || null,
                    active,
                    itemCount: 0,
                    lastSync: null,
                    error: null
                };
                
                this.sources.push(source);
                await this.saveSources();
                
                if (active) {
                    await this.syncSource(source);
                }
                
                this.render();
                modal.close();
            });
        },
        
        // Sync a single source
        async syncSource(source) {
            console.log(`🔄 Syncing ${source.name}...`);
            
            try {
                let items = [];
                
                if (source.type === 'rss' || source.type === 'youtube') {
                    items = await this.fetchRSS(source.url);
                } else if (source.type === 'api') {
                    items = await this.fetchAPI(source.url, source.apiKey, source.responsePath);
                }
                
                // Limit items
                items = items.slice(0, this.settings.maxItems);
                
                // Add to feed
                await this.addItemsToFeed(items, source);
                
                // Update source
                const sourceIndex = this.sources.findIndex(s => s.id === source.id);
                if (sourceIndex !== -1) {
                    this.sources[sourceIndex].lastSync = Date.now();
                    this.sources[sourceIndex].itemCount = items.length;
                    this.sources[sourceIndex].error = null;
                    await this.saveSources();
                }
                
                this.showAlert(`Synced ${items.length} items from ${source.name}`, 'success');
                this.render();
                
            } catch (error) {
                console.error(`Failed to sync ${source.name}:`, error);
                
                // Update source with error
                const sourceIndex = this.sources.findIndex(s => s.id === source.id);
                if (sourceIndex !== -1) {
                    this.sources[sourceIndex].error = error.message;
                    await this.saveSources();
                }
                
                this.showAlert(`Failed to sync ${source.name}: ${error.message}`, 'error');
                this.render();
            }
        },
        
        // Fetch RSS feed
        async fetchRSS(url) {
            // Use a CORS proxy for RSS feeds
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch feed');
            
            const data = await response.json();
            const xmlText = data.contents;
            
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            
            // Parse RSS or Atom
            const items = [];
            const entries = xml.querySelectorAll('item, entry');
            
            entries.forEach(entry => {
                const title = entry.querySelector('title')?.textContent || 'Untitled';
                const link = entry.querySelector('link')?.textContent || entry.querySelector('link')?.getAttribute('href') || '';
                const description = entry.querySelector('description, summary')?.textContent || '';
                const pubDate = entry.querySelector('pubDate, published')?.textContent || '';
                
                // Try to extract image
                let imageUrl = '';
                const mediaContent = entry.querySelector('media\\:content, content');
                if (mediaContent) {
                    imageUrl = mediaContent.getAttribute('url') || '';
                }
                if (!imageUrl) {
                    const enclosure = entry.querySelector('enclosure[type^="image"]');
                    if (enclosure) {
                        imageUrl = enclosure.getAttribute('url') || '';
                    }
                }
                
                items.push({
                    title,
                    url: link,
                    desc: description,
                    image: imageUrl,
                    pubDate
                });
            });
            
            return items;
        },
        
        // Fetch from custom API
        async fetchAPI(url, apiKey, responsePath) {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            let data = await response.json();
            
            // Navigate to response path if provided
            if (responsePath) {
                const path = responsePath.split('.');
                for (const key of path) {
                    data = data[key];
                    if (!data) throw new Error(`Invalid response path: ${responsePath}`);
                }
            }
            
            if (!Array.isArray(data)) {
                throw new Error('Response is not an array');
            }
            
            // Map to our format (try to detect common fields)
            return data.map(item => ({
                title: item.title || item.name || item.headline || 'Untitled',
                url: item.url || item.link || item.href || '',
                desc: item.description || item.summary || item.content || '',
                image: item.image || item.thumbnail || item.img || '',
                pubDate: item.pubDate || item.published || item.date || ''
            }));
        },
        
        // Add items to feed
        async addItemsToFeed(items, source) {
            // Get current cloud links
            let cloudLinks = [];
            try {
                const data = await window.storage.get('site-links');
                if (data && data.value) {
                    cloudLinks = JSON.parse(data.value);
                }
            } catch (e) {
                cloudLinks = [];
            }
            
            // Add new items (avoid duplicates by URL)
            const existingUrls = new Set(cloudLinks.map(link => link.url));
            
            items.forEach(item => {
                if (!existingUrls.has(item.url)) {
                    cloudLinks.push({
                        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title: item.title,
                        url: item.url,
                        desc: item.desc,
                        image: item.image,
                        source: this.settings.showSourceLabel ? source.name : null,
                        imported: true,
                        uploadDate: Date.now()
                    });
                }
            });
            
            // Save updated links
            await window.storage.set('site-links', JSON.stringify(cloudLinks));
        },
        
        // Sync all active sources
        async syncAll() {
            this.showAlert('Syncing all sources...', 'info');
            
            const activeSources = this.sources.filter(s => s.active);
            
            for (const source of activeSources) {
                await this.syncSource(source);
            }
            
            this.showAlert('All sources synced!', 'success');
        },
        
        // Auto-sync timer
        startAutoSync() {
            this.stopAutoSync();
            
            this.syncTimer = setInterval(() => {
                console.log('🔄 Auto-syncing content sources...');
                this.syncAll();
            }, this.settings.syncInterval);
            
            console.log('✅ Auto-sync enabled');
        },
        
        stopAutoSync() {
            if (this.syncTimer) {
                clearInterval(this.syncTimer);
                this.syncTimer = null;
                console.log('⏸️ Auto-sync disabled');
            }
        },
        
        // Edit source
        async editSource(id) {
            const source = this.sources.find(s => s.id === id);
            if (!source) return;
            
            // Toggle active status for now (can expand to full edit modal later)
            source.active = !source.active;
            await this.saveSources();
            this.render();
            
            this.showAlert(`${source.name} is now ${source.active ? 'active' : 'paused'}`, 'success');
        },
        
        // Delete source
        async deleteSource(id) {
            if (!confirm('Delete this content source?')) return;
            
            this.sources = this.sources.filter(s => s.id !== id);
            await this.saveSources();
            this.render();
            
            this.showAlert('Source deleted', 'success');
        },
        
        // Helper: Create modal
        createModal(title, bodyHTML, onSave) {
            const modal = document.createElement('div');
            modal.className = 'edit-modal';
            modal.innerHTML = `
                <div class="edit-modal-overlay"></div>
                <div class="edit-modal-content">
                    <div class="edit-modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close-btn">×</button>
                    </div>
                    <div class="edit-modal-body">
                        ${bodyHTML}
                        <div class="form-actions">
                            <button class="btn" id="modal-cancel" style="background: var(--bg-secondary); color: var(--text-primary);">Cancel</button>
                            <button class="btn" id="modal-save">Save</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const close = () => {
                modal.classList.add('closing');
                setTimeout(() => modal.remove(), 200);
            };
            
            modal.querySelector('.modal-close-btn').addEventListener('click', close);
            modal.querySelector('.edit-modal-overlay').addEventListener('click', close);
            modal.querySelector('#modal-cancel').addEventListener('click', close);
            modal.querySelector('#modal-save').addEventListener('click', onSave);
            
            return { element: modal, close };
        },
        
        // Helper: Show alert
        showAlert(message, type) {
            const container = document.getElementById('alert-container');
            if (!container) return;
            
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.textContent = message;
            
            container.appendChild(alert);
            
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 3000);
        },
        
        // Helper: Format relative time
        formatRelativeTime(date) {
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            
            return date.toLocaleDateString();
        }
    };
    
    // Expose globally
    window.contentSources = contentSources;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => contentSources.init());
    } else {
        contentSources.init();
    }
})();
