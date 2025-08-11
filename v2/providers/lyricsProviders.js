// Lyrics providers for DWC v2
class LyricsProviders {
    constructor() {
        this.cache = new Map();
        this.currentProvider = null;
    }

    // Main method to fetch lyrics
    async fetchLyrics(title, artist) {
        const cacheKey = `${artist}-${title}`.toLowerCase();
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let lyrics = null;

        try {
            // Try LRCLib first
            console.log('Trying LRCLib...');
            lyrics = await this.fetchFromLRCLib(title, artist);
            if (lyrics) {
                this.currentProvider = 'LRCLib';
                this.cache.set(cacheKey, lyrics);
                return lyrics;
            }
        } catch (error) {
            console.warn('LRCLib failed:', error.message);
        }

        try {
            // Try Kugou proxy if available
            if (window.DWC_CONFIG?.KUGOU_PROXY) {
                console.log('Trying Kugou proxy...');
                lyrics = await this.fetchFromKugou(title, artist);
                if (lyrics) {
                    this.currentProvider = 'Kugou';
                    this.cache.set(cacheKey, lyrics);
                    return lyrics;
                }
            } else {
                console.log('Kugou proxy not configured');
            }
        } catch (error) {
            console.warn('Kugou proxy failed:', error.message);
        }

        // Fallback to local LRC file if available
        try {
            console.log('Trying local fallback...');
            lyrics = await this.fetchLocalLRC();
            if (lyrics) {
                this.currentProvider = 'Local';
                this.cache.set(cacheKey, lyrics);
                return lyrics;
            }
        } catch (error) {
            console.warn('Local fallback failed:', error.message);
        }

        return null;
    }

    // Fetch from LRCLib API
    async fetchFromLRCLib(title, artist) {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title + ' ' + artist)}`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error(`LRCLib API error: ${response.status}`);
        }

        const results = await response.json();
        
        if (results && results.length > 0) {
            const track = results[0];
            
            if (track.syncedLyrics) {
                return {
                    synced: this.parseLRC(track.syncedLyrics),
                    plain: track.plainLyrics || track.syncedLyrics.replace(/\[\d+:\d+\.\d+\]/g, '').trim(),
                    source: 'LRCLib'
                };
            } else if (track.plainLyrics) {
                return {
                    synced: null,
                    plain: track.plainLyrics,
                    source: 'LRCLib'
                };
            }
        }

        return null;
    }

    // Fetch from Kugou proxy
    async fetchFromKugou(title, artist) {
        const proxyUrl = window.DWC_CONFIG.KUGOU_PROXY;
        if (!proxyUrl) {
            throw new Error('Kugou proxy URL not configured');
        }

        const searchQuery = encodeURIComponent(`${title} ${artist}`);
        const response = await fetch(`${proxyUrl}/kugou?q=${searchQuery}`);
        
        if (!response.ok) {
            throw new Error(`Kugou proxy error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.synced || result.plain) {
            return {
                synced: result.synced ? this.parseLRC(result.synced) : null,
                plain: result.plain,
                source: 'Kugou'
            };
        }

        return null;
    }

    // Fetch local LRC file
    async fetchLocalLRC() {
        const track = window.PUBLIC_DATA.tracks[window.PUBLIC_DATA.currentTrackIndex];
        if (!track.lrcFile) {
            throw new Error('No local LRC file specified');
        }

        const response = await fetch(track.lrcFile);
        if (!response.ok) {
            throw new Error(`Failed to load local LRC file: ${response.status}`);
        }

        const lrcContent = await response.text();
        
        return {
            synced: this.parseLRC(lrcContent),
            plain: lrcContent.replace(/\[\d+:\d+\.\d+\]/g, '').trim(),
            source: 'Local'
        };
    }

    // Parse LRC format to structured data
    parseLRC(lrcText) {
        const lines = lrcText.split('\n');
        const lyrics = [];
        const metadata = {};

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Check for metadata tags
            const metaMatch = trimmedLine.match(/^\[(\w+):(.+)\]$/);
            if (metaMatch) {
                metadata[metaMatch[1]] = metaMatch[2];
                continue;
            }

            // Check for timed lyrics
            const timeMatch = trimmedLine.match(/^\[(\d+):(\d+)\.(\d+)\](.*)$/);
            if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const centiseconds = parseInt(timeMatch[3]);
                const text = timeMatch[4].trim();
                
                const time = minutes * 60 + seconds + centiseconds / 100;
                
                if (text) {
                    lyrics.push({
                        time: time,
                        text: text,
                        words: this.splitIntoWords(text)
                    });
                }
            }
        }

        return {
            metadata: metadata,
            lines: lyrics.sort((a, b) => a.time - b.time)
        };
    }

    // Split text into words for typewriter effect
    splitIntoWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0);
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get current provider info
    getProviderInfo() {
        return {
            current: this.currentProvider,
            cacheSize: this.cache.size
        };
    }
}

// Create global instance
window.lyricsProviders = new LyricsProviders();