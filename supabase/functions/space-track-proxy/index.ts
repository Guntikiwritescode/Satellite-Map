import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Dynamic CORS headers - support both dev and production domains
const getAllowedOrigins = () => {
  const devOrigin = 'https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com';
  const publishedOrigin = 'https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovable.app';
  const previewOrigin = 'https://preview--sky-watch-globe.lovable.app';
  const customDomain = 'https://alchemistsatmap.com';
  return [devOrigin, publishedOrigin, previewOrigin, customDomain];
};

const getCorsHeaders = (requestOrigin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = allowedOrigins.includes(requestOrigin || '') ? requestOrigin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
};

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Validate request body
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { action, endpoint } = await req.json()

    // Get credentials from environment variables - fail securely if missing
    const username = Deno.env.get('SPACE_TRACK_USERNAME')
    const password = Deno.env.get('SPACE_TRACK_PASSWORD')
    
    console.log('Checking credentials...', { 
      usernameConfigured: !!username, 
      passwordConfigured: !!password 
    })
    
    if (!username || !password) {
      console.error('Space-Track credentials not configured:', {
        username: username ? 'SET' : 'MISSING',
        password: password ? 'SET' : 'MISSING'
      })
      return new Response(
        JSON.stringify({ error: 'Service configuration error - credentials missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!action) {
      console.error('Missing action parameter')
      return new Response(
        JSON.stringify({ error: 'Missing action parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const baseUrl = 'https://www.space-track.org'

    if (action === 'authenticate') {
      console.log('Authenticating with Space-Track.org...')
      
      // Authenticate with Space-Track.org
      const authResponse = await fetch(`${baseUrl}/ajaxauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
      }

      // Extract session cookie
      const cookies = authResponse.headers.get('set-cookie')
      let sessionCookie = null
      
      if (cookies) {
        const sessionMatch = cookies.match(/JSESSIONID=([^;]+)/)
        if (sessionMatch) {
          sessionCookie = sessionMatch[1]
        }
      }

      console.log('Successfully authenticated with Space-Track.org')
      
      return new Response(
        JSON.stringify({ success: true, sessionCookie }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'fetch') {
      if (!endpoint) {
        return new Response(
          JSON.stringify({ error: 'Missing endpoint parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate endpoint to prevent injection attacks
      if (typeof endpoint !== 'string' || endpoint.length > 500) {
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Only allow specific Space-Track API endpoints
      const allowedEndpoints = [
        '/basicspacedata/query/class/gp/',
        '/basicspacedata/query/class/tle_latest/',
        '/basicspacedata/query/class/satcat/'
      ]
      
      const isValidEndpoint = allowedEndpoints.some(allowed => endpoint.startsWith(allowed))
      if (!isValidEndpoint) {
        console.warn('Blocked unauthorized endpoint access attempt')
        return new Response(
          JSON.stringify({ error: 'Endpoint not allowed' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // First authenticate to get session cookie
      const authResponse = await fetch(`${baseUrl}/ajaxauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })
      
      if (!authResponse.ok) {
        console.error('Authentication failed')
        throw new Error('Authentication failed')
      }

      // According to Space-Track.org docs, successful auth returns empty response
      const authResponseText = await authResponse.text()
      
      if (authResponseText !== '""' && authResponseText !== '') {
        console.error('Authentication failed - unexpected response')
        throw new Error('Authentication failed')
      }

      // Extract all cookies from the response
      const cookies = authResponse.headers.get('set-cookie')
      
      if (!cookies) {
        console.error('No authentication cookies received')
        throw new Error('Authentication failed')
      }

      // Make the actual data request using the authenticated session
      const dataResponse = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Cookie': cookies,
        },
      })

      if (!dataResponse.ok) {
        console.error('Space-Track API request failed')
        throw new Error('External API error')
      }

      const data = await dataResponse.json()
      
      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Space-Track proxy error occurred:', error.message)
    console.error('Full error details:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})