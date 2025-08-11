// Links Module for DWC v2 - Personal links hub (Linktree-style)
class LinksModule {
    constructor() {
        this.links = [];
        
        this.init();
    }

    async init() {
        await this.loadLinks();
        this.createLinksUI();
        this.setupEventListeners();
    }

    async loadLinks() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load links from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/links`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.links = await response.json();
                        console.log('Links loaded from Worker:', this.links.length);
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load links from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/links.json');
            if (!response.ok) {
                throw new Error(`Failed to load links: ${response.status}`);
            }
            this.links = await response.json();
            console.log('Links loaded from local JSON:', this.links.length);
        } catch (error) {
            console.error('Error loading links:', error);
            this.links = [];
        }
    }

    createLinksUI() {
        // Create links section
        const linksSection = document.createElement('section');
        linksSection.className = 'links-section';
        linksSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-link"></i>
                    Connect
                </h2>
                <button id="links-toggle" class="section-toggle-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="links-content" id="links-content">
                <div class="links-grid" id="links-grid">
                    ${this.renderLinks()}
                </div>
            </div>
        `;

        // Insert after shows section or last available section
        const showsSection = document.querySelector('.shows-section');
        const videosSection = document.querySelector('.videos-section');
        const lyricsContainer = document.querySelector('.lyrics-container');
        const insertAfter = showsSection || videosSection || lyricsContainer;
        
        if (insertAfter) {
            insertAfter.parentNode.insertBefore(linksSection, insertAfter.nextSibling);
        } else {
            document.querySelector('.main-content').appendChild(linksSection);
        }
    }

    renderLinks() {
        if (this.links.length === 0) {
            return `
                <div class="no-links">
                    <i class="fas fa-link-slash"></i>
                    <p>No links available</p>
                </div>
            `;
        }

        return this.links.map(link => `
            <a href="${link.url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="link-card ${this.getLinkCategory(link.id)}"
               data-link-id="${link.id}">
                <div class="link-icon">
                    <i class="${link.icon}"></i>
                </div>
                <div class="link-info">
                    <span class="link-label">${link.label}</span>
                </div>
                <div class="link-arrow">
                    <i class="fas fa-external-link-alt"></i>
                </div>
            </a>
        `).join('');
    }

    getLinkCategory(linkId) {
        // Categorize links for styling
        const musicPlatforms = ['spotify', 'apple-music', 'soundcloud', 'youtube'];
        const socialPlatforms = ['instagram', 'twitter', 'facebook', 'tiktok'];
        const codePlatforms = ['github', 'gitlab', 'codepen'];
        
        if (musicPlatforms.includes(linkId)) return 'music-platform';
        if (socialPlatforms.includes(linkId)) return 'social-platform';
        if (codePlatforms.includes(linkId)) return 'code-platform';
        if (linkId === 'email') return 'contact-link';
        
        return 'general-link';
    }

    setupEventListeners() {
        // Section toggle
        const toggleBtn = document.getElementById('links-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSection());
        }

        // Link click analytics (optional)
        const linkCards = document.querySelectorAll('.link-card');
        linkCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const linkId = card.dataset.linkId;
                this.trackLinkClick(linkId);
            });
        });

        // Hover effects for better UX
        linkCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animateLinkCard(card, 'enter');
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateLinkCard(card, 'leave');
            });
        });
    }

    toggleSection() {
        const content = document.getElementById('links-content');
        const toggleBtn = document.getElementById('links-toggle');
        
        if (content) {
            const isVisible = content.classList.contains('visible');
            content.classList.toggle('visible', !isVisible);
            
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        }
    }

    animateLinkCard(card, action) {
        const icon = card.querySelector('.link-icon i');
        const arrow = card.querySelector('.link-arrow i');
        
        if (action === 'enter') {
            card.style.transform = 'translateY(-2px)';
            if (icon) icon.style.transform = 'scale(1.1)';
            if (arrow) arrow.style.transform = 'translateX(2px)';
        } else {
            card.style.transform = 'translateY(0)';
            if (icon) icon.style.transform = 'scale(1)';
            if (arrow) arrow.style.transform = 'translateX(0)';
        }
    }

    trackLinkClick(linkId) {
        const link = this.links.find(l => l.id === linkId);
        if (link) {
            console.log(`Link clicked: ${link.label} (${link.url})`);
            
            // Could send analytics data to a service
            // For now, just log locally
            const clickData = {
                linkId: linkId,
                label: link.label,
                url: link.url,
                timestamp: new Date().toISOString()
            };
            
            // Store in localStorage for admin panel
            this.storeLinkClick(clickData);
        }
    }

    storeLinkClick(clickData) {
        try {
            const existingClicks = JSON.parse(localStorage.getItem('dwc_link_clicks') || '[]');
            existingClicks.push(clickData);
            
            // Keep only last 100 clicks
            if (existingClicks.length > 100) {
                existingClicks.splice(0, existingClicks.length - 100);
            }
            
            localStorage.setItem('dwc_link_clicks', JSON.stringify(existingClicks));
        } catch (error) {
            console.warn('Could not store link click data:', error);
        }
    }

    // Get link statistics for admin panel
    getLinkStats() {
        try {
            const clicks = JSON.parse(localStorage.getItem('dwc_link_clicks') || '[]');
            const stats = {};
            
            clicks.forEach(click => {
                if (stats[click.linkId]) {
                    stats[click.linkId].count++;
                    stats[click.linkId].lastClick = click.timestamp;
                } else {
                    stats[click.linkId] = {
                        label: click.label,
                        count: 1,
                        firstClick: click.timestamp,
                        lastClick: click.timestamp
                    };
                }
            });
            
            return stats;
        } catch (error) {
            console.warn('Could not retrieve link stats:', error);
            return {};
        }
    }

    // Get all links
    getLinks() {
        return this.links;
    }

    getLink(linkId) {
        return this.links.find(l => l.id === linkId) || null;
    }

    // For admin: add new link
    addLink(linkData) {
        // In future, this would use CONTENT_WRITE_PROXY
        // For now, just add to memory (lost on refresh)
        this.links.push({
            id: linkData.id || `link-${Date.now()}`,
            label: linkData.label,
            url: linkData.url,
            icon: linkData.icon || 'fas fa-link'
        });
        
        // Re-render links
        const linksGrid = document.getElementById('links-grid');
        if (linksGrid) {
            linksGrid.innerHTML = this.renderLinks();
            this.setupEventListeners();
        }
        
        console.log('Link added (memory only):', linkData);
    }

    // For admin: remove link
    removeLink(linkId) {
        const index = this.links.findIndex(l => l.id === linkId);
        if (index !== -1) {
            this.links.splice(index, 1);
            
            // Re-render links
            const linksGrid = document.getElementById('links-grid');
            if (linksGrid) {
                linksGrid.innerHTML = this.renderLinks();
                this.setupEventListeners();
            }
            
            console.log('Link removed (memory only):', linkId);
        }
    }

    // Admin method for updating links
    updateLinks(newLinks) {
        this.links = newLinks;
        const linksGrid = document.getElementById('links-grid');
        if (linksGrid) {
            linksGrid.innerHTML = this.renderLinks();
            this.setupEventListeners();
        }
    }
}

// Export for use in main app
window.LinksModule = LinksModule;