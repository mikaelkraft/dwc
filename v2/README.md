# DWC v2 - Artist Hub

An advanced digital artist hub with live data loading, editable content management, and Cloudflare Workers integration.

## Features

- **Artist Hero**: Editable artist profile with name, tagline, avatar, and hero background
- **Music Player**: Enhanced with playlists, search, and preview clips
- **Gallery**: Image gallery with optional PhotoSpeak (audio overlay per image)
- **Live Data**: Load content from Cloudflare Workers with local JSON fallback
- **Admin Panel**: Full content management with Worker load/save and token authentication
- **Search**: Music search with optional logging to Worker
- **Content Management**: Cross-device persistence via Worker for Profile, Tracks, Playlists, Videos, Shows, Links, and Gallery

## Setup

### 1. Basic Configuration

Edit `v2/config.js` to configure the application:

```javascript
window.DWC_CONFIG = {
    // Cloudflare Worker URLs (set after deploying workers)
    CONTENT_WRITE_PROXY: 'https://your-content-writer.your-subdomain.workers.dev',
    KUGOU_PROXY: 'https://your-kugou-proxy.your-subdomain.workers.dev',
    
    // Security token for admin operations (optional - set only for trusted admin usage)
    CONTENT_WRITE_TOKEN: 'your-secure-token-here',
    
    // Feature flags
    USE_LIVE_DATA: true,              // Enable Worker data loading
    SEARCH_LOGGING_ENABLED: true,     // Log search queries to Worker
    LRCLIB_ENABLED: true,             // Enable LRCLib lyrics provider
    
    // Site navigation
    V1_URL: '../index.html',          // URL for V1 site link in header
};
```

### 2. Cloudflare Workers Deployment

#### Content Writer Worker

1. Navigate to the content writer directory:
   ```bash
   cd workers/content-writer
   ```

2. Install Wrangler (if not already installed):
   ```bash
   npm install -g wrangler
   ```

3. Login to Cloudflare:
   ```bash
   wrangler login
   ```

4. Create a KV namespace:
   ```bash
   wrangler kv:namespace create "DWC_CONTENT"
   ```

