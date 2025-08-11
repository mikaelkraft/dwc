// DWC v2 Main Application
class DWCApp {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        this.currentTrack = 0;
        this.isPlaying = false;
        this.currentLyrics = null;
        this.currentLyricsLine = -1;
        this.typewriterTimeout = null;
        
        // Audio context for visualizer
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startClock();
        this.loadTrack(0);
        
        // Setup visualizer
        if (this.canvas) {
            this.setupVisualizer();
        }
        
        // Load lyrics for current track
        await this.loadLyrics();
    }

    setupEventListeners() {
        // Player controls
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousTrack());
        document.getElementById('next-btn').addEventListener('click', () => this.nextTrack());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeat-btn').addEventListener('click', () => this.toggleRepeat());
        
        // Progress bar
        const progressContainer = document.querySelector('.progress-bar-container');
        progressContainer.addEventListener('click', (e) => this.seekToPosition(e));
        progressContainer.addEventListener('mousemove', (e) => this.updateProgressHandle(e));
        
        // Volume control
        const volumeContainer = document.querySelector('.volume-bar-container');
        volumeContainer.addEventListener('click', (e) => this.setVolume(e));
        volumeContainer.addEventListener('mousemove', (e) => this.updateVolumeHandle(e));
        
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        
        // Admin panel (if enabled)
        if (window.DWC_CONFIG.SUPABASE?.enabled) {
            this.setupAdminPanel();
        }
    }

    setupVisualizer() {
        if (!this.canvas) return;
        
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        });
    }

    async setupAudioContext() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaElementSource(this.audio);
            
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.analyser.fftSize = window.DWC_CONFIG.VISUALIZER.barCount * 2;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.drawVisualizer();
        } catch (error) {
            console.warn('Could not setup audio context:', error);
        }
    }

    drawVisualizer() {
        if (!this.ctx || !this.analyser) return;
        
        requestAnimationFrame(() => this.drawVisualizer());
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barCount = window.DWC_CONFIG.VISUALIZER.barCount;
        const barWidth = width / barCount;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#00f5ff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#ffffff');
        
        this.ctx.fillStyle = gradient;
        
        // Draw bars
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * window.DWC_CONFIG.VISUALIZER.sensitivity;
            const x = i * barWidth;
            const y = height - barHeight;
            
            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            
            document.getElementById('digital-clock').textContent = `${hours}:${minutes}:${seconds}`;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    loadTrack(index) {
        const tracks = window.PUBLIC_DATA.tracks;
        if (index < 0 || index >= tracks.length) return;
        
        this.currentTrack = index;
        window.PUBLIC_DATA.currentTrackIndex = index;
        
        const track = tracks[index];
        this.audio.src = track.audioUrl;
        
        // Update UI
        document.getElementById('track-title').textContent = track.title;
        document.getElementById('track-artist').textContent = track.artist;
        document.getElementById('track-album').textContent = track.album;
        document.getElementById('track-image').src = track.imageUrl;
        document.getElementById('track-image').alt = `${track.title} by ${track.artist}`;
        
        // Load lyrics
        this.loadLyrics();
    }

    async loadLyrics() {
        const track = window.PUBLIC_DATA.tracks[this.currentTrack];
        const lyricsDisplay = document.getElementById('lyrics-display');
        
        // Show loading
        lyricsDisplay.innerHTML = `
            <div class="lyrics-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading lyrics...</span>
            </div>
        `;
        
        try {
            const lyrics = await window.lyricsProviders.fetchLyrics(track.title, track.artist);
            
            if (lyrics) {
                this.currentLyrics = lyrics;
                this.displayLyrics(lyrics);
                console.log(`Lyrics loaded from: ${lyrics.source}`);
            } else {
                this.displayNoLyrics();
            }
        } catch (error) {
            console.error('Error loading lyrics:', error);
            this.displayNoLyrics();
        }
    }

    displayLyrics(lyrics) {
        const lyricsDisplay = document.getElementById('lyrics-display');
        
        if (lyrics.synced && lyrics.synced.lines) {
            // Display synced lyrics
            const linesHTML = lyrics.synced.lines.map((line, index) => 
                `<div class="lyrics-line" data-time="${line.time}" data-index="${index}">${line.text}</div>`
            ).join('');
            
            lyricsDisplay.innerHTML = linesHTML;
            
            // Add click listeners for seeking
            document.querySelectorAll('.lyrics-line').forEach(line => {
                line.addEventListener('click', () => {
                    const time = parseFloat(line.dataset.time);
                    this.audio.currentTime = time;
                });
            });
        } else if (lyrics.plain) {
            // Display plain lyrics
            const lines = lyrics.plain.split('\n').filter(line => line.trim());
            const linesHTML = lines.map(line => `<div class="lyrics-line">${line}</div>`).join('');
            lyricsDisplay.innerHTML = linesHTML;
        }
        
        // Add source attribution
        const sourceInfo = document.createElement('div');
        sourceInfo.className = 'lyrics-source';
        sourceInfo.style.cssText = 'margin-top: 2rem; font-size: 0.8rem; color: #666; text-align: center;';
        sourceInfo.textContent = `Lyrics provided by: ${lyrics.source}`;
        lyricsDisplay.appendChild(sourceInfo);
    }

    displayNoLyrics() {
        document.getElementById('lyrics-display').innerHTML = `
            <div class="lyrics-loading">
                <i class="fas fa-music"></i>
                <span>No lyrics available for this track</span>
            </div>
        `;
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            await this.setupAudioContext();
            await this.audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    pause() {
        this.audio.pause();
    }

    onPlay() {
        this.isPlaying = true;
        const playBtn = document.getElementById('play-pause-btn');
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playBtn.classList.add('playing');
        
        // Start lyrics sync
        if (this.currentLyrics && this.currentLyrics.synced) {
            this.startLyricsSync();
        }
    }

    onPause() {
        this.isPlaying = false;
        const playBtn = document.getElementById('play-pause-btn');
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.classList.remove('playing');
        
        // Stop lyrics sync
        this.stopLyricsSync();
    }

    startLyricsSync() {
        if (!this.currentLyrics || !this.currentLyrics.synced) return;
        
        const syncLyrics = () => {
            if (!this.isPlaying) return;
            
            const currentTime = this.audio.currentTime;
            const lines = this.currentLyrics.synced.lines;
            
            // Find current line
            let activeLineIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (currentTime >= lines[i].time) {
                    activeLineIndex = i;
                } else {
                    break;
                }
            }
            
            // Update active line
            if (activeLineIndex !== this.currentLyricsLine) {
                // Remove previous active line
                document.querySelectorAll('.lyrics-line.active').forEach(line => {
                    line.classList.remove('active');
                });
                
                if (activeLineIndex >= 0) {
                    const activeLine = document.querySelector(`[data-index="${activeLineIndex}"]`);
                    if (activeLine) {
                        activeLine.classList.add('active');
                        
                        // Typewriter effect
                        if (window.DWC_CONFIG.LYRICS.enableTypewriter) {
                            this.typewriterEffect(activeLine, lines[activeLineIndex]);
                        }
                        
                        // Scroll to active line
                        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                
                this.currentLyricsLine = activeLineIndex;
            }
            
            requestAnimationFrame(syncLyrics);
        };
        
        syncLyrics();
    }

    stopLyricsSync() {
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
        }
    }

    typewriterEffect(element, lineData) {
        if (!lineData.words) return;
        
        const words = lineData.words;
        const speed = window.DWC_CONFIG.LYRICS.typewriterSpeed;
        
        element.innerHTML = '';
        let wordIndex = 0;
        
        const typeWord = () => {
            if (wordIndex < words.length) {
                const span = document.createElement('span');
                span.textContent = words[wordIndex] + ' ';
                span.className = 'typewriter';
                element.appendChild(span);
                
                wordIndex++;
                this.typewriterTimeout = setTimeout(typeWord, speed);
            }
        };
        
        typeWord();
    }

    previousTrack() {
        const newIndex = this.currentTrack - 1;
        if (newIndex >= 0) {
            this.loadTrack(newIndex);
        }
    }

    nextTrack() {
        const tracks = window.PUBLIC_DATA.tracks;
        const newIndex = this.currentTrack + 1;
        if (newIndex < tracks.length) {
            this.loadTrack(newIndex);
        }
    }

    onTrackEnded() {
        if (window.PUBLIC_DATA.state.isRepeat) {
            this.play();
        } else {
            this.nextTrack();
        }
    }

    toggleShuffle() {
        window.PUBLIC_DATA.state.isShuffle = !window.PUBLIC_DATA.state.isShuffle;
        const btn = document.getElementById('shuffle-btn');
        btn.classList.toggle('active', window.PUBLIC_DATA.state.isShuffle);
    }

    toggleRepeat() {
        window.PUBLIC_DATA.state.isRepeat = !window.PUBLIC_DATA.state.isRepeat;
        const btn = document.getElementById('repeat-btn');
        btn.classList.toggle('active', window.PUBLIC_DATA.state.isRepeat);
    }

    updateTrackInfo() {
        const duration = this.audio.duration;
        if (duration && !isNaN(duration)) {
            document.getElementById('total-time').textContent = this.formatTime(duration);
        }
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (duration && !isNaN(duration)) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progress-fill').style.width = `${progress}%`;
            document.getElementById('progress-handle').style.left = `${progress}%`;
            document.getElementById('current-time').textContent = this.formatTime(currentTime);
        }
    }

    seekToPosition(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const duration = this.audio.duration;
        
        if (duration && !isNaN(duration)) {
            this.audio.currentTime = percent * duration;
        }
    }

    updateProgressHandle(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        document.getElementById('progress-handle').style.left = `${Math.max(0, Math.min(100, percent * 100))}%`;
    }

    setVolume(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const volume = Math.max(0, Math.min(1, percent));
        
        this.audio.volume = volume;
        window.PUBLIC_DATA.state.volume = volume;
        
        document.getElementById('volume-fill').style.width = `${volume * 100}%`;
        document.getElementById('volume-handle').style.left = `${volume * 100}%`;
    }

    updateVolumeHandle(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        document.getElementById('volume-handle').style.left = `${Math.max(0, Math.min(100, percent * 100))}%`;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    setupAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            
            // Add Supabase integration here if needed
            console.log('Admin panel enabled - Supabase integration ready');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dwcApp = new DWCApp();
});

// Add particles effect
document.addEventListener('DOMContentLoaded', () => {
    const particlesContainer = document.getElementById('particles-container');
    if (!particlesContainer) return;
    
    const createParticle = () => {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 245, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            animation: particle-float 10s linear infinite;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 10000);
    };
    
    // Add CSS for particles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particle-float {
            to {
                transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Create particles periodically
    setInterval(createParticle, 200);
});