// Cloudflare Worker for Kugou lyrics proxy
// Deploy this to Cloudflare Workers and update v2/config.js with the worker URL

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return handleCORS();
    }
    
    // Only handle GET requests to /kugou endpoint
    if (request.method !== 'GET' || !url.pathname.startsWith('/kugou')) {
        return new Response('Not Found', { status: 404 });
    }
    
    try {
        const query = url.searchParams.get('q');
        if (!query) {
            return createResponse({ error: 'Missing query parameter' }, 400);
        }
        
        const result = await searchKugouLyrics(query);
        return createResponse(result);
        
    } catch (error) {
        console.error('Worker error:', error);
        return createResponse({ error: 'Internal server error' }, 500);
    }
}

async function searchKugouLyrics(query) {
    try {
        // Step 1: Search for the song
        const searchUrl = `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(query)}&duration=&hash=`;
        
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!searchResponse.ok) {
            throw new Error(`Search failed: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.candidates || searchData.candidates.length === 0) {
            return { synced: null, plain: null, error: 'No results found' };
        }
        
        // Get the first result
        const firstResult = searchData.candidates[0];
        const songId = firstResult.id;
        const accesskey = firstResult.accesskey;
        
        // Step 2: Get the lyrics
        const lyricsUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${songId}&accesskey=${accesskey}&fmt=lrc&charset=utf8`;
        
        const lyricsResponse = await fetch(lyricsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!lyricsResponse.ok) {
            throw new Error(`Lyrics download failed: ${lyricsResponse.status}`);
        }
        
        const lyricsData = await lyricsResponse.json();
        
        if (lyricsData.content) {
            // Decode base64 content
            const decodedLyrics = atob(lyricsData.content);
            
            // Extract plain text version
            const plainLyrics = decodedLyrics
                .replace(/\[\d+:\d+\.\d+\]/g, '')
                .split('\n')
                .filter(line => line.trim())
                .join('\n')
                .trim();
            
            return {
                synced: decodedLyrics,
                plain: plainLyrics,
                source: 'Kugou',
                metadata: {
                    title: firstResult.song || '',
                    artist: firstResult.singer || '',
                    duration: firstResult.duration || 0
                }
            };
        }
        
        return { synced: null, plain: null, error: 'No lyrics content found' };
        
    } catch (error) {
        console.error('Kugou search error:', error);
        return { synced: null, plain: null, error: error.message };
    }
}

function handleCORS() {
    return new Response(null, {
        status: 200,
        headers: getCORSHeaders()
    });
}

function createResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
        }
    });
}

function getCORSHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

// Alternative simplified version for testing
// Uncomment this and comment out the above if the full version doesn't work

/*
addEventListener('fetch', event => {
    event.respondWith(handleSimpleRequest(event.request));
});

async function handleSimpleRequest(request) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
    
    if (request.method === 'GET' && url.pathname.startsWith('/kugou')) {
        const query = url.searchParams.get('q');
        
        // Return mock data for testing
        const mockLyrics = `[00:00.00]Mock lyrics for: ${query}
[00:05.00]This is a test response from Kugou proxy
[00:10.00]Real implementation would fetch from Kugou API
[00:15.00]Configure this worker URL in v2/config.js`;
        
        const plainMock = mockLyrics.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
        
        return new Response(JSON.stringify({
            synced: mockLyrics,
            plain: plainMock,
            source: 'Kugou (Mock)'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    return new Response('Not Found', { status: 404 });
}
*/