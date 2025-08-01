import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, endpoint } = await req.json()

    // Get credentials from environment variables with fallback
    const username = Deno.env.get('SPACE_TRACK_USERNAME') || 'nihanth20@gmail.com'
    const password = Deno.env.get('SPACE_TRACK_PASSWORD') || 'CS2wTBBW.*LjZeY'
    
    console.log('Environment check:', {
      hasUsername: !!username,
      hasPassword: !!password,
      action,
      endpoint
    })

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

      console.log(`Making Space-Track request: ${endpoint}`)

      // First authenticate to get session cookie
      const authResponse = await fetch(`${baseUrl}/ajaxauth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })

      console.log('Auth response status:', authResponse.status)
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error('Authentication failed:', {
          status: authResponse.status,
          statusText: authResponse.statusText,
          response: errorText
        })
        throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
      }

      // According to Space-Track.org docs, successful auth returns empty response
      const authResponseText = await authResponse.text()
      console.log('Auth response text:', authResponseText)
      
      if (authResponseText !== '""' && authResponseText !== '') {
        console.error('Authentication may have failed - unexpected response:', authResponseText)
        throw new Error(`Authentication failed - unexpected response: ${authResponseText}`)
      }

      // Extract all cookies from the response
      const cookies = authResponse.headers.get('set-cookie')
      console.log('Received cookies:', cookies ? 'Yes' : 'No')
      
      if (!cookies) {
        console.error('No cookies received from Space-Track.org authentication')
        throw new Error('No authentication cookies received from Space-Track.org')
      }

      console.log('Authentication successful, proceeding with data request')

      // Make the actual data request using the authenticated session
      const dataResponse = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Cookie': cookies, // Use all cookies from auth response
        },
      })

      if (!dataResponse.ok) {
        throw new Error(`Space-Track API error: ${dataResponse.status} ${dataResponse.statusText}`)
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
    console.error('Space-Track proxy error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Space-Track proxy error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})