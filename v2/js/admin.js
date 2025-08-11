// Admin Module for DWC v2 - Client-side admin with localStorage and JSON export
class AdminModule {
    constructor() {
        this.isLoggedIn = false;
        this.adminData = {};
        this.modules = {};
        
        this.init();
    }

    init() {
        this.checkLoginStatus();
        this.createAdminUI();
        this.setupEventListeners();
    }

    checkLoginStatus() {
        // Simple localStorage-based "login" status
        this.isLoggedIn = localStorage.getItem('dwc_admin_logged_in') === 'true';
    }

    createAdminUI() {
        // Create admin panel (initially hidden)
        const adminPanel = document.createElement('div');
        adminPanel.className = 'admin-panel';
        adminPanel.id = 'admin-panel';
        adminPanel.innerHTML = `
            <div class="admin-header">
                <h3 class="admin-title">
                    <i class="fas fa-cog"></i>
                    Admin Panel
                </h3>
                <button id="admin-toggle" class="admin-toggle-btn">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="admin-content" id="admin-content">
                ${this.isLoggedIn ? this.renderAdminDashboard() : this.renderLoginForm()}
            </div>
        `;

        // Add to footer area
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(adminPanel, footer);
        } else {
            document.body.appendChild(adminPanel);
        }
    }

    renderLoginForm() {
        return `
            <div class="admin-login">
                <div class="login-form">
                    <p class="login-info">
                        <i class="fas fa-info-circle"></i>
                        This is a client-side admin panel for demonstration. 
                        In production, this would connect to secure Cloudflare Workers.
                    </p>
                    <div class="form-group">
                        <label for="admin-password">Admin Password:</label>
                        <input type="password" id="admin-password" placeholder="Enter admin password" />
                    </div>
                    <button id="admin-login-btn" class="admin-btn primary">
                        <i class="fas fa-sign-in-alt"></i>
                        Login
                    </button>
                    <div class="login-note">
                        <small>Demo password: "admin123"</small>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdminDashboard() {
        return `
            <div class="admin-dashboard">
                <div class="admin-toolbar">
                    <button id="admin-logout-btn" class="admin-btn secondary">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                    <button id="export-data-btn" class="admin-btn primary">
                        <i class="fas fa-download"></i>
                        Export Data
                    </button>
                    <button id="import-data-btn" class="admin-btn primary">
                        <i class="fas fa-upload"></i>
                        Import Data
                    </button>
                    <input type="file" id="import-file-input" accept=".json" style="display: none;" />
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab-btn active" data-tab="overview">Overview</button>
                    <button class="admin-tab-btn" data-tab="tracks">Tracks</button>
                    <button class="admin-tab-btn" data-tab="videos">Videos</button>
                    <button class="admin-tab-btn" data-tab="shows">Shows</button>
                    <button class="admin-tab-btn" data-tab="links">Links</button>
                    <button class="admin-tab-btn" data-tab="analytics">Analytics</button>
                </div>
                
                <div class="admin-tab-content">
                    <div class="admin-tab-panel active" id="overview-panel">
                        ${this.renderOverviewPanel()}
                    </div>
                    <div class="admin-tab-panel" id="tracks-panel">
                        ${this.renderTracksPanel()}
                    </div>
                    <div class="admin-tab-panel" id="videos-panel">
                        ${this.renderVideosPanel()}
                    </div>
                    <div class="admin-tab-panel" id="shows-panel">
                        ${this.renderShowsPanel()}
                    </div>
                    <div class="admin-tab-panel" id="links-panel">
                        ${this.renderLinksPanel()}
                    </div>
                    <div class="admin-tab-panel" id="analytics-panel">
                        ${this.renderAnalyticsPanel()}
                    </div>
                </div>
            </div>
        `;
    }

    renderOverviewPanel() {
        const stats = this.getOverviewStats();
        return `
            <div class="overview-stats">
                <div class="stat-card">
                    <i class="fas fa-music"></i>
                    <div class="stat-info">
                        <h4>${stats.tracks}</h4>
                        <p>Tracks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-video"></i>
                    <div class="stat-info">
                        <h4>${stats.videos}</h4>
                        <p>Videos</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar"></i>
                    <div class="stat-info">
                        <h4>${stats.shows}</h4>
                        <p>Shows</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-link"></i>
                    <div class="stat-info">
                        <h4>${stats.links}</h4>
                        <p>Links</p>
                    </div>
                </div>
            </div>
            <div class="admin-info">
                <h4>Admin Features</h4>
                <ul>
                    <li><i class="fas fa-check"></i> Client-side data management</li>
                    <li><i class="fas fa-check"></i> JSON data export/import</li>
                    <li><i class="fas fa-check"></i> Basic analytics tracking</li>
                    <li><i class="fas fa-hourglass-half"></i> Future: Cloudflare Worker integration</li>
                    <li><i class="fas fa-hourglass-half"></i> Future: Secure content updates</li>
                </ul>
            </div>
        `;
    }

    renderTracksPanel() {
        return `
            <div class="panel-header">
                <h4>Track Management</h4>
                <button class="admin-btn primary" id="add-track-btn">
                    <i class="fas fa-plus"></i>
                    Add Track
                </button>
            </div>
            <div class="tracks-list" id="admin-tracks-list">
                Loading tracks...
            </div>
        `;
    }

    renderVideosPanel() {
        return `
            <div class="panel-header">
                <h4>Video Management</h4>
                <button class="admin-btn primary" id="add-video-btn">
                    <i class="fas fa-plus"></i>
                    Add Video
                </button>
            </div>
            <div class="videos-list" id="admin-videos-list">
                Loading videos...
            </div>
        `;
    }

    renderShowsPanel() {
        return `
            <div class="panel-header">
                <h4>Show Management</h4>
                <button class="admin-btn primary" id="add-show-btn">
                    <i class="fas fa-plus"></i>
                    Add Show
                </button>
            </div>
            <div class="shows-list" id="admin-shows-list">
                Loading shows...
            </div>
        `;
    }

    renderLinksPanel() {
        return `
            <div class="panel-header">
                <h4>Link Management</h4>
                <button class="admin-btn primary" id="add-link-btn">
                    <i class="fas fa-plus"></i>
                    Add Link
                </button>
            </div>
            <div class="links-list" id="admin-links-list">
                Loading links...
            </div>
        `;
    }

    renderAnalyticsPanel() {
        return `
            <div class="analytics-content">
                <h4>Link Click Analytics</h4>
                <div id="link-analytics" class="analytics-charts">
                    Loading analytics...
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Panel toggle
        const toggleBtn = document.getElementById('admin-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }

        if (this.isLoggedIn) {
            this.setupDashboardListeners();
        } else {
            this.setupLoginListeners();
        }
    }

    setupLoginListeners() {
        const loginBtn = document.getElementById('admin-login-btn');
        const passwordInput = document.getElementById('admin-password');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }
    }

    setupDashboardListeners() {
        // Logout
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Export/Import
        const exportBtn = document.getElementById('export-data-btn');
        const importBtn = document.getElementById('import-data-btn');
        const fileInput = document.getElementById('import-file-input');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => fileInput?.click());
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.importData(e));
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    login() {
        const password = document.getElementById('admin-password')?.value;
        
        // Simple demo password check
        if (password === 'admin123') {
            this.isLoggedIn = true;
            localStorage.setItem('dwc_admin_logged_in', 'true');
            
            // Refresh admin UI
            const adminContent = document.getElementById('admin-content');
            if (adminContent) {
                adminContent.innerHTML = this.renderAdminDashboard();
                this.setupDashboardListeners();
            }
            
            console.log('Admin logged in');
        } else {
            alert('Invalid password. Try "admin123"');
        }
    }

    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('dwc_admin_logged_in');
        
        // Refresh admin UI
        const adminContent = document.getElementById('admin-content');
        if (adminContent) {
            adminContent.innerHTML = this.renderLoginForm();
            this.setupLoginListeners();
        }
        
        console.log('Admin logged out');
    }

    togglePanel() {
        const content = document.getElementById('admin-content');
        const toggleBtn = document.getElementById('admin-toggle');
        
        if (content) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.admin-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
        
        // Load tab content
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'tracks':
                this.loadTracksData();
                break;
            case 'videos':
                this.loadVideosData();
                break;
            case 'shows':
                this.loadShowsData();
                break;
            case 'links':
                this.loadLinksData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
    }

    loadTracksData() {
        // In a real implementation, this would fetch from the modules
        const tracksList = document.getElementById('admin-tracks-list');
        if (tracksList) {
            tracksList.innerHTML = '<p>Track management coming soon...</p>';
        }
    }

    loadVideosData() {
        const videosList = document.getElementById('admin-videos-list');
        if (videosList) {
            videosList.innerHTML = '<p>Video management coming soon...</p>';
        }
    }

    loadShowsData() {
        const showsList = document.getElementById('admin-shows-list');
        if (showsList) {
            showsList.innerHTML = '<p>Show management coming soon...</p>';
        }
    }

    loadLinksData() {
        const linksList = document.getElementById('admin-links-list');
        if (linksList) {
            linksList.innerHTML = '<p>Link management coming soon...</p>';
        }
    }

    loadAnalyticsData() {
        const analyticsDiv = document.getElementById('link-analytics');
        if (analyticsDiv && window.linksModule) {
            const stats = window.linksModule.getLinkStats();
            const statsHTML = Object.keys(stats).length > 0 ? 
                Object.entries(stats).map(([linkId, data]) => `
                    <div class="analytics-item">
                        <span class="analytics-label">${data.label}</span>
                        <span class="analytics-count">${data.count} clicks</span>
                    </div>
                `).join('') :
                '<p>No analytics data available</p>';
            
            analyticsDiv.innerHTML = statsHTML;
        }
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            tracks: window.musicModule?.getAllTracks() || [],
            videos: window.videosModule?.getVideos() || [],
            shows: window.showsModule?.getShows() || [],
            links: window.linksModule?.getLinks() || [],
            analytics: window.linksModule?.getLinkStats() || {}
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dwc-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('Data exported');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                console.log('Data imported:', data);
                
                // In a real implementation, this would update the modules
                alert('Data import successful! (Note: this is a demo - data is not actually applied)');
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    getOverviewStats() {
        return {
            tracks: window.musicModule?.getAllTracks()?.length || 0,
            videos: window.videosModule?.getVideos()?.length || 0,
            shows: window.showsModule?.getShows()?.length || 0,
            links: window.linksModule?.getLinks()?.length || 0
        };
    }

    // Set module references for data access
    setModules(modules) {
        this.modules = modules;
    }
}

// Export for use in main app
window.AdminModule = AdminModule;