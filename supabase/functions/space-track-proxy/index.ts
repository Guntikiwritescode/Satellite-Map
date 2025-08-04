import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for now
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

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
    
    // Construct the full Space-Track.org URL
    const baseUrl = 'https://www.space-track.org/ajaxauth/login'
    const fullUrl = `https://www.space-track.org${endpoint}`
    
    console.log('Fetching from Space-Track.org:', fullUrl)
    
    // Forward the request to Space-Track.org
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Satellite-Map-App/1.0 (contact@example.com)', // Space-Track requires contact info
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Space-Track API error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ 
          error: 'Space-Track API request failed', 
          status: response.status,
          statusText: response.statusText 
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const data = await response.text()
    
    // Parse JSON if possible, otherwise return raw text
    let parsedData
    try {
      parsedData = JSON.parse(data)
    } catch {
      parsedData = data
    }
    
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