#!/usr/bin/env node

/**
 * CORS Issue Diagnostic and Fix Helper
 * 
 * This script helps diagnose and fix CORS issues with the Supabase edge function.
 * Run with: node fix-cors.js
 */

import https from 'https';
import { URL } from 'url';

const SUPABASE_FUNCTION_URL = 'https://dnjhvmwznqsunjpabacg.supabase.co/functions/v1/space-track-proxy';
const VERCEL_URL = 'https://satellite-map-rust.vercel.app';

console.log('🛰️  ALCHEMIST Satellite Tracker - CORS Fix Helper\n');

async function testCORS(origin) {
  return new Promise((resolve) => {
    const url = new URL(SUPABASE_FUNCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const req = https.request(options, (res) => {
      const allowedOrigin = res.headers['access-control-allow-origin'];
      resolve({
        status: res.statusCode,
        allowedOrigin: allowedOrigin,
        success: allowedOrigin === origin || allowedOrigin === '*'
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'ERROR',
        error: err.message,
        success: false
      });
    });

    req.end();
  });
}

async function main() {
  console.log('Testing CORS configuration...\n');

  // Test current Vercel URL
  console.log(`🔍 Testing Vercel domain: ${VERCEL_URL}`);
  const vercelTest = await testCORS(VERCEL_URL);
  
  if (vercelTest.success) {
    console.log('✅ Vercel domain is allowed - CORS should work!');
    console.log('   If you\'re still seeing errors, try clearing browser cache.\n');
  } else {
    console.log('❌ Vercel domain is NOT allowed');
    console.log(`   Current allowed origin: ${vercelTest.allowedOrigin || 'None'}\n`);
  }

  // Test Lovable domain
  const lovableUrl = 'https://db206876-4992-4720-8f1f-11cdcdfaaedd.lovableproject.com';
  console.log(`🔍 Testing Lovable domain: ${lovableUrl}`);
  const lovableTest = await testCORS(lovableUrl);
  
  if (lovableTest.success) {
    console.log('✅ Lovable domain is allowed (legacy configuration)');
  } else {
    console.log('❌ Lovable domain is NOT allowed');
  }

  console.log('\n' + '='.repeat(60));
  
  if (!vercelTest.success) {
    console.log('🚨 CORS ISSUE DETECTED!\n');
    console.log('🔧 TO FIX THIS ISSUE:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select project: dnjhvmwznqsunjpabacg');
    console.log('3. Navigate to: Settings → Environment Variables');
    console.log('4. Find the ALLOWED_DOMAIN variable');
    console.log('5. Update it to one of these values:');
    console.log('');
    console.log('   Option A (Vercel only):');
    console.log(`   ${VERCEL_URL}`);
    console.log('');
    console.log('   Option B (Multiple domains):');
    console.log(`   ${VERCEL_URL},${lovableUrl},http://localhost:5173`);
    console.log('');
    console.log('6. Go to: Edge Functions → space-track-proxy');
    console.log('7. Click "Deploy" to restart the function');
    console.log('8. Wait 1-2 minutes, then refresh your app');
    console.log('');
  } else {
    console.log('✅ CORS configuration looks good!');
    console.log('');
    console.log('If satellites still aren\'t loading, check:');
    console.log('• Browser developer console for other errors');
    console.log('• Space-Track.org API credentials in Supabase');
    console.log('• Network connectivity');
  }

  console.log('\n📖 For more help, see: DEPLOYMENT_INSTRUCTIONS.md');
  console.log('🆘 If issues persist, check the browser console for detailed error messages.');
}

main().catch(console.error);