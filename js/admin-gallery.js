// Admin Gallery Management with Custom Modals
// Handles all content management: videos, images, links, files, and about page
(function() {
    'use strict';
    
    // === DATA STORAGE ===
    // Central storage for all site content
    let siteData = {
        videos: [],
        images: [],
        links: [],
        files: [],
        about: '',
        deletedMedia: [] // Track deleted media files to prevent re-adding
    };
    
    let currentEditModal = null;
    
    // === INITIALIZATION ===
    async function init() {
        console.log('→ Admin Gallery initializing...');
        await loadFromStorage();
        updateStats();
        console.log('✓ Admin Gallery ready');
    }
    
    // === STORAGE MANAGEMENT ===
    
    // Load all data from persistent storage
    async function loadFromStorage() {
        try {
            // Load videos
            const videosData = await window.storage.get('media-videos');
            if (videosData && videosData.value) {
                siteData.videos = JSON.parse(videosData.value);
            } else {
                // Fall back to catalog if no storage data
                await loadFromCatalog();
            }
            
            // Load images
            const imagesData = await window.storage.get('media-images');
            if (imagesData && imagesData.value) {
                siteData.images = JSON.parse(imagesData.value);
            }
            
            // Load links
            const linksData = await window.storage.get('site-links');
            if (linksData && linksData.value) {
                siteData.links = JSON.parse(linksData.value);
            }
            
            // Load files
            const filesData = await window.storage.get('site-files');
            if (filesData && filesData.value) {
                siteData.files = JSON.parse(filesData.value);
            }
            
            // Load account settings
            const siteNameData = await window.storage.get('site-name');
            if (siteNameData && siteNameData.value) {
                const siteNameInput = document.getElementById('site-name');
                if (siteNameInput) siteNameInput.value = siteNameData.value;
            }
            
            const siteDescData = await window.storage.get('site-description');
            if (siteDescData && siteDescData.value) {
                const siteDescInput = document.getElementById('site-desc');
                if (siteDescInput) siteDescInput.value = siteDescData.value;
            }
            
            // Load deleted media list
            const deletedData = await window.storage.get('deleted-media');
            if (deletedData && deletedData.value) {
                siteData.deletedMedia = JSON.parse(deletedData.value);
            }
            
            // Render all content to UI
            renderAll();
            console.log(`✅ Loaded ${siteData.videos.length} videos, ${siteData.images.length} images, ${siteData.links.length} links from storage`);
        } catch (error) {
            console.error('Storage error:', error);
            console.log('→ Loading from catalog fallback');
            await loadFromCatalog();
        }
    }
    
    // Load from media-catalog.js (fallback)
    async function loadFromCatalog() {
        if (typeof mediaCatalog !== 'undefined') {
            siteData.videos = [];
            siteData.images = [];
            
            // Process videos from catalog
            if (mediaCatalog.videos) {
                mediaCatalog.videos.forEach(item => {
                    if (typeof item === 'string') {
                        siteData.videos.push({ file: item, title: '', desc: '' });
                    } else {
                        siteData.videos.push({
                            file: item.file,
                            title: item.title || '',
                            desc: item.desc || ''
                        });
                    }
                });
            }
            
            // Process images from catalog
            if (mediaCatalog.images) {
                mediaCatalog.images.forEach(item => {
                    if (typeof item === 'string') {
                        siteData.images.push({ file: item, title: '', desc: '' });
                    } else {
                        siteData.images.push({
                            file: item.file,
                            title: item.title || '',
                            desc: item.desc || ''
                        });
                    }
                });
            }
            
            // Save to storage and render
            await saveToStorage();
            renderAll();
            updateStats();
        }
    }
    
    // Save all data to persistent storage
    async function saveToStorage() {
        try {
            // Save each data type separately for better organization
            await window.storage.set('media-videos', JSON.stringify(siteData.videos));
            await window.storage.set('media-images', JSON.stringify(siteData.images));
            await window.storage.set('site-links', JSON.stringify(siteData.links));
            await window.storage.set('site-files', JSON.stringify(siteData.files));
            await window.storage.set('site-about', siteData.about);
            await window.storage.set('deleted-media', JSON.stringify(siteData.deletedMedia));
            
            console.log('✅ Data saved to storage successfully');
            console.log('Saved videos:', siteData.videos.length);
            console.log('Saved images:', siteData.images.length);
            console.log('Deleted media:', siteData.deletedMedia.length);
            return true;
        } catch (error) {
            console.error('❌ Save error:', error);
            showAlert('❌ Failed to save. Please try again.', 'error');
            return false;
        }
    }
    
    // === MEDIA SCANNING ===
    
    // Scan for new media files in the catalog
    async function scanForNewMedia() {
        showAlert('🔄 Scanning for new files...', 'info');
        
        if (typeof mediaCatalog !== 'undefined') {
            // Track existing files
            const existingVideoFiles = new Set(siteData.videos.map(v => v.file));
            const existingImageFiles = new Set(siteData.images.map(i => i.file));
            
            let newVideos = 0, newImages = 0;
            
            // Check for new videos
            if (mediaCatalog.videos) {
                mediaCatalog.videos.forEach(item => {
                    const filename = typeof item === 'string' ? item : item.file;
                    // Skip if already exists OR if it's in deleted list
                    if (!existingVideoFiles.has(filename) && !siteData.deletedMedia.includes('video:' + filename)) {
                        siteData.videos.push({
                            file: filename,
                            title: typeof item === 'object' ? (item.title || '') : '',
                            desc: typeof item === 'object' ? (item.desc || '') : ''
                        });
                        newVideos++;
                    }
                });
            }
            
            // Check for new images
            if (mediaCatalog.images) {
                mediaCatalog.images.forEach(item => {
                    const filename = typeof item === 'string' ? item : item.file;
                    // Skip if already exists OR if it's in deleted list
                    if (!existingImageFiles.has(filename) && !siteData.deletedMedia.includes('image:' + filename)) {
                        siteData.images.push({
                            file: filename,
                            title: typeof item === 'object' ? (item.title || '') : '',
                            desc: typeof item === 'object' ? (item.desc || '') : ''
                        });
                        newImages++;
                    }
                });
            }
            
            // Save and update UI if new files found
            if (newVideos > 0 || newImages > 0) {
                await saveToStorage();
                renderAll();
                updateStats();
                showAlert(`✅ Found ${newVideos} new video(s) and ${newImages} new image(s)!`, 'success');
            } else {
                showAlert('✓ No new files found.', 'info');
            }
        }
    }
    
    // === RENDERING FUNCTIONS ===
    
    // Render all content sections
    function renderAll() {
        // Only render if elements exist (page fully loaded)
        if (!document.getElementById('videos-grid')) {
            console.warn('⚠ Grid elements not ready, deferring render');
            setTimeout(renderAll, 100);
            return;
        }
        renderVideos();
        renderImages();
        renderLinks();
        renderFiles();
        renderCloudMedia(); // Add cloud media rendering
    }
    
    // Render videos grid with compact cards
    function renderVideos() {
        const grid = document.getElementById('videos-grid');
        if (!grid) return;
        
        if (siteData.videos.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎥</div><p>No videos yet.</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        siteData.videos.forEach((video, index) => {
            const item = document.createElement('div');
            item.className = 'media-item-compact';
            item.innerHTML = `
                <div class="media-preview-small">
                    <video src="media/videos/sd/${video.file}" muted></video>
                </div>
                <div class="media-info">
                    <div class="media-filename-small">🎥 ${video.file}</div>
                    <div class="media-meta-small">
                        ${video.title ? `<strong>${video.title}</strong>` : '<span class="text-muted">No title</span>'}
                    </div>
                </div>
                <div class="media-actions">
                    <button class="btn-icon" onclick="window.adminGallery.editVideo(${index})" title="Edit">✏️</button>
                    <button class="btn-icon btn-danger" onclick="window.adminGallery.removeVideo(${index})" title="Delete">🗑️</button>
                </div>
            `;
            grid.appendChild(item);
        });
    }
    
    // Render images grid with compact cards
    function renderImages() {
        const grid = document.getElementById('images-grid');
        if (!grid) return;
        
        if (siteData.images.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🖼️</div><p>No images yet.</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        siteData.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'media-item-compact';
            item.innerHTML = `
                <div class="media-preview-small">
                    <img src="media/images/full/${image.file}" alt="">
                </div>
                <div class="media-info">
                    <div class="media-filename-small">🖼️ ${image.file}</div>
                    <div class="media-meta-small">
                        ${image.title ? `<strong>${image.title}</strong>` : '<span class="text-muted">No title</span>'}
                    </div>
                </div>
                <div class="media-actions">
                    <button class="btn-icon" onclick="window.adminGallery.editImage(${index})" title="Edit">✏️</button>
                    <button class="btn-icon btn-danger" onclick="window.adminGallery.removeImage(${index})" title="Delete">🗑️</button>
                </div>
            `;
            grid.appendChild(item);
        });
    }
    
    // Render links list with compact cards
    function renderLinks() {
        const list = document.getElementById('links-list');
        if (!list) return;
        
        if (siteData.links.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔗</div><p>No links yet.</p></div>';
            return;
        }
        
        list.innerHTML = '';
        siteData.links.forEach((link, index) => {
            const item = document.createElement('div');
            item.className = 'media-item-compact';
            item.innerHTML = `
                <div class="media-preview-small" style="background: linear-gradient(135deg, var(--accent-color) 0%, #667eea 100%);">
                    <div style="font-size: 32px;">${getEmojiForUrl(link.url)}</div>
                </div>
                <div class="media-info">
                    <div class="media-filename-small">🔗 ${getDomainFromUrl(link.url)}</div>
                    <div class="media-meta-small">
                        ${link.title ? `<strong>${link.title}</strong>` : '<span class="text-muted">No title</span>'}
                    </div>
                </div>
                <div class="media-actions">
                    <button class="btn-icon" onclick="window.adminGallery.editLink(${index})" title="Edit">✏️</button>
                    <button class="btn-icon btn-danger" onclick="window.adminGallery.removeLink(${index})" title="Delete">🗑️</button>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    // Render files list
    function renderFiles() {
        const list = document.getElementById('files-list');
        if (!list) return;
        
        if (siteData.files.length === 0) {
            list.innerHTML = '<div class="files-empty-state"><div class="files-empty-icon">📁</div><div class="files-empty-title">No files yet</div><div class="files-empty-subtitle">Upload files to get started</div></div>';
            return;
        }
        
        list.innerHTML = '';
        siteData.files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.dataset.type = file.type || 'unknown';
            
            const fileIcon = getFileIcon(file.type || file.name.split('.').pop());
            const fileSize = file.size || 'Unknown size';
            
            item.innerHTML = `
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-type">${file.type.toUpperCase()}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    ${file.desc ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: var(--text-secondary);">${file.desc}</p>` : ''}
                </div>
                <div class="file-actions">
                    <button class="btn-icon btn-danger" onclick="window.adminGallery.removeFile(${index})" title="Delete">
                        🗑️
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
    }
    
    // === EDITING FUNCTIONS ===
    
    // Edit video metadata
    function editVideo(index) {
        const video = siteData.videos[index];
        showEditModal({
            type: 'video',
            index: index,
            title: 'Edit Video',
            file: video.file,
            data: video,
            onSave: async (newData) => {
                siteData.videos[index] = { ...siteData.videos[index], ...newData };
                const saved = await saveToStorage();
                if (saved) {
                    renderVideos();
                    showAlert('✅ Video updated!', 'success');
                    return true;
                }
                return false;
            }
        });
    }
    
    // Edit image metadata
    function editImage(index) {
        const image = siteData.images[index];
        showEditModal({
            type: 'image',
            index: index,
            title: 'Edit Image',
            file: image.file,
            data: image,
            onSave: async (newData) => {
                siteData.images[index] = { ...siteData.images[index], ...newData };
                const saved = await saveToStorage();
                if (saved) {
                    renderImages();
                    showAlert('✅ Image updated!', 'success');
                    return true;
                }
                return false;
            }
        });
    }
    
    // Edit link data
    function editLink(index) {
        const link = siteData.links[index];
        showEditModal({
            type: 'link',
            index: index,
            title: 'Edit Link',
            file: link.url,
            data: link,
            customFields: true,
            onSave: async (newData) => {
                siteData.links[index] = { ...siteData.links[index], ...newData };
                const saved = await saveToStorage();
                if (saved) {
                    renderLinks();
                    showAlert('✅ Link updated!', 'success');
                    return true;
                }
                return false;
            }
        });
    }
    
    // === CUSTOM MODAL FOR ADDING NEW LINK ===
    // This replaces the ugly browser prompt()
    async function addNewLink() {
        // Check if custom modal system is loaded
        if (!window.customModal) {
            console.error('Custom modal system not loaded');
            showAlert('❌ Modal system not available', 'error');
            return;
        }
        
        // Show custom modal with form fields
        window.customModal.show('Add New Link', [
            {
                name: 'url',
                label: 'URL',
                type: 'url',
                placeholder: 'https://example.com',
                required: true
            },
            {
                name: 'title',
                label: 'Title',
                type: 'text',
                placeholder: 'Enter a descriptive title',
                required: true
            },
            {
                name: 'desc',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Add a description (optional)',
                required: false
            }
        ], async (formData) => {
            // Add the new link to our data
            siteData.links.push({
                url: formData.url,
                title: formData.title,
                desc: formData.desc || '',
                image: '' // Optional: could add image URL field later
            });
            
            // Save to storage
            const saved = await saveToStorage();
            if (saved) {
                // Re-render links list
                renderLinks();
                showAlert('✅ Link added successfully!', 'success');
            }
        });
    }
    
    // === EDIT MODAL SYSTEM ===
    // Generic modal for editing videos, images, and links
    function showEditModal(config) {
        // Remove existing modal if any
        const existingModal = document.getElementById('edit-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.className = 'edit-modal';
        
        let previewHtml = '';
        let filenameHtml = '';
        
        // Generate preview based on content type
        if (config.type === 'link' || config.type === 'cloud-video' || config.type === 'cloud-image') {
            previewHtml = `
                <div class="edit-preview" style="background: linear-gradient(135deg, var(--accent-color) 0%, #667eea 100%); display: flex; align-items: center; justify-content: center; height: 200px;">
                    <div style="font-size: 64px;">${config.type === 'cloud-video' ? '🎥' : config.type === 'cloud-image' ? '🖼️' : getEmojiForUrl(config.file)}</div>
                </div>
            `;
            filenameHtml = `<div class="edit-filename">☁️ ${getDomainFromUrl(config.file)}</div>`;
        } else {
            previewHtml = `
                <div class="edit-preview">
                    ${config.type === 'video' 
                        ? `<video src="media/videos/sd/${config.file}" controls style="width: 100%; max-height: 300px;"></video>`
                        : `<img src="media/images/full/${config.file}" alt="" style="width: 100%; max-height: 300px; object-fit: contain;">`
                    }
                </div>
            `;
            filenameHtml = `<div class="edit-filename">${config.file}</div>`;
        }
        
        // Generate form fields based on content type
        const formFields = (config.type === 'link' || config.type === 'cloud-video' || config.type === 'cloud-image') ? `
            <div class="form-group">
                <label for="edit-url">URL</label>
                <input 
                    type="url" 
                    id="edit-url" 
                    value="${config.data.url || ''}" 
                    placeholder="https://example.com"
                    required
                >
            </div>
            <div class="form-group">
                <label for="edit-title">Title</label>
                <input 
                    type="text" 
                    id="edit-title" 
                    value="${config.data.title || ''}" 
                    placeholder="Enter a title for this ${config.type.includes('cloud') ? 'cloud media' : 'link'}"
                    required
                >
            </div>
            <div class="form-group">
                <label for="edit-desc">Description</label>
                <textarea 
                    id="edit-desc" 
                    rows="4"
                    placeholder="Add a description (optional)"
                >${config.data.desc || ''}</textarea>
            </div>
        ` : `
            <div class="form-group">
                <label for="edit-title">Title</label>
                <input 
                    type="text" 
                    id="edit-title" 
                    value="${config.data.title || ''}" 
                    placeholder="Enter a title for this ${config.type}"
                >
            </div>
            <div class="form-group">
                <label for="edit-desc">Description</label>
                <textarea 
                    id="edit-desc" 
                    rows="4"
                    placeholder="Add a description (optional)"
                >${config.data.desc || ''}</textarea>
            </div>
        `;
        
        // Build complete modal HTML
        modal.innerHTML = `
            <div class="edit-modal-overlay"></div>
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h3>${config.title}</h3>
                    <button class="modal-close-btn" onclick="window.adminGallery.closeEditModal()">×</button>
                </div>
                <div class="edit-modal-body">
                    ${previewHtml}
                    ${filenameHtml}
                    <form id="edit-form" class="edit-form">
                        ${formFields}
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="window.adminGallery.closeEditModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-focus first input field
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Handle form submission
        document.getElementById('edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let updateData;
            if (config.type === 'link' || config.type === 'cloud-video' || config.type === 'cloud-image') {
                updateData = {
                    url: document.getElementById('edit-url').value,
                    title: document.getElementById('edit-title').value,
                    desc: document.getElementById('edit-desc').value
                };
            } else {
                updateData = {
                    title: document.getElementById('edit-title').value,
                    desc: document.getElementById('edit-desc').value
                };
            }
            
            const saved = await config.onSave(updateData);
            if (saved) {
                console.log('✅ Save successful');
                closeEditModal();
            } else {
                console.error('❌ Save failed');
                showAlert('❌ Failed to save. Please try again.', 'error');
            }
        });
        
        // Close on overlay click
        modal.querySelector('.edit-modal-overlay').addEventListener('click', closeEditModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeEditModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    // Close the edit modal
    function closeEditModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => modal.remove(), 200);
        }
    }
    
    // === DELETE FUNCTIONS ===
    
    // Remove video with confirmation
    async function removeVideo(index) {
        if (confirm('Remove this video? This cannot be undone.')) {
            const videoFile = siteData.videos[index].file;
            // Add to deleted list to prevent re-adding
            siteData.deletedMedia.push('video:' + videoFile);
            // Remove from videos array
            siteData.videos.splice(index, 1);
            await saveToStorage();
            renderVideos();
            updateStats();
            console.log('✅ Video removed:', videoFile);
            console.log('Deleted media list:', siteData.deletedMedia);
            showAlert('✅ Video removed permanently', 'success');
        }
    }
    
    // Remove image with confirmation
    async function removeImage(index) {
        if (confirm('Remove this image? This cannot be undone.')) {
            const imageFile = siteData.images[index].file;
            // Add to deleted list to prevent re-adding
            siteData.deletedMedia.push('image:' + imageFile);
            // Remove from images array
            siteData.images.splice(index, 1);
            await saveToStorage();
            renderImages();
            updateStats();
            console.log('✅ Image removed:', imageFile);
            console.log('Deleted media list:', siteData.deletedMedia);
            showAlert('✅ Image removed permanently', 'success');
        }
    }
    
    // Remove link with confirmation
    async function removeLink(index) {
        if (confirm('Remove this link?')) {
            siteData.links.splice(index, 1);
            await saveToStorage();
            renderLinks();
            showAlert('✅ Link removed', 'success');
        }
    }
    
    // Remove file with confirmation
    async function removeFile(index) {
        if (confirm('Remove this file?')) {
            siteData.files.splice(index, 1);
            await saveToStorage();
            renderFiles();
            showAlert('✅ File removed', 'success');
        }
    }
    
    // === FILE UPLOAD HANDLING ===
    
    // Add new file (manual entry - rarely used now with upload system)
    async function addNewFile() {
        if (!window.customModal) {
            console.error('Custom modal system not loaded');
            return;
        }
        
        window.customModal.show('Add File Reference', [
            {
                name: 'name',
                label: 'File Name',
                type: 'text',
                placeholder: 'Document.pdf',
                required: true
            },
            {
                name: 'path',
                label: 'File Path',
                type: 'text',
                placeholder: 'files/Document.pdf',
                required: true
            },
            {
                name: 'desc',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Description (optional)',
                required: false
            },
            {
                name: 'size',
                label: 'File Size',
                type: 'text',
                placeholder: '2.5 MB (optional)',
                required: false
            }
        ], async (formData) => {
            const type = formData.name.split('.').pop().toLowerCase();
            
            siteData.files.push({
                name: formData.name,
                path: formData.path,
                desc: formData.desc || '',
                size: formData.size || '',
                type: type
            });
            
            const saved = await saveToStorage();
            if (saved) {
                renderFiles();
                showAlert('✅ File added!', 'success');
            }
        });
    }
    
    // Add files from upload component
    async function addUploadedFiles(files) {
        console.log('📁 Adding uploaded files:', files);
        
        // Process each uploaded file
        files.forEach(file => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            siteData.files.push({
                name: file.name,
                path: `files/${file.name}`,
                desc: '',
                size: formatFileSize(file.size),
                type: fileExt,
                uploadDate: Date.now() // Add timestamp
            });
        });
        
        // Save to storage
        const saved = await saveToStorage();
        if (saved) {
            // Re-render files list
            renderFiles();
            showAlert(`✅ Added ${files.length} file(s)!`, 'success');
        }
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // === ACCOUNT SETTINGS ===
    
    // Save account settings
    async function saveAccountSettings() {
        const siteName = document.getElementById('site-name');
        const siteDesc = document.getElementById('site-desc');
        
        if (siteName && siteDesc) {
            try {
                await window.storage.set('site-name', siteName.value);
                await window.storage.set('site-description', siteDesc.value);
                showAlert('✅ Account settings saved!', 'success');
            } catch (error) {
                console.error('Error saving settings:', error);
                showAlert('❌ Failed to save settings', 'error');
            }
        }
    }
    
    // Clear all data
    async function clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
            return;
        }
        
        if (!confirm('This will delete all videos, images, links, and files. Are you ABSOLUTELY sure?')) {
            return;
        }
        
        try {
            // Clear all storage
            await window.storage.delete('media-videos');
            await window.storage.delete('media-images');
            await window.storage.delete('site-links');
            await window.storage.delete('site-files');
            await window.storage.delete('deleted-media');
            
            // Reset local data
            siteData = {
                videos: [],
                images: [],
                links: [],
                files: [],
                about: '',
                deletedMedia: []
            };
            
            // Re-render everything
            renderAll();
            updateStats();
            
            showAlert('✅ All data cleared!', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            showAlert('❌ Failed to clear data', 'error');
        }
    }
    
    // === UI HELPERS ===
    
    // Add cloud media to feed (new function)
    async function addNewCloudMedia() {
        if (!window.customModal) {
            console.error('Custom modal system not loaded');
            return;
        }
        
        window.customModal.show('Add Cloud Media to Feed', [
            {
                name: 'url',
                label: 'Public URL',
                type: 'url',
                placeholder: 'https://dropbox.com/... or https://drive.google.com/...',
                required: true
            },
            {
                name: 'type',
                label: 'Media Type',
                type: 'select',
                options: [
                    { value: 'video', label: 'Video' },
                    { value: 'image', label: 'Image' }
                ],
                required: true
            },
            {
                name: 'title',
                label: 'Title',
                type: 'text',
                placeholder: 'Enter a title',
                required: true
            },
            {
                name: 'desc',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Add a description (optional)',
                required: false
            }
        ], async (formData) => {
            // Create cloud media item
            const cloudItem = {
                id: `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                url: formData.url,
                title: formData.title,
                desc: formData.desc || '',
                isCloudLink: true // Flag to differentiate from local files
            };
            
            // Add to appropriate array based on type
            if (formData.type === 'video') {
                siteData.videos.push(cloudItem);
            } else {
                siteData.images.push(cloudItem);
            }
            
            const saved = await saveToStorage();
            if (saved) {
                renderAll();
                updateStats();
                showAlert('✅ Cloud media added to feed!', 'success');
            }
        });
    }
    
    // Render cloud media grid
    function renderCloudMedia() {
        const grid = document.getElementById('cloud-media-grid');
        if (!grid) return;
        
        // Get all cloud items from both videos and images
        const cloudVideos = siteData.videos.filter(v => v.isCloudLink || v.url);
        const cloudImages = siteData.images.filter(i => i.isCloudLink || i.url);
        const allCloudMedia = [...cloudVideos, ...cloudImages];
        
        if (allCloudMedia.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">☁️</div><p>No cloud media yet.</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        allCloudMedia.forEach((item, index) => {
            const isVideo = cloudVideos.includes(item);
            const actualIndex = isVideo ? siteData.videos.indexOf(item) : siteData.images.indexOf(item);
            
            const card = document.createElement('div');
            card.className = 'media-item-compact';
            card.innerHTML = `
                <div class="media-preview-small" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
                    ${isVideo ? '🎥' : '🖼️'}
                </div>
                <div class="media-info">
                    <div class="media-filename-small">☁️ ${getDomainFromUrl(item.url)}</div>
                    <div class="media-meta-small">
                        ${item.title ? `<strong>${item.title}</strong>` : '<span class="text-muted">No title</span>'}
                    </div>
                </div>
                <div class="media-actions">
                    <button class="btn-icon" onclick="window.adminGallery.${isVideo ? 'editCloudVideo' : 'editCloudImage'}(${actualIndex})" title="Edit">✏️</button>
                    <button class="btn-icon btn-danger" onclick="window.adminGallery.${isVideo ? 'removeCloudVideo' : 'removeCloudImage'}(${actualIndex})" title="Delete">🗑️</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }
    
    // Edit cloud video
    function editCloudVideo(index) {
        const video = siteData.videos[index];
        showEditModal({
            type: 'cloud-video',
            index: index,
            title: 'Edit Cloud Video',
            file: video.url,
            data: video,
            customFields: true,
            onSave: async (newData) => {
                siteData.videos[index] = { ...siteData.videos[index], ...newData };
                const saved = await saveToStorage();
                if (saved) {
                    renderAll();
                    showAlert('✅ Cloud video updated!', 'success');
                    return true;
                }
                return false;
            }
        });
    }
    
    // Edit cloud image
    function editCloudImage(index) {
        const image = siteData.images[index];
        showEditModal({
            type: 'cloud-image',
            index: index,
            title: 'Edit Cloud Image',
            file: image.url,
            data: image,
            customFields: true,
            onSave: async (newData) => {
                siteData.images[index] = { ...siteData.images[index], ...newData };
                const saved = await saveToStorage();
                if (saved) {
                    renderAll();
                    showAlert('✅ Cloud image updated!', 'success');
                    return true;
                }
                return false;
            }
        });
    }
    
    // Remove cloud video
    async function removeCloudVideo(index) {
        if (confirm('Remove this cloud video from feed?')) {
            siteData.videos.splice(index, 1);
            await saveToStorage();
            renderAll();
            updateStats();
            showAlert('✅ Cloud video removed', 'success');
        }
    }
    
    // Remove cloud image
    async function removeCloudImage(index) {
        if (confirm('Remove this cloud image from feed?')) {
            siteData.images.splice(index, 1);
            await saveToStorage();
            renderAll();
            updateStats();
            showAlert('✅ Cloud image removed', 'success');
        }
    }
    
    // Update statistics display
    function updateStats() {
        const videoCount = document.getElementById('video-count');
        const imageCount = document.getElementById('image-count');
        if (videoCount) videoCount.textContent = siteData.videos.length;
        if (imageCount) imageCount.textContent = siteData.images.length;
    }
    
    // Show alert message
    function showAlert(message, type) {
        const container = document.getElementById('alert-container');
        if (!container) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        container.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => alert.remove(), 5000);
    }
    
    // Get domain from URL for display
    function getDomainFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }
    
    // Get emoji icon based on URL
    function getEmojiForUrl(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('github')) return '💻';
        if (urlLower.includes('youtube') || urlLower.includes('youtu.be')) return '🎥';
        if (urlLower.includes('twitter') || urlLower.includes('x.com')) return '🐦';
        if (urlLower.includes('instagram')) return '📷';
        if (urlLower.includes('linkedin')) return '💼';
        if (urlLower.includes('facebook')) return '👥';
        if (urlLower.includes('reddit')) return '🤖';
        if (urlLower.includes('medium') || urlLower.includes('blog')) return '✍️';
        if (urlLower.includes('docs') || urlLower.includes('documentation')) return '📚';
        if (urlLower.includes('news')) return '📰';
        if (urlLower.includes('shop') || urlLower.includes('store')) return '🛒';
        return '🔗';
    }
    
    // Get file icon based on extension
    function getFileIcon(ext) {
        const icons = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝', 'txt': '📝',
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            'ppt': '📊', 'pptx': '📊',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
            'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️'
        };
        return icons[ext.toLowerCase()] || '📎';
    }
    
    // === EXPORT TO GLOBAL SCOPE ===
    window.adminGallery = {
        init,
        render: renderAll, // Expose render function
        scanForNewMedia,
        editVideo,
        editImage,
        removeVideo,
        removeImage,
        closeEditModal,
        addNewLink,
        editLink,
        removeLink,
        addNewFile,
        removeFile,
        addUploadedFiles,
        saveAccountSettings,
        clearAllData,
        // Cloud media functions
        addNewCloudMedia,
        editCloudVideo,
        editCloudImage,
        removeCloudVideo,
        removeCloudImage
    };
    
    // === INITIALIZATION ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
