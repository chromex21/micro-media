// Authentication system for admin panel - FIXED VERSION
(function() {
    'use strict';
    
    // Hardcoded credentials (you'll change these after first login)
    const DEFAULT_USERNAME = 'admin';
    const DEFAULT_PASSWORD = 'portfolio2026!';
    
    // Session management
    function isAuthenticated() {
        const session = sessionStorage.getItem('admin_session');
        if (!session) return false;
        
        try {
            const data = JSON.parse(session);
            // Check if session is still valid (24 hours)
            const now = Date.now();
            if (now - data.timestamp > 24 * 60 * 60 * 1000) {
                logout();
                return false;
            }
            return data.authenticated === true;
        } catch (e) {
            return false;
        }
    }
    
    function createSession() {
        const session = {
            authenticated: true,
            timestamp: Date.now()
        };
        sessionStorage.setItem('admin_session', JSON.stringify(session));
    }
    
    function logout() {
        sessionStorage.removeItem('admin_session');
        window.location.reload();
    }
    
    // Get stored credentials or use defaults
    async function getStoredCredentials() {
        try {
            const stored = await window.storage.get('admin_credentials');
            if (stored && stored.value) {
                return JSON.parse(stored.value);
            }
        } catch (e) {
            console.log('Using default credentials');
        }
        return {
            username: DEFAULT_USERNAME,
            password: DEFAULT_PASSWORD
        };
    }
    
    // Save new credentials
    async function saveCredentials(username, password) {
        try {
            await window.storage.set('admin_credentials', JSON.stringify({
                username: username,
                password: password
            }));
            return true;
        } catch (e) {
            console.error('Failed to save credentials:', e);
            return false;
        }
    }
    
    // Validate login
    async function validateLogin(username, password) {
        const credentials = await getStoredCredentials();
        return username === credentials.username && password === credentials.password;
    }
    
    // Show login form
    function showLoginForm() {
        const loginHTML = `
            <div class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1 class="site-logo">
                            <span class="logo-icon">▶</span>
                            <span class="logo-text">Lite Media</span>
                        </h1>
                        <h2>Admin Login</h2>
                        <p>Enter your credentials to access settings</p>
                    </div>
                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                required 
                                autocomplete="username"
                                placeholder="Enter username"
                            >
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required 
                                autocomplete="current-password"
                                placeholder="Enter password"
                            >
                        </div>
                        <div id="login-error" class="error-message" style="display: none;"></div>
                        <button type="submit" class="btn btn-primary btn-full">
                            🔓 Login
                        </button>
                    </form>
                    <div class="auth-footer">
                        <a href="index.html" class="back-link">← Back to Gallery</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loginHTML);
        
        // Handle form submission
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            
            const isValid = await validateLogin(username, password);
            
            if (isValid) {
                createSession();
                document.querySelector('.auth-overlay').remove();
                // Show the actual settings content
                document.querySelector('.settings-content').style.display = 'block';
                
                // FIX: Initialize UI components AFTER successful login
                setTimeout(() => {
                    addLogoutButton();
                    addChangePasswordUI();
                }, 50);
            } else {
                errorEl.textContent = '❌ Invalid username or password';
                errorEl.style.display = 'block';
                // Shake animation
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 500);
            }
        });
        
        // Focus username field
        setTimeout(() => document.getElementById('username').focus(), 100);
    }
    
    // Initialize auth system
    function initAuth() {
        // Only run on admin page
        if (!window.location.pathname.includes('admin.html')) {
            return;
        }
        
        // Check if authenticated
        if (!isAuthenticated()) {
            // Hide settings content initially
            const settingsContent = document.querySelector('.settings-content');
            if (settingsContent) {
                settingsContent.style.display = 'none';
            }
            
            // Show login form
            showLoginForm();
        } else {
            // FIX: User is authenticated, add UI components immediately
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                addLogoutButton();
                addChangePasswordUI();
            });
        }
    }
    
    // FIX: Add logout button to settings - Now checks if already exists
    function addLogoutButton() {
        const settingsHeader = document.querySelector('.settings-header');
        
        // Check if button already exists
        if (document.getElementById('logout-btn')) {
            console.log('✓ Logout button already exists');
            return;
        }
        
        if (settingsHeader) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-btn';
            logoutBtn.className = 'btn btn-secondary';
            logoutBtn.style.marginTop = 'var(--spacing-md)';
            logoutBtn.innerHTML = '🚪 Logout';
            logoutBtn.addEventListener('click', logout);
            settingsHeader.appendChild(logoutBtn);
            console.log('✓ Logout button added');
        } else {
            console.warn('⚠ Settings header not found - retrying in 100ms');
            setTimeout(addLogoutButton, 100);
        }
    }
    
    // FIX: Add change password UI - Completely rewritten to prevent duplicates
    function addChangePasswordUI() {
        const tabs = document.querySelector('.tabs');
        
        // Check if we already added the Account tab button
        if (document.getElementById('account-tab-btn')) {
            console.log('✓ Account tab already exists');
            return;
        }
        
        if (!tabs) {
            console.warn('⚠ Tabs not found - retrying in 100ms');
            setTimeout(addChangePasswordUI, 100);
            return;
        }
        
        console.log('→ Adding Account tab...');
        
        // Create Account tab button
        const accountTab = document.createElement('button');
        accountTab.id = 'account-tab-btn';
        accountTab.className = 'tab';
        accountTab.innerHTML = '👤 Account';
        accountTab.onclick = function(e) {
            // Switch tabs
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            accountTab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById('account-tab-content');
            if (targetTab) targetTab.classList.add('active');
        };
        tabs.appendChild(accountTab);
        console.log('✓ Account tab button added');
        
        // Create Account tab content (credentials only - no duplicates)
        const accountTabContentNew = document.createElement('div');
        accountTabContentNew.id = 'account-tab-content';
        accountTabContentNew.className = 'tab-content';
        accountTabContentNew.innerHTML = `
            <div class="section">
                <h2>👤 Account Credentials</h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                    Change your admin username and password. Make sure to remember your new credentials!
                </p>
                
                <form id="change-password-form">
                    <div class="form-group">
                        <label for="new-username">New Username</label>
                        <input 
                            type="text" 
                            id="new-username" 
                            placeholder="Enter new username" 
                            required
                            autocomplete="off"
                            style="padding: 12px; font-size: 14px;"
                        >
                    </div>
                    <div class="form-group">
                        <label for="new-password">New Password</label>
                        <input 
                            type="password" 
                            id="new-password" 
                            placeholder="Enter new password (min 6 characters)" 
                            required
                            minlength="6"
                            autocomplete="new-password"
                            style="padding: 12px; font-size: 14px;"
                        >
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input 
                            type="password" 
                            id="confirm-password" 
                            placeholder="Re-enter new password" 
                            required
                            minlength="6"
                            autocomplete="new-password"
                            style="padding: 12px; font-size: 14px;"
                        >
                    </div>
                    <div id="password-error" class="error-message" style="display: none; padding: var(--spacing-md); background: #f8d7da; color: #721c24; border-radius: var(--radius-sm); margin-top: var(--spacing-md);"></div>
                    <div id="password-success" class="success-message" style="display: none; padding: var(--spacing-md); background: #d4edda; color: #155724; border-radius: var(--radius-sm); margin-top: var(--spacing-md);"></div>
                    <button type="submit" class="btn" style="margin-top: var(--spacing-md); font-size: 14px; padding: 12px 24px;">💾 Update Credentials</button>
                </form>
            </div>
            
            <div class="section" style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: var(--spacing-md); border-radius: var(--radius-md);">
                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                    💡 <strong>Tip:</strong> Site configuration and data management can be found in the "Site Configuration" tab above.
                </p>
            </div>
        `;
        
        // FIX: Append to the main settings content area, not a non-existent parent
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.appendChild(accountTabContentNew);
            console.log('✓ Account tab content added');
        } else {
            console.error('❌ Settings content not found');
            return;
        }
        
        // Handle password change form
        setTimeout(() => {
            const form = document.getElementById('change-password-form');
            if (!form) {
                console.error('❌ Password form not found');
                return;
            }
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const newUsername = document.getElementById('new-username').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                const errorEl = document.getElementById('password-error');
                const successEl = document.getElementById('password-success');
                
                errorEl.style.display = 'none';
                successEl.style.display = 'none';
                
                if (newPassword !== confirmPassword) {
                    errorEl.textContent = '❌ Passwords do not match';
                    errorEl.style.display = 'block';
                    return;
                }
                
                if (newPassword.length < 6) {
                    errorEl.textContent = '❌ Password must be at least 6 characters';
                    errorEl.style.display = 'block';
                    return;
                }
                
                const saved = await saveCredentials(newUsername, newPassword);
                
                if (saved) {
                    successEl.textContent = '✅ Credentials updated successfully! Please login again.';
                    successEl.style.display = 'block';
                    
                    // Logout after 2 seconds
                    setTimeout(() => {
                        logout();
                    }, 2000);
                } else {
                    errorEl.textContent = '❌ Failed to update credentials. Please try again.';
                    errorEl.style.display = 'block';
                }
            });
            console.log('✓ Password change form handler attached');
        }, 100);
    }
    
    // Export functions
    window.auth = {
        isAuthenticated: isAuthenticated,
        logout: logout,
        // Expose for manual triggering if needed
        addLogoutButton: addLogoutButton,
        addChangePasswordUI: addChangePasswordUI
    };
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
    
})();
