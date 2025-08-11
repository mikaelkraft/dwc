// Configuration for DWC v2
window.DWC_CONFIG = {
    // Kugou proxy URL - to be filled by maintainer after deploying the Worker
    KUGOU_PROXY: '',
    
    // LRCLib configuration
    LRCLIB_ENABLED: true,
    
    // Content write proxy for admin operations (Cloudflare Worker)
    CONTENT_WRITE_PROXY: '',
    
    // Content write token for admin authentication (set only for trusted admin usage)
    CONTENT_WRITE_TOKEN: '',
    
    // Enable live data loading from Workers (fallback to local JSON on error)
    USE_LIVE_DATA: false,
    
    // V1 site URL for header icon link
    V1_URL: '../index.html',
    
    // Enable search query logging to Worker
    SEARCH_LOGGING_ENABLED: false,
    
    // Supabase configuration - optional, disabled by default
    SUPABASE: {
        enabled: false,
        url: '',
        anonKey: ''
    },
    
    // Audio visualizer settings
    VISUALIZER: {
        enabled: true,
        barCount: 64,
        smoothing: 0.8,
        sensitivity: 2
    },
    
    // Lyrics settings
    LYRICS: {
        typewriterSpeed: 50, // milliseconds per character
        lineDelay: 1000, // delay between lines in ms
        enableTypewriter: true
    },
    
    // App settings
    APP: {
        name: 'Digital World Clock v2',
        version: '2.0.0',
        defaultVolume: 0.8
    }
};

// Legacy support - expose KUGOU_PROXY globally
window.KUGOU_PROXY = window.DWC_CONFIG.KUGOU_PROXY;