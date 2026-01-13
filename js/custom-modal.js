// Custom Modal System for Admin Actions
// This replaces ugly browser prompts with nice in-app modals
(function() {
    'use strict';
    
    // Create modal HTML structure on page load
    function createCustomModal() {
        // Check if modal already exists
        if (document.getElementById('custom-input-modal')) return;
        
        const modalHTML = `
            <div id="custom-input-modal" class="custom-modal" style="display: none;">
                <div class="custom-modal-overlay"></div>
                <div class="custom-modal-content">
                    <div class="custom-modal-header">
                        <h3 id="custom-modal-title">Input Required</h3>
                        <button class="modal-close-btn" id="custom-modal-close">×</button>
                    </div>
                    <div class="custom-modal-body">
                        <form id="custom-modal-form">
                            <div id="custom-modal-fields"></div>
                            <div class="form-actions" style="margin-top: var(--spacing-lg);">
                                <button type="button" class="btn btn-secondary" id="custom-modal-cancel">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .custom-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                animation: fadeIn 0.2s ease-out;
            }
            
            .custom-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
            }
            
            .custom-modal-content {
                position: relative;
                background: var(--bg-secondary);
                border-radius: var(--radius-md);
                max-width: 500px;
                width: 90%;
                margin: 10vh auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease-out;
            }
            
            .custom-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .custom-modal-header h3 {
                margin: 0;
                font-size: 20px;
            }
            
            .custom-modal-body {
                padding: var(--spacing-lg);
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show custom modal with form fields
    // fields: array of { name, label, type, placeholder, required, value }
    function showCustomModal(title, fields, onSubmit) {
        createCustomModal();
        
        const modal = document.getElementById('custom-input-modal');
        const modalTitle = document.getElementById('custom-modal-title');
        const fieldsContainer = document.getElementById('custom-modal-fields');
        const form = document.getElementById('custom-modal-form');
        const closeBtn = document.getElementById('custom-modal-close');
        const cancelBtn = document.getElementById('custom-modal-cancel');
        
        // Set title
        modalTitle.textContent = title;
        
        // Build form fields
        fieldsContainer.innerHTML = '';
        fields.forEach(field => {
            const fieldHTML = `
                <div class="form-group" style="margin-bottom: var(--spacing-md);">
                    <label for="field-${field.name}">${field.label}</label>
                    ${field.type === 'textarea' 
                        ? `<textarea 
                            id="field-${field.name}" 
                            name="${field.name}"
                            rows="4"
                            placeholder="${field.placeholder || ''}"
                            ${field.required ? 'required' : ''}
                        >${field.value || ''}</textarea>`
                        : `<input 
                            type="${field.type || 'text'}" 
                            id="field-${field.name}"
                            name="${field.name}"
                            placeholder="${field.placeholder || ''}"
                            value="${field.value || ''}"
                            ${field.required ? 'required' : ''}
                        >`
                    }
                </div>
            `;
            fieldsContainer.insertAdjacentHTML('beforeend', fieldHTML);
        });
        
        // Show modal
        modal.style.display = 'block';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = fieldsContainer.querySelector('input, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
        
        // Handle form submission
        const submitHandler = (e) => {
            e.preventDefault();
            
            // Collect form data
            const formData = {};
            fields.forEach(field => {
                const input = document.getElementById(`field-${field.name}`);
                formData[field.name] = input.value;
            });
            
            // Call callback with data
            onSubmit(formData);
            
            // Close modal
            closeCustomModal();
            
            // Remove event listeners
            form.removeEventListener('submit', submitHandler);
        };
        
        form.addEventListener('submit', submitHandler);
        
        // Close handlers
        const closeHandler = () => {
            closeCustomModal();
            form.removeEventListener('submit', submitHandler);
        };
        
        closeBtn.onclick = closeHandler;
        cancelBtn.onclick = closeHandler;
        modal.querySelector('.custom-modal-overlay').onclick = closeHandler;
        
        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeHandler();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    // Close custom modal
    function closeCustomModal() {
        const modal = document.getElementById('custom-input-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Export to global scope
    window.customModal = {
        show: showCustomModal,
        close: closeCustomModal
    };
    
})();
