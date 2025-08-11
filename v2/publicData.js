// Public data for DWC v2 - Default content
window.PUBLIC_DATA = {
    // Default playlist
    tracks: [
        {
            id: 'righteous-juice-wrld',
            title: 'Righteous',
            artist: 'Juice WRLD',
            album: 'Legends Never Die',
            duration: '3:23',
            audioUrl: '../music/righteous.mp3', // Relative to existing audio file
            imageUrl: 'https://via.placeholder.com/300x300/1a1a2e/00f5ff?text=Righteous', // Placeholder image
            lrcFile: 'sample.lrc' // Local LRC file for fallback
        }
    ],
    
    // Current track index
    currentTrackIndex: 0,
    
    // Playlist metadata
    playlist: {
        name: 'Legends Never Die',
        description: 'Say no to drugs - A tribute to Juice WRLD',
        totalTracks: 1
    },
    
    // App state
    state: {
        isPlaying: false,
        currentTime: 0,
        volume: 0.8,
        isShuffle: false,
        isRepeat: false
    }
};