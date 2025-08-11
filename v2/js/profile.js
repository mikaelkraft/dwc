// Profile Module for DWC v2 - Artist profile management
class ProfileModule {
    constructor() {
        this.profile = null;
        this.init();
    }

    async init() {
        await this.loadProfile();
        this.renderProfile();
    }

    async loadProfile() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load profile from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/profile`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.profile = await response.json();
                        console.log('Profile loaded from Worker:', this.profile);
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load profile from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/profile.json');
            if (!response.ok) {
                throw new Error(`Failed to load profile: ${response.status}`);
            }
            this.profile = await response.json();
            console.log('Profile loaded from local JSON:', this.profile);
        } catch (error) {
            console.error('Error loading profile:', error);
            // Use fallback profile data
            this.profile = {
                name: 'Digital World Clock Artist',
                tagline: 'Futuristic beats for a digital world',
                avatar: 'https://via.placeholder.com/150x150/1a1a2e/00f5ff?text=DWC',
                heroBackground: 'https://via.placeholder.com/1200x400/1a1a2e/00f5ff?text=Artist+Hero',
                bio: 'Digital World Clock Artist creates immersive soundscapes.',
                location: 'Digital Realm',
                website: 'https://example.com',
                social: {
                    twitter: 'https://x.com/mikael_kraft',
                    github: 'https://github.com/mikaelkraft'
                }
            };
        }
    }

    renderProfile() {
        this.renderHeroSection();
        this.updateDocumentTitle();
    }

    renderHeroSection() {
        // Find or create artist hero container
        let heroContainer = document.querySelector('.artist-hero');
        if (!heroContainer) {
            // Create and insert hero section
            heroContainer = document.createElement('div');
            heroContainer.className = 'artist-hero';
            
            // Insert after header, before main content
            const header = document.querySelector('.header');
            const mainContent = document.querySelector('.main-content');
            if (header && mainContent) {
                header.parentNode.insertBefore(heroContainer, mainContent);
            } else if (mainContent) {
                mainContent.parentNode.insertBefore(heroContainer, mainContent);
            } else {
                document.body.appendChild(heroContainer);
            }
        }

        heroContainer.innerHTML = `
            <div class="hero-background" style="background-image: url('${this.profile.heroBackground}')">
                <div class="hero-overlay">
                    <div class="hero-content">
                        <div class="hero-avatar">
                            <img src="${this.profile.avatar}" alt="${this.profile.name}" class="avatar-image">
                        </div>
                        <div class="hero-info">
                            <h1 class="hero-name">${this.profile.name}</h1>
                            <p class="hero-tagline">${this.profile.tagline}</p>
                            <div class="hero-details">
                                ${this.profile.location ? `<span class="hero-location"><i class="fas fa-map-marker-alt"></i> ${this.profile.location}</span>` : ''}
                                ${this.profile.website ? `<a href="${this.profile.website}" target="_blank" class="hero-website"><i class="fas fa-globe"></i> Website</a>` : ''}
                            </div>
                            <div class="hero-bio">
                                <p>${this.profile.bio}</p>
                            </div>
                            <div class="hero-social">
                                ${this.renderSocialLinks()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSocialLinks() {
        if (!this.profile.social) return '';
        
        const socialLinks = [];
        const socialIcons = {
            twitter: 'fab fa-twitter',
            github: 'fab fa-github',
            instagram: 'fab fa-instagram',
            youtube: 'fab fa-youtube',
            facebook: 'fab fa-facebook',
            spotify: 'fab fa-spotify',
            soundcloud: 'fab fa-soundcloud'
        };

        for (const [platform, url] of Object.entries(this.profile.social)) {
            if (url) {
                const icon = socialIcons[platform] || 'fas fa-link';
                socialLinks.push(`
                    <a href="${url}" target="_blank" class="social-link" title="${platform}">
                        <i class="${icon}"></i>
                    </a>
                `);
            }
        }

        return socialLinks.join('');
    }

    updateDocumentTitle() {
        if (this.profile.name) {
            document.title = `${this.profile.name} - Digital World Clock v2`;
        }
    }

    // Method for admin to update profile
    updateProfile(newProfile) {
        this.profile = { ...this.profile, ...newProfile };
        this.renderProfile();
    }

    // Get current profile data
    getProfile() {
        return this.profile;
    }
}

// Initialize profile module when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.profileModule = new ProfileModule();
    });
}