5. Update `wrangler.toml` with your KV namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "DWC_CONTENT"
   id = "your-actual-kv-namespace-id"
   ```

6. (Optional) Set content token for write protection:
   ```bash
   wrangler secret put CONTENT_TOKEN
   # Enter your secure token when prompted
   ```

7. Deploy the worker:
   ```bash
   wrangler deploy
   ```

#### Kugou Proxy Worker

1. Navigate to the proxy directory:
   ```bash
   cd ../kugou-proxy
   ```

2. Deploy the worker:
   ```bash
   wrangler deploy
   ```

### 3. Update Configuration

After deploying both workers, update `v2/config.js` with the Worker URLs:

```javascript
CONTENT_WRITE_PROXY: 'https://dwc-content-writer.your-subdomain.workers.dev',
KUGOU_PROXY: 'https://dwc-kugou-proxy.your-subdomain.workers.dev',
```

## Usage

### Public Site

1. **Browse Content**: The site loads data from Workers when `USE_LIVE_DATA` is enabled, falling back to local JSON files.

2. **Artist Hero**: Displays artist profile information including name, tagline, avatar, and hero background.

3. **Music**: 
   - Browse tracks organized in playlists
   - Search for music (optionally logged to Worker)
   - Preview tracks before full playback
   - View lyrics and track information

4. **Gallery**: 
   - View image gallery
   - Toggle PhotoSpeak for audio overlays on images
   - Full-screen image viewing

5. **Navigation**: Use tabs to switch between Music, Gallery, Videos, Shows, and Links.

### Admin Panel

Access the admin panel at `v2/admin/index.html`:

1. **Content Management**: Edit JSON data for all content types:
   - Profile (artist information)
   - Tracks (music library)
   - Playlists (track collections)
   - Gallery (images with PhotoSpeak)
   - Videos (YouTube/Vimeo embeds)
   - Shows (tour dates and venues)
   - Links (social/music platform links)

2. **Worker Integration**:
   - **Load from Worker**: Fetch all content from Cloudflare Worker
   - **Save to Worker**: Push all content to Cloudflare Worker
   - **Export All**: Download complete data backup as JSON
   - **Import All**: Upload and restore from JSON backup

3. **Authentication**: When `CONTENT_WRITE_TOKEN` is configured:
   - Set the token in `config.js` for admin access
   - Worker validates token for all write operations
   - Public site remains read-only without token

## API Endpoints

### Content Writer Worker

#### Content Management
- `GET /api/content/{type}` - Get content by type
- `POST /api/content/{type}` - Save content by type (requires token)
- `GET /api/content/bulk` - Get all content
- `POST /api/content/bulk` - Save all content (requires token)

#### Search Logging
- `POST /api/search/log` - Log search query
- `GET /api/search/logs` - Get search logs (requires token)

#### Backward Compatibility
All endpoints work with or without `/api` prefix for backward compatibility.

### Kugou Proxy Worker

- `GET /search?q={query}` - Search for lyrics
- `GET /download?id={id}&accesskey={accesskey}` - Download LRC file

## Content Types

### Profile (`profile.json`)
```json
{
  "name": "Artist Name",
  "tagline": "Artist tagline",
  "avatar": "avatar-url",
  "heroBackground": "hero-background-url",
  "bio": "Artist biography",
  "location": "Location",
  "website": "https://website.com",
  "social": {
    "twitter": "https://twitter.com/handle",
    "github": "https://github.com/username"
  }
}
```

### Tracks (`tracks.json`)
```json
[
  {
    "id": "track-id",
    "title": "Track Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "coverUrl": "cover-image-url",
    "audioUrl": "audio-file-url",
    "previewUrl": "preview-audio-url",
    "previewOnly": false,
    "duration": "3:45"
  }
]
```

### Gallery (`gallery.json`)
```json
[
  {
    "id": "image-id",
    "title": "Image Title",
    "url": "full-image-url",
    "thumbnail": "thumbnail-url",
    "description": "Image description",
    "tags": ["tag1", "tag2"],
    "photoSpeak": {
      "enabled": true,
      "audioUrl": "audio-overlay-url",
      "transcript": "Audio transcript"
    }
  }
]
```

## Security

- **No secrets in code**: All sensitive configuration is in `config.js` or Worker environment variables
- **Token protection**: Optional token authentication for write operations
- **CORS enabled**: Proper CORS headers for cross-origin requests
- **Read-only public**: Public site is read-only without admin token
- **Namespaced storage**: KV keys are namespaced by `ARTIST_ID`

## Development

### Local Testing

1. Start a local server:
   ```bash
   cd v2
   python3 -m http.server 8080
   ```

2. Open http://localhost:8080 in your browser

3. For admin testing, visit http://localhost:8080/admin/

### Data Structure

Content is organized in these files:
- `data/profile.json` - Artist profile information
- `data/tracks.json` - Music tracks with metadata
- `data/playlists.json` - Track collections
- `data/gallery.json` - Image gallery with PhotoSpeak
- `data/videos.json` - Video links (YouTube/Vimeo)
- `data/shows.json` - Concert/show listings
- `data/links.json` - Social and platform links

## Troubleshooting

### Common Issues

1. **Content not loading from Worker**: 
   - Check Worker URLs in `config.js`
   - Verify Workers are deployed and accessible
   - Check browser console for CORS errors

2. **Admin save failing**:
   - Ensure `CONTENT_WRITE_TOKEN` is set correctly
   - Verify Worker has write permissions
   - Check KV namespace configuration

3. **Search not working**:
   - Verify `KUGOU_PROXY` URL in config
   - Check if Kugou proxy worker is deployed
   - Ensure CORS is properly configured

### Debug Mode

Set `USE_LIVE_DATA: false` in config to use only local JSON files for testing.

## License

This project is licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).