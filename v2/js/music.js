// Music Module for DWC v2 - Enhanced with playlists, search, and live data
class MusicModule {
    constructor(dwcApp) {
        this.app = dwcApp;
        this.tracks = [];
        this.playlists = [];
        this.currentPlaylist = null;
        this.isPlaylistVisible = false;
        this.searchResults = [];
        this.previewAudio = null;
        
        this.init();
    }

    async init() {
        await this.loadTracks();
        await this.loadPlaylists();
        this.createPlaylistUI();
        this.setupEventListeners();
    }

    async loadTracks() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load tracks from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/tracks`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.tracks = await response.json();
                        console.log('Tracks loaded from Worker:', this.tracks.length);
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load tracks from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/tracks.json');
            if (!response.ok) {
                throw new Error(`Failed to load tracks: ${response.status}`);
            }
            this.tracks = await response.json();
            console.log('Tracks loaded from local JSON:', this.tracks.length);
        } catch (error) {
            console.error('Error loading tracks:', error);
            // Fallback to existing PUBLIC_DATA
            this.tracks = window.PUBLIC_DATA?.tracks || [];
        }
    }

    async loadPlaylists() {
        try {
            // Try loading from Worker if live data is enabled
            if (window.DWC_CONFIG?.USE_LIVE_DATA && window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
                try {
                    console.log('Attempting to load playlists from Worker...');
                    const response = await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/content/playlists`, {
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        this.playlists = await response.json();
                        console.log('Playlists loaded from Worker:', this.playlists.length);
                        return;
                    }
                } catch (workerError) {
                    console.warn('Failed to load playlists from Worker, falling back to local JSON:', workerError);
                }
            }

            // Fallback to local JSON
            const response = await fetch('./data/playlists.json');
            if (!response.ok) {
                throw new Error(`Failed to load playlists: ${response.status}`);
            }
            this.playlists = await response.json();
            console.log('Playlists loaded from local JSON:', this.playlists.length);
        } catch (error) {
            console.error('Error loading playlists:', error);
            this.playlists = [];
        }
    }

    createPlaylistUI() {
        // Find music tab or create playlist container
        let musicContainer = document.getElementById('tab-music');
        if (!musicContainer) {
            // Create standalone playlist container for compatibility
            musicContainer = document.createElement('div');
            musicContainer.className = 'music-container';
            
            const playerContainer = document.querySelector('.player-container');
            if (playerContainer) {
                playerContainer.parentNode.insertBefore(musicContainer, playerContainer.nextSibling);
            }
        }

        // Create playlist and search interface
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'playlist-container';
        playlistContainer.innerHTML = `
            <div class="playlist-header">
                <h3 class="playlist-title">
                    <i class="fas fa-music"></i>
                    Music
                </h3>
                <button id="playlist-toggle" class="playlist-toggle-btn">
                    <i class="fas fa-list"></i>
                </button>
            </div>
            <div class="playlist-content" id="playlist-content">
                <div class="playlist-controls">
                    <select id="playlist-selector" class="playlist-selector">
                        <option value="">All Tracks</option>
                    </select>
                    <div class="search-controls">
                        <input type="text" id="track-search" placeholder="Search tracks..." class="track-search-input">
                        <button id="track-search-btn" class="track-search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="playlist-items" id="playlist-items"></div>
            </div>
        `;

        musicContainer.appendChild(playlistContainer);
        this.renderPlaylists();
        this.renderPlaylist();
    }

    renderPlaylists() {
        const playlistSelector = document.getElementById('playlist-selector');
        if (!playlistSelector || !this.playlists.length) return;

        // Clear existing options except "All Tracks"
        while (playlistSelector.children.length > 1) {
            playlistSelector.removeChild(playlistSelector.lastChild);
        }

        // Add playlist options
        this.playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.name;
            if (playlist.isDefault) {
                option.selected = true;
                this.currentPlaylist = playlist;
            }
            playlistSelector.appendChild(option);
        });
    }

    renderPlaylist() {
        const playlistItems = document.getElementById('playlist-items');
        if (!playlistItems) return;

        let tracksToShow = this.tracks;
        
        // Filter by current playlist if selected
        if (this.currentPlaylist) {
            tracksToShow = this.tracks.filter(track => 
                this.currentPlaylist.tracks.includes(track.id)
            );
        }

        // Show search results if searching
        if (this.searchResults.length > 0) {
            tracksToShow = this.searchResults;
        }

        playlistItems.innerHTML = tracksToShow.map((track, index) => {
            const globalIndex = this.tracks.findIndex(t => t.id === track.id);
            const isActive = globalIndex === (this.app?.currentTrack || 0);
            
            return `
                <div class="playlist-item ${isActive ? 'active' : ''}" 
                     data-track-index="${globalIndex}" data-track-id="${track.id}">
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
                        ${track.previewOnly ? '<span class="track-badge preview-only">Preview Only</span>' : ''}
                    </div>
                    <div class="track-duration">${track.duration}</div>
                    <div class="track-actions">
                        ${track.previewUrl ? `
                            <button class="track-action-btn" data-action="preview" title="Preview">
                                <i class="fas fa-headphones"></i>
                            </button>
                        ` : ''}
                        <button class="track-action-btn" data-action="info" title="Track Info">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="track-action-btn" data-action="lyrics" title="View Lyrics">
                            <i class="fas fa-quote-left"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Playlist toggle
        const toggleBtn = document.getElementById('playlist-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePlaylist());
        }

        // Playlist selector
        const playlistSelector = document.getElementById('playlist-selector');
        if (playlistSelector) {
            playlistSelector.addEventListener('change', (e) => {
                const playlistId = e.target.value;
                this.currentPlaylist = playlistId ? 
                    this.playlists.find(p => p.id === playlistId) : null;
                this.searchResults = []; // Clear search when changing playlists
                this.renderPlaylist();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('track-search');
        const searchBtn = document.getElementById('track-search-btn');
        
        if (searchInput && searchBtn) {
            const performSearch = () => {
                const query = searchInput.value.trim();
                this.searchTracks(query);
            };

            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Clear search when input is empty
            searchInput.addEventListener('input', (e) => {
                if (!e.target.value.trim()) {
                    this.searchResults = [];
                    this.renderPlaylist();
                }
            });
        }

        // Global music search (from main search box)
        const globalSearchInput = document.getElementById('music-search');
        const globalSearchBtn = document.getElementById('search-btn');
        
        if (globalSearchInput && globalSearchBtn) {
            const performGlobalSearch = () => {
                const query = globalSearchInput.value.trim();
                this.searchTracks(query, true); // global search
            };

            globalSearchBtn.addEventListener('click', performGlobalSearch);
            globalSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performGlobalSearch();
                }
            });
        }

        // Track selection and actions
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

    searchTracks(query, isGlobalSearch = false) {
        if (!query) {
            this.searchResults = [];
            this.renderPlaylist();
            return;
        }

        // Log search if enabled
        if (isGlobalSearch && window.DWC_CONFIG?.SEARCH_LOGGING_ENABLED && 
            window.DWC_CONFIG?.CONTENT_WRITE_PROXY) {
            this.logSearch(query);
        }

        // Perform local search
        const searchLower = query.toLowerCase();
        this.searchResults = this.tracks.filter(track => 
            track.title.toLowerCase().includes(searchLower) ||
            track.artist.toLowerCase().includes(searchLower) ||
            track.album?.toLowerCase().includes(searchLower)
        );

        console.log(`Search for "${query}" found ${this.searchResults.length} results`);
        this.renderPlaylist();
    }

    async logSearch(query) {
        try {
            await fetch(`${window.DWC_CONFIG.CONTENT_WRITE_PROXY}/api/search/log`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: query,
                    at: Date.now()
                })
            });
        } catch (error) {
            console.warn('Failed to log search query:', error);
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
        
        // Stop any preview audio
        this.stopPreview();
        
        // Update app's current track
        if (this.app) {
            this.app.loadTrack(index);
        }
        
        // Update playlist UI
        this.updateCurrentTrack(index);
        
        console.log(`Selected track: ${this.tracks[index].title} by ${this.tracks[index].artist}`);
    }

    handleTrackAction(trackIndex, action) {
        const track = this.tracks[trackIndex];
        if (!track) return;

        switch (action) {
            case 'preview':
                this.playPreview(track);
                break;
            case 'info':
                this.showTrackInfo(track);
                break;
            case 'lyrics':
                this.showTrackLyrics(track);
                break;
        }
    }

    playPreview(track) {
        if (!track.previewUrl) return;

        // Stop any currently playing preview
        this.stopPreview();

        try {
            this.previewAudio = new Audio(track.previewUrl);
            this.previewAudio.volume = 0.5;
            this.previewAudio.currentTime = 0;
            
            // Auto-stop after 30 seconds
            setTimeout(() => {
                this.stopPreview();
            }, 30000);
            
            this.previewAudio.play().catch(error => {
                console.warn('Preview playback failed:', error);
            });

            console.log(`Playing preview for: ${track.title}`);
        } catch (error) {
            console.error('Error playing preview:', error);
        }
    }

    stopPreview() {
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio = null;
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
                        ${track.previewOnly ? '<p><span class="preview-only-badge">Preview Only</span></p>' : ''}
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

    // Get all playlists
    getAllPlaylists() {
        return this.playlists;
    }

    // Update current track highlight
    updateCurrentTrack(index) {
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            const itemIndex = parseInt(item.dataset.trackIndex);
            item.classList.toggle('active', itemIndex === index);
        });
    }

    // Admin methods for updating data
    updateTracks(newTracks) {
        this.tracks = newTracks;
        this.searchResults = [];
        this.renderPlaylist();
    }

    updatePlaylists(newPlaylists) {
        this.playlists = newPlaylists;
        this.currentPlaylist = newPlaylists.find(p => p.isDefault) || null;
        this.renderPlaylists();
        this.renderPlaylist();
    }
}

// Export for use in main app
window.MusicModule = MusicModule;