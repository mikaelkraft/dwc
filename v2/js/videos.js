// Videos Module for DWC v2 - Video embed management for YouTube and Vimeo
class VideosModule {
    constructor() {
        this.videos = [];
        this.currentVideo = null;
        
        this.init();
    }

    async init() {
        await this.loadVideos();
        this.createVideosUI();
        this.setupEventListeners();
    }

    async loadVideos() {
        try {
            const response = await fetch('./data/videos.json');
            if (!response.ok) {
                throw new Error(`Failed to load videos: ${response.status}`);
            }
            this.videos = await response.json();
            console.log('Videos loaded:', this.videos.length);
        } catch (error) {
            console.error('Error loading videos:', error);
            this.videos = [];
        }
    }

    createVideosUI() {
        // Create videos section
        const videosSection = document.createElement('section');
        videosSection.className = 'videos-section';
        videosSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <i class="fas fa-video"></i>
                    Videos
                </h2>
                <button id="videos-toggle" class="section-toggle-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="videos-content" id="videos-content">
                <div class="video-player-container" id="video-player-container" style="display: none;">
                    <div class="video-embed" id="video-embed"></div>
                    <button class="video-close-btn" id="video-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="videos-grid" id="videos-grid"></div>
            </div>
        `;

        // Insert after lyrics container
        const lyricsContainer = document.querySelector('.lyrics-container');
        if (lyricsContainer) {
            lyricsContainer.parentNode.insertBefore(videosSection, lyricsContainer.nextSibling);
        } else {
            document.querySelector('.main-content').appendChild(videosSection);
        }

        this.renderVideos();
    }

    renderVideos() {
        const videosGrid = document.getElementById('videos-grid');
        if (!videosGrid) return;

        if (this.videos.length === 0) {
            videosGrid.innerHTML = `
                <div class="no-videos">
                    <i class="fas fa-video-slash"></i>
                    <p>No videos available</p>
                </div>
            `;
            return;
        }

        videosGrid.innerHTML = this.videos.map(video => `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
                    <div class="video-overlay">
                        <div class="play-button">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="video-platform ${video.platform}">
                            <i class="fab fa-${video.platform}"></i>
                        </div>
                    </div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-description">${video.description}</p>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Section toggle
        const toggleBtn = document.getElementById('videos-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSection());
        }

        // Video selection
        const videosGrid = document.getElementById('videos-grid');
        if (videosGrid) {
            videosGrid.addEventListener('click', (e) => {
                const videoCard = e.target.closest('.video-card');
                if (videoCard) {
                    const videoId = videoCard.dataset.videoId;
                    this.playVideo(videoId);
                }
            });
        }

        // Video close
        const closeBtn = document.getElementById('video-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeVideo());
        }

        // Escape key to close video
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentVideo) {
                this.closeVideo();
            }
        });
    }

    toggleSection() {
        const content = document.getElementById('videos-content');
        const toggleBtn = document.getElementById('videos-toggle');
        
        if (content) {
            const isVisible = content.classList.contains('visible');
            content.classList.toggle('visible', !isVisible);
            
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        }
    }

    playVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;

        this.currentVideo = video;
        const playerContainer = document.getElementById('video-player-container');
        const embedContainer = document.getElementById('video-embed');
        
        if (!playerContainer || !embedContainer) return;

        // Create embed based on platform
        const embedHTML = this.createVideoEmbed(video);
        embedContainer.innerHTML = embedHTML;
        
        // Show player
        playerContainer.style.display = 'block';
        
        // Scroll to video player
        playerContainer.scrollIntoView({ behavior: 'smooth' });
        
        console.log(`Playing video: ${video.title} (${video.platform})`);
    }

    createVideoEmbed(video) {
        const embedId = this.extractVideoId(video.url, video.platform);
        
        switch (video.platform) {
            case 'youtube':
                return `
                    <iframe 
                        width="800" 
                        height="450" 
                        src="https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0"
                        title="${video.title}"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            case 'vimeo':
                return `
                    <iframe 
                        width="800" 
                        height="450" 
                        src="https://player.vimeo.com/video/${embedId}?autoplay=1"
                        title="${video.title}"
                        frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            default:
                return `
                    <div class="video-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Unsupported video platform: ${video.platform}</p>
                        <a href="${video.url}" target="_blank" rel="noopener noreferrer">
                            Watch on ${video.platform}
                        </a>
                    </div>
                `;
        }
    }

    extractVideoId(url, platform) {
        try {
            switch (platform) {
                case 'youtube':
                    // Extract YouTube video ID from various URL formats
                    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                    const youtubeMatch = url.match(youtubeRegex);
                    return youtubeMatch ? youtubeMatch[1] : '';
                    
                case 'vimeo':
                    // Extract Vimeo video ID
                    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
                    const vimeoMatch = url.match(vimeoRegex);
                    return vimeoMatch ? vimeoMatch[1] : '';
                    
                default:
                    return '';
            }
        } catch (error) {
            console.error('Error extracting video ID:', error);
            return '';
        }
    }

    closeVideo() {
        const playerContainer = document.getElementById('video-player-container');
        const embedContainer = document.getElementById('video-embed');
        
        if (playerContainer) {
            playerContainer.style.display = 'none';
        }
        
        if (embedContainer) {
            embedContainer.innerHTML = '';
        }
        
        this.currentVideo = null;
    }

    // Get video data
    getVideos() {
        return this.videos;
    }

    getVideo(videoId) {
        return this.videos.find(v => v.id === videoId) || null;
    }
}

// Export for use in main app
window.VideosModule = VideosModule;