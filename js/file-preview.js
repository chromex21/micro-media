// File Preview System
// Provides modal preview for various file types
(function() {
    'use strict';
    
    class FilePreview {
        constructor() {
            this.modal = null;
            this.currentFile = null;
        }
        
        // Show preview for a file
        show(file) {
            this.currentFile = file;
            this.createModal();
            this.renderPreview();
        }
        
        // Create modal structure
        createModal() {
            // Remove existing modal if any
            if (this.modal) {
                this.modal.remove();
            }
            
            this.modal = document.createElement('div');
            this.modal.className = 'file-preview-modal';
            this.modal.innerHTML = `
                <div class="file-preview-backdrop"></div>
                <div class="file-preview-container">
                    <div class="file-preview-header">
                        <div class="file-preview-info">
                            <h3 class="file-preview-title" id="preview-title">Loading...</h3>
                            <p class="file-preview-meta" id="preview-meta"></p>
                        </div>
                        <div class="file-preview-actions">
                            <button class="file-preview-action-btn" id="preview-download" title="Download">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                            <button class="file-preview-action-btn" id="preview-close" title="Close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="file-preview-body" id="preview-body">
                        <div class="file-preview-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading preview...</p>
                        </div>
                    </div>
                    <div class="file-preview-footer">
                        <div class="file-preview-navigation">
                            <button class="nav-btn" id="preview-prev" disabled>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                Previous
                            </button>
                            <button class="nav-btn" id="preview-next" disabled>
                                Next
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.modal);
            
            // Attach event listeners
            this.attachEvents();
            
            // Show modal with animation
            setTimeout(() => {
                this.modal.classList.add('show');
            }, 10);
        }
        
        // Attach event listeners
        attachEvents() {
            const backdrop = this.modal.querySelector('.file-preview-backdrop');
            const closeBtn = this.modal.querySelector('#preview-close');
            const downloadBtn = this.modal.querySelector('#preview-download');
            
            backdrop.addEventListener('click', () => this.close());
            closeBtn.addEventListener('click', () => this.close());
            downloadBtn.addEventListener('click', () => this.download());
            
            // Keyboard navigation
            document.addEventListener('keydown', this.handleKeyboard.bind(this));
        }
        
        // Keyboard shortcuts
        handleKeyboard(e) {
            if (!this.modal || !this.modal.classList.contains('show')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    // TODO: Previous file
                    break;
                case 'ArrowRight':
                    // TODO: Next file
                    break;
            }
        }
        
        // Render preview based on file type
        renderPreview() {
            const titleEl = document.getElementById('preview-title');
            const metaEl = document.getElementById('preview-meta');
            const bodyEl = document.getElementById('preview-body');
            
            const file = this.currentFile;
            const ext = this.getFileExtension(file.name);
            const fileSize = file.size ? this.formatFileSize(file.size) : 'Unknown size';
            
            titleEl.textContent = file.name;
            metaEl.textContent = `${ext.toUpperCase()} • ${fileSize}`;
            
            // Clear loading state
            bodyEl.innerHTML = '';
            
            // Route to appropriate preview renderer
            if (this.isImage(ext)) {
                this.renderImage(bodyEl, file);
            } else if (this.isVideo(ext)) {
                this.renderVideo(bodyEl, file);
            } else if (this.isPDF(ext)) {
                this.renderPDF(bodyEl, file);
            } else if (this.isText(ext)) {
                this.renderText(bodyEl, file);
            } else if (this.isAudio(ext)) {
                this.renderAudio(bodyEl, file);
            } else {
                this.renderUnsupported(bodyEl, file);
            }
        }
        
        // Image preview
        renderImage(container, file) {
            const img = document.createElement('img');
            img.className = 'preview-image';
            img.src = file.path;
            img.alt = file.name;
            
            img.onerror = () => {
                this.renderError(container, 'Failed to load image');
            };
            
            container.appendChild(img);
        }
        
        // Video preview
        renderVideo(container, file) {
            const video = document.createElement('video');
            video.className = 'preview-video';
            video.src = file.path;
            video.controls = true;
            video.autoplay = false;
            
            video.onerror = () => {
                this.renderError(container, 'Failed to load video');
            };
            
            container.appendChild(video);
        }
        
        // PDF preview
        renderPDF(container, file) {
            const embed = document.createElement('embed');
            embed.className = 'preview-pdf';
            embed.src = file.path;
            embed.type = 'application/pdf';
            
            // Fallback for browsers without PDF support
            const fallback = document.createElement('div');
            fallback.className = 'preview-fallback';
            fallback.innerHTML = `
                <div class="fallback-icon">📄</div>
                <p>PDF preview not available in this browser</p>
                <button class="md-button md-button-filled" onclick="window.open('${file.path}', '_blank')">
                    Open in New Tab
                </button>
            `;
            
            container.appendChild(embed);
            container.appendChild(fallback);
        }
        
        // Text file preview
        async renderText(container, file) {
            try {
                const response = await fetch(file.path);
                const text = await response.text();
                
                const pre = document.createElement('pre');
                pre.className = 'preview-text';
                pre.textContent = text;
                
                container.appendChild(pre);
            } catch (error) {
                this.renderError(container, 'Failed to load text file');
            }
        }
        
        // Audio preview
        renderAudio(container, file) {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-audio-wrapper';
            
            const icon = document.createElement('div');
            icon.className = 'preview-audio-icon';
            icon.textContent = '🎵';
            
            const audio = document.createElement('audio');
            audio.className = 'preview-audio';
            audio.src = file.path;
            audio.controls = true;
            
            audio.onerror = () => {
                this.renderError(container, 'Failed to load audio');
            };
            
            wrapper.appendChild(icon);
            wrapper.appendChild(audio);
            container.appendChild(wrapper);
        }
        
        // Unsupported file type
        renderUnsupported(container, file) {
            const ext = this.getFileExtension(file.name);
            const icon = this.getFileIcon(ext);
            
            container.innerHTML = `
                <div class="preview-unsupported">
                    <div class="unsupported-icon">${icon}</div>
                    <h3>Preview Not Available</h3>
                    <p>This file type (${ext.toUpperCase()}) cannot be previewed</p>
                    <button class="md-button md-button-filled" onclick="window.filePreview.download()">
                        Download File
                    </button>
                </div>
            `;
        }
        
        // Error state
        renderError(container, message) {
            container.innerHTML = `
                <div class="preview-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Preview Error</h3>
                    <p>${message}</p>
                    <button class="md-button md-button-outlined" onclick="window.filePreview.close()">
                        Close
                    </button>
                </div>
            `;
        }
        
        // Download file
        download() {
            if (!this.currentFile) return;
            
            const link = document.createElement('a');
            link.href = this.currentFile.path;
            link.download = this.currentFile.name;
            link.click();
        }
        
        // Close modal
        close() {
            if (!this.modal) return;
            
            this.modal.classList.remove('show');
            
            setTimeout(() => {
                this.modal.remove();
                this.modal = null;
                this.currentFile = null;
            }, 300);
            
            document.removeEventListener('keydown', this.handleKeyboard);
        }
        
        // File type detection
        getFileExtension(filename) {
            return filename.split('.').pop().toLowerCase();
        }
        
        isImage(ext) {
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
        }
        
        isVideo(ext) {
            return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
        }
        
        isPDF(ext) {
            return ext === 'pdf';
        }
        
        isText(ext) {
            return ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'h'].includes(ext);
        }
        
        isAudio(ext) {
            return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext);
        }
        
        getFileIcon(ext) {
            const icons = {
                'pdf': '📄',
                'doc': '📝', 'docx': '📝', 'txt': '📝',
                'xls': '📊', 'xlsx': '📊', 'csv': '📊',
                'ppt': '📊', 'pptx': '📊',
                'zip': '📦', 'rar': '📦', '7z': '📦',
                'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵',
                'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
                'jpg': '🖼️', 'png': '🖼️', 'gif': '🖼️'
            };
            return icons[ext] || '📎';
        }
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
    }
    
    // Export to global scope
    window.FilePreview = FilePreview;
    window.filePreview = new FilePreview();
    
})();
