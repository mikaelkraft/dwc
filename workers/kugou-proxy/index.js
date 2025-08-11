// Kugou Proxy Worker for DWC v2
// Provides search and download pass-through with CORS and base64 LRC decode

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;
      
      if (path.startsWith('/search')) {
        return handleSearch(request, corsHeaders);
      } else if (path.startsWith('/download')) {
        return handleDownload(request, corsHeaders);
      } else {
        return new Response('Kugou Proxy API - Use /search or /download endpoints', {
          headers: corsHeaders
        });
      }
    } catch (error) {
      console.error('Kugou proxy error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Handle search requests
async function handleSearch(request, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || url.searchParams.get('keyword');
  
  if (!query) {
    return new Response('Missing search query (q or keyword parameter)', {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Kugou search API endpoint
    const kugouSearchUrl = `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(query)}&duration=&hash=`;
    
    const response = await fetch(kugouSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Kugou search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Process and filter search results
    const processedResults = {
      status: data.status || 1,
      info: data.info || 'OK',
      candidates: (data.candidates || []).map(candidate => ({
        id: candidate.id,
        accesskey: candidate.accesskey,
        song: candidate.song,
        singer: candidate.singer,
        duration: candidate.duration,
        score: candidate.score
      })).slice(0, 20) // Limit to top 20 results
    };

    return new Response(JSON.stringify(processedResults), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(`Search failed: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Handle download requests
async function handleDownload(request, corsHeaders) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const accesskey = url.searchParams.get('accesskey');
  
  if (!id || !accesskey) {
    return new Response('Missing id or accesskey parameters', {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Kugou download API endpoint
    const kugouDownloadUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${id}&accesskey=${accesskey}&fmt=lrc&charset=utf8`;
    
    const response = await fetch(kugouDownloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Kugou download failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 1) {
      throw new Error(`Kugou API error: ${data.info || 'Unknown error'}`);
    }

    // Decode base64 LRC content
    let lrcContent = '';
    if (data.content) {
      try {
        lrcContent = atob(data.content);
      } catch (decodeError) {
        console.warn('Base64 decode failed:', decodeError);
        lrcContent = data.content; // Use as-is if decode fails
      }
    }

    const processedResponse = {
      status: 1,
      info: 'OK',
      content: lrcContent,
      fmt: 'lrc',
      charset: 'utf8'
    };

    return new Response(JSON.stringify(processedResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response(`Download failed: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Helper function to validate Kugou response
function validateKugouResponse(data) {
  return data && typeof data.status === 'number' && data.status === 1;
}

// Helper function to sanitize LRC content
function sanitizeLrc(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Basic sanitization - remove potentially harmful content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}