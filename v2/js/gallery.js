// Gallery Module for DWC v2 - Gallery management with PhotoSpeak support
class GalleryModule {
    constructor() {
        this.gallery = [];
        this.currentPhotoSpeakAudio = null;
        this.init();
    }

    async init() {
        await this.loadGallery();
        this.createGalleryTab();
        this.setupEventListeners();
    }

    async loadGallery() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load gallery from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/gallery`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.gallery = await response.json();
                        console.log('Gallery loaded from Worker:', this.gallery.length, 'items');
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load gallery from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/gallery.json');
            if (!response.ok) {
                throw new Error(`Failed to load gallery: ${response.status}`);
            }
            this.gallery = await response.json();
            console.log('Gallery loaded from local JSON:', this.gallery.length, 'items');
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.gallery = [];
        }
    }

    createGalleryTab() {
        // Find the main content area to add tabs
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        // Check if tabs container already exists
        let tabsContainer = document.querySelector('.content-tabs');
        if (!tabsContainer) {
            // Create tabs container
            tabsContainer = document.createElement('div');
            tabsContainer.className = 'content-tabs';
            tabsContainer.innerHTML = `
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="music">
                        <i class="fas fa-music"></i>
                        Music
                    </button>
                    <button class="tab-btn" data-tab="gallery">
                        <i class="fas fa-images"></i>
                        Gallery
                    </button>
                    <button class="tab-btn" data-tab="videos">
                        <i class="fas fa-video"></i>
                        Videos
                    </button>
                    <button class="tab-btn" data-tab="shows">
                        <i class="fas fa-calendar"></i>
                        Shows
                    </button>
                    <button class="tab-btn" data-tab="links">
                        <i class="fas fa-link"></i>
                        Links
                    </button>
                </div>
                <div class="tab-content">
                    <div class="tab-panel active" id="tab-music">
                        <!-- Music content will be moved here -->
                    </div>
                    <div class="tab-panel" id="tab-gallery">
                        <!-- Gallery content -->
                    </div>
                    <div class="tab-panel" id="tab-videos">
                        <!-- Videos content will be moved here -->
                    </div>
                    <div class="tab-panel" id="tab-shows">
                        <!-- Shows content will be moved here -->
                    </div>
                    <div class="tab-panel" id="tab-links">
                        <!-- Links content will be moved here -->
                    </div>
                </div>
            `;

            // Insert tabs before the first major section
            const firstSection = mainContent.querySelector('.clock-container, .player-container, .lyrics-container') || mainContent.firstElementChild;
            if (firstSection) {
                mainContent.insertBefore(tabsContainer, firstSection);
            } else {
                mainContent.appendChild(tabsContainer);
            }

            // Move existing content to appropriate tabs
            this.organizeExistingContent();
        }

        // Render gallery content
        this.renderGalleryContent();
        this.setupTabNavigation();
    }

    organizeExistingContent() {
        const musicTab = document.getElementById('tab-music');
        const videosTab = document.getElementById('tab-videos');
        const showsTab = document.getElementById('tab-shows');
        const linksTab = document.getElementById('tab-links');

        // Move player and lyrics to music tab
        const playerContainer = document.querySelector('.player-container');
        const lyricsContainer = document.querySelector('.lyrics-container');
        if (playerContainer && musicTab) {
            musicTab.appendChild(playerContainer);
        }
        if (lyricsContainer && musicTab) {
            musicTab.appendChild(lyricsContainer);
        }

        // Add placeholders for other tabs if content doesn't exist yet
        if (videosTab && !videosTab.innerHTML.trim()) {
            videosTab.innerHTML = '<div class="tab-placeholder">Videos content will appear here</div>';
        }
        if (showsTab && !showsTab.innerHTML.trim()) {
            showsTab.innerHTML = '<div class="tab-placeholder">Shows content will appear here</div>';
        }
        if (linksTab && !linksTab.innerHTML.trim()) {
            linksTab.innerHTML = '<div class="tab-placeholder">Links content will appear here</div>';
        }
    }

    renderGalleryContent() {
        const galleryTab = document.getElementById('tab-gallery');
        if (!galleryTab) return;

        galleryTab.innerHTML = `
            <div class="gallery-header">
                <h2 class="gallery-title">
                    <i class="fas fa-images"></i>
                    Gallery
                </h2>
                <div class="gallery-controls">
                    <label class="photospeak-toggle">
                        <input type="checkbox" id="photospeak-enabled" ${this.hasPhotoSpeakContent() ? '' : 'disabled'}>
                        <span class="toggle-slider"></span>
                        PhotoSpeak
                    </label>
                </div>
            </div>
            <div class="gallery-grid">
                ${this.renderGalleryItems()}
            </div>
        `;
    }

    renderGalleryItems() {
        if (!this.gallery.length) {
            return '<div class="gallery-empty">No gallery items available</div>';
        }

        return this.gallery.map(item => `
            <div class="gallery-item" data-id="${item.id}">
                <div class="gallery-image-container">
                    <img src="${item.thumbnail}" alt="${item.title}" class="gallery-thumbnail" loading="lazy">
                    ${item.photoSpeak?.enabled ? `
                        <button class="photospeak-btn" data-audio="${item.photoSpeak.audioUrl}" data-transcript="${item.photoSpeak.transcript}">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    ` : ''}
                    <div class="gallery-overlay">
                        <button class="gallery-view-btn" data-url="${item.url}">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                <div class="gallery-info">
                    <h3 class="gallery-item-title">${item.title}</h3>
                    <p class="gallery-item-description">${item.description}</p>
                    <div class="gallery-tags">
                        ${item.tags?.map(tag => `<span class="gallery-tag">${tag}</span>`).join('') || ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    hasPhotoSpeakContent() {
        return this.gallery.some(item => item.photoSpeak?.enabled && item.photoSpeak?.audioUrl);
    }

    setupEventListeners() {
        // PhotoSpeak toggle
        document.addEventListener('change', (e) => {
            if (e.target.id === 'photospeak-enabled') {
                this.togglePhotoSpeak(e.target.checked);
            }
        });

        // PhotoSpeak buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.photospeak-btn')) {
                const btn = e.target.closest('.photospeak-btn');
                const audioUrl = btn.dataset.audio;
                const transcript = btn.dataset.transcript;
                this.playPhotoSpeak(audioUrl, transcript);
            }

            if (e.target.closest('.gallery-view-btn')) {
                const btn = e.target.closest('.gallery-view-btn');
                const imageUrl = btn.dataset.url;
                this.openImageModal(imageUrl);
            }
        });
    }

    setupTabNavigation() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tab-btn')) {
                const tabBtn = e.target.closest('.tab-btn');
                const tabId = tabBtn.dataset.tab;
                this.switchTab(tabId);
            }
        });
    }

    switchTab(tabId) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Add active class to selected tab and panel
        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedPanel = document.getElementById(`tab-${tabId}`);

        if (selectedBtn) selectedBtn.classList.add('active');
        if (selectedPanel) selectedPanel.classList.add('active');

        // Stop any playing PhotoSpeak audio when switching tabs
        if (tabId !== 'gallery') {
            this.stopPhotoSpeak();
        }
    }

    togglePhotoSpeak(enabled) {
        const photoSpeakButtons = document.querySelectorAll('.photospeak-btn');
        photoSpeakButtons.forEach(btn => {
            btn.style.display = enabled ? 'block' : 'none';
        });

        if (!enabled) {
            this.stopPhotoSpeak();
        }
    }

    playPhotoSpeak(audioUrl, transcript) {
        // Stop any currently playing audio
        this.stopPhotoSpeak();

        if (!audioUrl) return;

        try {
            this.currentPhotoSpeakAudio = new Audio(audioUrl);
            this.currentPhotoSpeakAudio.volume = 0.7;
            
            // Show transcript if available
            if (transcript) {
                this.showTranscript(transcript);
            }

            this.currentPhotoSpeakAudio.play().catch(error => {
                console.warn('PhotoSpeak audio playback failed:', error);
            });

            this.currentPhotoSpeakAudio.addEventListener('ended', () => {
                this.hideTranscript();
            });
        } catch (error) {
            console.error('Error playing PhotoSpeak audio:', error);
        }
    }

    stopPhotoSpeak() {
        if (this.currentPhotoSpeakAudio) {
            this.currentPhotoSpeakAudio.pause();
            this.currentPhotoSpeakAudio = null;
            this.hideTranscript();
        }
    }

    showTranscript(transcript) {
        let transcriptDiv = document.querySelector('.photospeak-transcript');
        if (!transcriptDiv) {
            transcriptDiv = document.createElement('div');
            transcriptDiv.className = 'photospeak-transcript';
            document.body.appendChild(transcriptDiv);
        }

        transcriptDiv.innerHTML = `
            <div class="transcript-content">
                <div class="transcript-header">
                    <span>PhotoSpeak</span>
                    <button class="transcript-close" onclick="window.galleryModule?.hideTranscript()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="transcript-text">${transcript}</div>
            </div>
        `;
        transcriptDiv.style.display = 'block';
    }

    hideTranscript() {
        const transcriptDiv = document.querySelector('.photospeak-transcript');
        if (transcriptDiv) {
            transcriptDiv.style.display = 'none';
        }
    }

    openImageModal(imageUrl) {
        let modal = document.querySelector('.image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.style.display='none'">
                    <div class="modal-content" onclick="event.stopPropagation()">
                        <button class="modal-close" onclick="this.closest('.image-modal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                        <img class="modal-image" src="" alt="Gallery Image">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalImage = modal.querySelector('.modal-image');
        modalImage.src = imageUrl;
        modal.style.display = 'block';
    }

    // Method for admin to update gallery
    updateGallery(newGallery) {
        this.gallery = newGallery;
        this.renderGalleryContent();
    }

    // Get current gallery data
    getGallery() {
        return this.gallery;
    }
}

// Initialize gallery module when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.galleryModule = new GalleryModule();
    });
}