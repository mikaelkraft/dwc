// Music Module for DWC v2 - Playlist management and track selection
class MusicModule {
    constructor(dwcApp) {
        this.app = dwcApp;
        this.tracks = [];
        this.currentPlaylist = null;
        this.isPlaylistVisible = false;
        
        this.init();
    }

    async init() {
        await this.loadTracks();
        this.createPlaylistUI();
        this.setupEventListeners();
    }

    async loadTracks() {
        try {
            const response = await fetch('./data/tracks.json');
            if (!response.ok) {
                throw new Error(`Failed to load tracks: ${response.status}`);
            }
            this.tracks = await response.json();
            console.log('Tracks loaded:', this.tracks.length);
        } catch (error) {
            console.error('Error loading tracks:', error);
            // Fallback to existing PUBLIC_DATA
            this.tracks = window.PUBLIC_DATA?.tracks || [];
        }
    }

    createPlaylistUI() {
        // Create playlist container
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'playlist-container';
        playlistContainer.innerHTML = `
            <div class="playlist-header">
                <h3 class="playlist-title">
                    <i class="fas fa-music"></i>
                    Playlist
                </h3>
                <button id="playlist-toggle" class="playlist-toggle-btn">
                    <i class="fas fa-list"></i>
                </button>
            </div>
            <div class="playlist-content" id="playlist-content">
                <div class="playlist-items" id="playlist-items"></div>
            </div>
        `;

        // Add to main content, after player container
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.parentNode.insertBefore(playlistContainer, playerContainer.nextSibling);
        }

        this.renderPlaylist();
    }

    renderPlaylist() {
        const playlistItems = document.getElementById('playlist-items');
        if (!playlistItems) return;

        playlistItems.innerHTML = this.tracks.map((track, index) => `
            <div class="playlist-item ${index === (this.app?.currentTrack || 0) ? 'active' : ''}" 
                 data-track-index="${index}" data-track-id="${track.id}">
                <div class="track-cover">
                    <img src="${track.coverUrl}" alt="${track.title}" loading="lazy" />
                    <div class="track-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                    <div class="track-album">${track.album || ''}</div>
                </div>
                <div class="track-duration">${track.duration}</div>
                <div class="track-actions">
                    <button class="track-action-btn" data-action="info" title="Track Info">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="track-action-btn" data-action="lyrics" title="View Lyrics">
                        <i class="fas fa-quote-left"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Playlist toggle
        const toggleBtn = document.getElementById('playlist-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePlaylist());
        }

        // Track selection
        const playlistItems = document.getElementById('playlist-items');
        if (playlistItems) {
            playlistItems.addEventListener('click', (e) => {
                const trackItem = e.target.closest('.playlist-item');
                if (trackItem) {
                    const trackIndex = parseInt(trackItem.dataset.trackIndex);
                    const action = e.target.closest('.track-action-btn')?.dataset.action;
                    
                    if (action) {
                        this.handleTrackAction(trackIndex, action);
                    } else {
                        this.selectTrack(trackIndex);
                    }
                }
            });
        }
    }

    togglePlaylist() {
        this.isPlaylistVisible = !this.isPlaylistVisible;
        const content = document.getElementById('playlist-content');
        const toggleBtn = document.getElementById('playlist-toggle');
        
        if (content) {
            content.classList.toggle('visible', this.isPlaylistVisible);
        }
        
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            icon.className = this.isPlaylistVisible ? 'fas fa-times' : 'fas fa-list';
        }
    }

    selectTrack(index) {
        if (index < 0 || index >= this.tracks.length) return;
        
        // Update app's current track
        if (this.app) {
            this.app.loadTrack(index);
        }
        
        // Update playlist UI
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        console.log(`Selected track: ${this.tracks[index].title} by ${this.tracks[index].artist}`);
    }

    handleTrackAction(trackIndex, action) {
        const track = this.tracks[trackIndex];
        if (!track) return;

        switch (action) {
            case 'info':
                this.showTrackInfo(track);
                break;
            case 'lyrics':
                this.showTrackLyrics(track);
                break;
        }
    }

    showTrackInfo(track) {
        // Create modal for track info
        const modal = document.createElement('div');
        modal.className = 'modal track-info-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Track Information</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <img src="${track.coverUrl}" alt="${track.title}" class="track-info-cover" />
                    <div class="track-info-details">
                        <h4>${track.title}</h4>
                        <p><strong>Artist:</strong> ${track.artist}</p>
                        <p><strong>Album:</strong> ${track.album || 'Unknown'}</p>
                        <p><strong>Duration:</strong> ${track.duration}</p>
                        ${track.providers ? `
                            <div class="providers-info">
                                <h5>Lyrics Providers:</h5>
                                <ul>
                                    ${track.providers.lrclib ? `<li>LRCLib: ${track.providers.lrclib.title}</li>` : ''}
                                    ${track.providers.kugou ? `<li>Kugou: ${track.providers.kugou.keyword}</li>` : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.modal-close');
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    showTrackLyrics(track) {
        // Scroll to lyrics section if it exists
        const lyricsContainer = document.querySelector('.lyrics-container');
        if (lyricsContainer) {
            lyricsContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        // If not current track, load it first
        const currentIndex = this.tracks.findIndex(t => t.id === track.id);
        if (currentIndex !== this.app?.currentTrack) {
            this.selectTrack(currentIndex);
        }
    }

    // Get track data for app integration
    getTrackData(index) {
        return this.tracks[index] || null;
    }

    // Get all tracks
    getAllTracks() {
        return this.tracks;
    }

    // Update current track highlight
    updateCurrentTrack(index) {
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }
}

// Export for use in main app
window.MusicModule = MusicModule;