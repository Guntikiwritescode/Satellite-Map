// Vercel API route to proxy Space-Track.org requests
// Handles authentication and CORS for satellite data fetching

const SPACE_TRACK_EMAIL = 'nihanth20@gmail.com';
const SPACE_TRACK_PASSWORD = 'CS2wTBBW.*LjZeY';

export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for the actual API calls
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, endpoint } = req.body;
    
    if (action !== 'fetch') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    console.log('Authenticating with Space-Track.org...');
    
    // Step 1: Authenticate with Space-Track.org
    const authUrl = 'https://www.space-track.org/ajaxauth/login';
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
    });

    if (!authResponse.ok) {
      console.error('Space-Track authentication failed:', authResponse.status, authResponse.statusText);
      return res.status(401).json({ 
        error: 'Space-Track authentication failed', 
        status: authResponse.status,
        statusText: authResponse.statusText 
      });
    }

    // Step 2: Extract cookies from auth response
    const setCookieHeaders = authResponse.headers.get('set-cookie') || '';
    const cookies = setCookieHeaders.split(',').map(cookie => cookie.split(';')[0]).join('; ');

    console.log('Authentication successful, fetching data from:', endpoint);
    
    // Step 3: Make the actual data request with authentication cookies
    const dataUrl = `https://www.space-track.org${endpoint}`;
    const dataResponse = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Satellite-Map-App/1.0 (nihanth20@gmail.com)',
        'Accept': 'application/json',
        'Cookie': cookies,
      },
    });

    if (!dataResponse.ok) {
      console.error('Space-Track data request failed:', dataResponse.status, dataResponse.statusText);
      return res.status(dataResponse.status).json({ 
        error: 'Space-Track data request failed', 
        status: dataResponse.status,
        statusText: dataResponse.statusText 
      });
    }

    const data = await dataResponse.text();
    
    // Parse JSON if possible, otherwise return raw text
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      parsedData = data;
    }
    
    console.log('Successfully fetched data from Space-Track.org');
    
    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy request failed', 
      details: error.message 
    });
  }
}