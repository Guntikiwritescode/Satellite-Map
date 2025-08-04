import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Space-Track.org credentials
const SPACE_TRACK_EMAIL = 'nihanth20@gmail.com'
const SPACE_TRACK_PASSWORD = 'CS2wTBBW.*LjZeY'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, endpoint } = await req.json()
    
    if (action !== 'fetch') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    console.log('Authenticating with Space-Track.org...')
    
    // First, authenticate with Space-Track.org
    const authUrl = 'https://www.space-track.org/ajaxauth/login'
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Satellite-Map-App/1.0 (nihanth20@gmail.com)',
      },
      body: new URLSearchParams({
        identity: SPACE_TRACK_EMAIL,
        password: SPACE_TRACK_PASSWORD,
      }),
    })

    if (!authResponse.ok) {
      console.error('Space-Track authentication failed:', authResponse.status, authResponse.statusText)
      return new Response(
        JSON.stringify({ 
          error: 'Space-Track authentication failed', 
          status: authResponse.status,
          statusText: authResponse.statusText 
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Extract cookies from auth response
    const setCookieHeaders = authResponse.headers.getSetCookie?.() || []
    const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ')

    console.log('Authentication successful, fetching data from:', endpoint)
    
    // Now make the actual data request
    const dataUrl = `https://www.space-track.org${endpoint}`
    const dataResponse = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Satellite-Map-App/1.0 (nihanth20@gmail.com)',
        'Accept': 'application/json',
        'Cookie': cookies,
      },
    })

    if (!dataResponse.ok) {
      console.error('Space-Track data request failed:', dataResponse.status, dataResponse.statusText)
      return new Response(
        JSON.stringify({ 
          error: 'Space-Track data request failed', 
          status: dataResponse.status,
          statusText: dataResponse.statusText 
        }),
        {
          status: dataResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const data = await dataResponse.text()
    
    // Parse JSON if possible, otherwise return raw text
    let parsedData
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = data
    }
    
    console.log('Successfully fetched data from Space-Track.org')
    
    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Proxy request failed', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})