// api/firebase-config.js
// Returns public Firebase Client configuration (no secrets)
// GET /api/firebase-config

export default async function handler(request, response) {
  try {
    response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || ''
  };

  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    return response.status(500).json({ 
      error: 'Firebase config not fully configured', 
      missing 
    });
  }

  return response.status(200).json(config);
  } catch (error) {
    console.error("API Error:", error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}