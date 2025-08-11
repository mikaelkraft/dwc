// Content Writer Worker for DWC v2
// Provides /api endpoints for content management with KV storage, token auth, and ETag support

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Content-Token, If-None-Match',
      'Access-Control-Expose-Headers': 'ETag',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      const path = url.pathname;
      
      // Support both /api prefix and legacy paths for backward compatibility
      const apiPath = path.startsWith('/api') ? path.slice(4) : path;
      
      if (apiPath.startsWith('/content/')) {
        return handleContentEndpoint(request, env, apiPath, corsHeaders);
      } else if (apiPath.startsWith('/search/')) {
        return handleSearchEndpoint(request, env, apiPath, corsHeaders);
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

// Helper function to generate namespaced KV keys
function k(env, name) {
  const artistId = env.ARTIST_ID || 'default';
  return `a:${artistId}:${name}`;
}

// Helper function to compute ETag from content
async function computeETag(content) {
  const data = typeof content === 'string' ? content : JSON.stringify(content);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `"${hashHex.slice(0, 16)}"`;
}

// Handle content endpoints (/content/{type} or /content/bulk)
async function handleContentEndpoint(request, env, path, corsHeaders) {
  const method = request.method;
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return new Response('Invalid path', { status: 400, headers: corsHeaders });
  }

  const endpoint = pathParts[1]; // 'bulk' or content type
  
  if (endpoint === 'bulk') {
    return handleBulkEndpoint(request, env, method, corsHeaders);
  } else {
    return handleSingleContentEndpoint(request, env, method, endpoint, corsHeaders);
  }
}

// Handle bulk content operations
async function handleBulkEndpoint(request, env, method, corsHeaders) {
  if (method === 'GET') {
    // Get all content
    try {
      const contentTypes = ['profile', 'tracks', 'playlists', 'gallery', 'videos', 'shows', 'links'];
      const bulkData = {};
      
      for (const type of contentTypes) {
        const key = k(env, type);
        const value = await env.DWC_CONTENT.get(key);
        bulkData[type] = value ? JSON.parse(value) : (type === 'profile' ? {} : []);
      }
      
      const responseBody = JSON.stringify(bulkData);
      const etag = await computeETag(responseBody);
      
      // Check If-None-Match header
      const ifNoneMatch = request.headers.get('If-None-Match');
      if (ifNoneMatch === etag) {
        return new Response(null, { 
          status: 304, 
          headers: { ...corsHeaders, 'ETag': etag }
        });
      }
      
      return new Response(responseBody, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'ETag': etag
        }
      });
    } catch (error) {
      console.error('Bulk GET error:', error);
      return new Response('Failed to retrieve bulk content', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else if (method === 'POST') {
    // Save all content (requires token if configured)
    if (!await isAuthorized(request, env)) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    try {
      const bulkData = await request.json();
      const contentTypes = ['profile', 'tracks', 'playlists', 'gallery', 'videos', 'shows', 'links'];
      
      for (const type of contentTypes) {
        if (bulkData[type] !== undefined) {
          const key = k(env, type);
          await env.DWC_CONTENT.put(key, JSON.stringify(bulkData[type]));
        }
      }
      
      return new Response('Bulk content saved successfully', {
        headers: corsHeaders
      });
    } catch (error) {
      console.error('Bulk POST error:', error);
      return new Response('Failed to save bulk content', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
}

// Handle single content type endpoints
async function handleSingleContentEndpoint(request, env, method, contentType, corsHeaders) {
  const validTypes = ['profile', 'tracks', 'playlists', 'gallery', 'videos', 'shows', 'links'];
  
  if (!validTypes.includes(contentType)) {
    return new Response('Invalid content type', { status: 400, headers: corsHeaders });
  }
  
  const key = k(env, contentType);
  
  if (method === 'GET') {
    try {
      const value = await env.DWC_CONTENT.get(key);
      const content = value ? JSON.parse(value) : (contentType === 'profile' ? {} : []);
      
      const responseBody = JSON.stringify(content);
      const etag = await computeETag(responseBody);
      
      // Check If-None-Match header
      const ifNoneMatch = request.headers.get('If-None-Match');
      if (ifNoneMatch === etag) {
        return new Response(null, { 
          status: 304, 
          headers: { ...corsHeaders, 'ETag': etag }
        });
      }
      
      return new Response(responseBody, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'ETag': etag
        }
      });
    } catch (error) {
      console.error(`GET ${contentType} error:`, error);
      return new Response(`Failed to retrieve ${contentType}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else if (method === 'POST') {
    // Save content (requires token if configured)
    if (!await isAuthorized(request, env)) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    try {
      const content = await request.json();
      await env.DWC_CONTENT.put(key, JSON.stringify(content));
      
      return new Response(`${contentType} saved successfully`, {
        headers: corsHeaders
      });
    } catch (error) {
      console.error(`POST ${contentType} error:`, error);
      return new Response(`Failed to save ${contentType}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
}

// Handle search endpoints
async function handleSearchEndpoint(request, env, path, corsHeaders) {
  const method = request.method;
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length < 2) {
    return new Response('Invalid search path', { status: 400, headers: corsHeaders });
  }
  
  const endpoint = pathParts[1]; // 'log' or 'logs'
  
  if (endpoint === 'log' && method === 'POST') {
    // Log search query
    try {
      const searchData = await request.json();
      const { q, at } = searchData;
      
      if (!q || !at) {
        return new Response('Missing query (q) or timestamp (at)', { 
          status: 400, 
          headers: corsHeaders 
        });
      }
      
      // Store search log in KV (append to existing logs)
      const logsKey = k(env, 'search_logs');
      const existingLogs = await env.DWC_CONTENT.get(logsKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push({ q, at, ip: request.headers.get('CF-Connecting-IP') || 'unknown' });
      
      // Keep only last 1000 searches
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      await env.DWC_CONTENT.put(logsKey, JSON.stringify(logs));
      
      return new Response('Search logged', { headers: corsHeaders });
    } catch (error) {
      console.error('Search log error:', error);
      return new Response('Failed to log search', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else if (endpoint === 'logs' && method === 'GET') {
    // Get search logs (requires token if configured)
    if (!await isAuthorized(request, env)) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    try {
      const logsKey = k(env, 'search_logs');
      const logs = await env.DWC_CONTENT.get(logsKey);
      const searchLogs = logs ? JSON.parse(logs) : [];
      
      return new Response(JSON.stringify(searchLogs), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Search logs error:', error);
      return new Response('Failed to retrieve search logs', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  } else {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
}

// Check authorization for write operations
async function isAuthorized(request, env) {
  // If no token is configured, allow all operations (dev mode)
  if (!env.CONTENT_TOKEN) {
    return true;
  }
  
  // Check for X-Content-Token header
  const providedToken = request.headers.get('X-Content-Token');
  return providedToken === env.CONTENT_TOKEN;
}