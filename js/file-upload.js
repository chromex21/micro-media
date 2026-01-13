// Custom File Upload System
(function() {
    'use strict';
    
    // File upload manager
    class FileUploadManager {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            
            // Guard against double initialization
            if (this.container._fileUploaderInitialized) {
                console.warn('File uploader already initialized on this container');
                return this.container._fileUploaderInstance;
            }
            this.container._fileUploaderInitialized = true;
            this.container._fileUploaderInstance = this;
            
            this.options = {
                maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB default
                allowedTypes: options.allowedTypes || ['*'],
                multiple: options.multiple !== false,
                onUpload: options.onUpload || null,
                onProgress: options.onProgress || null,
                onComplete: options.onComplete || null,
                onError: options.onError || null
            };
            
            this.files = [];
            this.isUploading = false;
            
            this.init();
        }
        
        init() {
            this.render();
            this.attachEvents();
        }
        
        render() {
            this.container.innerHTML = `
                <div class="file-upload-zone" id="${this.container.id}-zone">
                    <input 
                        type="file" 
                        id="${this.container.id}-input" 
                        class="file-upload-input" 
                        ${this.options.multiple ? 'multiple' : ''}
                        style="display: none;"
                    >
                    
                    <div class="upload-content" id="${this.container.id}-content">
                        <div class="upload-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div class="upload-text">
                            <p class="upload-main-text">Drag & drop files here</p>
                            <p class="upload-sub-text">or</p>
                            <button type="button" class="btn-upload" id="${this.container.id}-btn">
                                Browse Files
                            </button>
                        </div>
                        <div class="upload-hint">
                            ${this.getUploadHint()}
                        </div>
                    </div>
                    
                    <div class="upload-preview" id="${this.container.id}-preview" style="display: none;">
                        <div class="preview-header">
                            <h4>Selected Files</h4>
                            <button type="button" class="btn-clear" id="${this.container.id}-clear">Clear All</button>
                        </div>
                        <div class="preview-list" id="${this.container.id}-list"></div>
                        <div class="preview-actions">
                            <button type="button" class="btn btn-secondary" id="${this.container.id}-cancel">Cancel</button>
                            <button type="button" class="btn btn-primary" id="${this.container.id}-upload">
                                <span class="upload-btn-text">Upload Files</span>
                                <span class="upload-btn-count"></span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        getUploadHint() {
            const maxSize = this.formatFileSize(this.options.maxFileSize);
            const types = this.options.allowedTypes.join(', ');
            return `Maximum file size: ${maxSize}${types !== '*' ? ` • Allowed types: ${types}` : ''}`;
        }
        
        attachEvents() {
            const zone = document.getElementById(`${this.container.id}-zone`);
            const input = document.getElementById(`${this.container.id}-input`);
            const btn = document.getElementById(`${this.container.id}-btn`);
            const clearBtn = document.getElementById(`${this.container.id}-clear`);
            const cancelBtn = document.getElementById(`${this.container.id}-cancel`);
            const uploadBtn = document.getElementById(`${this.container.id}-upload`);
            
            // Drag and drop events
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            zone.addEventListener('drop', (e) => this.handleDrop(e));
            
            // Click to browse
            btn.addEventListener('click', () => input.click());
            zone.addEventListener('click', (e) => {
                if (e.target === zone || e.target.closest('.upload-content')) {
                    input.click();
                }
            });
            
            // File input change
            input.addEventListener('change', (e) => this.handleFileSelect(e));
            
            // Button events
            clearBtn.addEventListener('click', () => this.clearFiles());
            cancelBtn.addEventListener('click', () => this.clearFiles());
            uploadBtn.addEventListener('click', () => this.uploadFiles());
        }
        
        handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            const zone = document.getElementById(`${this.container.id}-zone`);
            zone.classList.add('drag-over');
        }
        
        handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            const zone = document.getElementById(`${this.container.id}-zone`);
            zone.classList.remove('drag-over');
        }
        
        handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            const zone = document.getElementById(`${this.container.id}-zone`);
            zone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.addFiles(files);
        }
        
        handleFileSelect(e) {
            const files = Array.from(e.target.files);
            this.addFiles(files);
        }
        
        addFiles(newFiles) {
            // Validate files
            const validFiles = newFiles.filter(file => this.validateFile(file));
            
            if (validFiles.length === 0) return;
            
            // Add to files array
            if (this.options.multiple) {
                this.files.push(...validFiles);
            } else {
                this.files = [validFiles[0]];
            }
            
            this.updatePreview();
        }
        
        validateFile(file) {
            // Check file size
            if (file.size > this.options.maxFileSize) {
                this.showError(`File "${file.name}" exceeds maximum size of ${this.formatFileSize(this.options.maxFileSize)}`);
                return false;
            }
            
            // Check file type
            if (this.options.allowedTypes[0] !== '*') {
                const fileExt = file.name.split('.').pop().toLowerCase();
                if (!this.options.allowedTypes.includes(fileExt)) {
                    this.showError(`File type ".${fileExt}" is not allowed`);
                    return false;
                }
            }
            
            return true;
        }
        
        updatePreview() {
            const content = document.getElementById(`${this.container.id}-content`);
            const preview = document.getElementById(`${this.container.id}-preview`);
            const list = document.getElementById(`${this.container.id}-list`);
            const uploadBtn = document.getElementById(`${this.container.id}-upload`);
            const countSpan = uploadBtn.querySelector('.upload-btn-count');
            
            if (this.files.length === 0) {
                content.style.display = 'flex';
                preview.style.display = 'none';
                return;
            }
            
            content.style.display = 'none';
            preview.style.display = 'block';
            
            // Update count
            countSpan.textContent = `(${this.files.length})`;
            
            // Render file list
            list.innerHTML = '';
            this.files.forEach((file, index) => {
                const item = this.createFilePreviewItem(file, index);
                list.appendChild(item);
            });
        }
        
        createFilePreviewItem(file, index) {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.dataset.index = index;
            
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            let preview = '';
            if (isImage) {
                const url = URL.createObjectURL(file);
                preview = `<img src="${url}" class="preview-thumbnail" alt="${file.name}">`;
            } else if (isVideo) {
                const url = URL.createObjectURL(file);
                preview = `<video src="${url}" class="preview-thumbnail" muted></video>`;
            } else {
                preview = `<div class="preview-thumbnail preview-file-icon">${this.getFileIcon(file)}</div>`;
            }
            
            item.innerHTML = `
                ${preview}
                <div class="preview-info">
                    <div class="preview-name">${file.name}</div>
                    <div class="preview-meta">
                        <span class="preview-size">${this.formatFileSize(file.size)}</span>
                        <span class="preview-type">${file.type || 'Unknown'}</span>
                    </div>
                    <div class="preview-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-text">0%</div>
                    </div>
                </div>
                <button type="button" class="btn-remove" data-index="${index}" title="Remove">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            
            // Attach remove button event
            const removeBtn = item.querySelector('.btn-remove');
            removeBtn.addEventListener('click', () => this.removeFile(index));
            
            return item;
        }
        
        getFileIcon(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            const icons = {
                'pdf': '📄',
                'doc': '📝', 'docx': '📝',
                'xls': '📊', 'xlsx': '📊',
                'ppt': '📊', 'pptx': '📊',
                'zip': '📦', 'rar': '📦', '7z': '📦',
                'mp3': '🎵', 'wav': '🎵',
                'mp4': '🎬', 'avi': '🎬', 'mov': '🎬'
            };
            return icons[ext] || '📎';
        }
        
        removeFile(index) {
            this.files.splice(index, 1);
            this.updatePreview();
        }
        
        clearFiles() {
            this.files = [];
            this.updatePreview();
            
            // Reset input
            const input = document.getElementById(`${this.container.id}-input`);
            input.value = '';
        }
        
        async uploadFiles() {
            if (this.files.length === 0 || this.isUploading) return;
            
            this.isUploading = true;
            const uploadBtn = document.getElementById(`${this.container.id}-upload`);
            const btnText = uploadBtn.querySelector('.upload-btn-text');
            const originalText = btnText.textContent;
            
            uploadBtn.disabled = true;
            btnText.textContent = 'Uploading...';
            
            try {
                // Show progress for each file
                for (let i = 0; i < this.files.length; i++) {
                    const file = this.files[i];
                    await this.uploadSingleFile(file, i);
                }
                
                // Call completion callback
                if (this.options.onComplete) {
                    this.options.onComplete(this.files);
                }
                
                // Show success message
                this.showSuccess(`Successfully uploaded ${this.files.length} file(s)`);
                
                // Clear files after successful upload
                setTimeout(() => {
                    this.clearFiles();
                }, 1500);
                
            } catch (error) {
                this.showError(`Upload failed: ${error.message}`);
                if (this.options.onError) {
                    this.options.onError(error);
                }
            } finally {
                this.isUploading = false;
                uploadBtn.disabled = false;
                btnText.textContent = originalText;
            }
        }
        
        async uploadSingleFile(file, index) {
            return new Promise((resolve, reject) => {
                const item = document.querySelector(`[data-index="${index}"]`);
                if (!item) {
                    resolve();
                    return;
                }
                
                const progressContainer = item.querySelector('.preview-progress');
                const progressFill = item.querySelector('.progress-fill');
                const progressText = item.querySelector('.progress-text');
                
                progressContainer.style.display = 'block';
                
                // Simulate upload progress (replace with actual upload logic)
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 30;
                    if (progress > 100) progress = 100;
                    
                    progressFill.style.width = progress + '%';
                    progressText.textContent = Math.round(progress) + '%';
                    
                    if (this.options.onProgress) {
                        this.options.onProgress(file, progress, index);
                    }
                    
                    if (progress >= 100) {
                        clearInterval(interval);
                        progressContainer.classList.add('complete');
                        setTimeout(() => resolve(), 300);
                    }
                }, 100);
                
                // Call upload callback if provided
                if (this.options.onUpload) {
                    this.options.onUpload(file, index);
                }
            });
        }
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
        
        showError(message) {
            // Create temporary error toast
            const toast = document.createElement('div');
            toast.className = 'upload-toast upload-toast-error';
            toast.textContent = '❌ ' + message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
        
        showSuccess(message) {
            const toast = document.createElement('div');
            toast.className = 'upload-toast upload-toast-success';
            toast.textContent = '✅ ' + message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
    
    // Export to global scope
    window.FileUploadManager = FileUploadManager;
    
})();
