// api/health.js
// Health check endpoint
// GET /api/health

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  return response.status(200).json({
    ok: true,
    service: 'belikhub-api',
    database: 'firestore',
    timestamp: new Date().toISOString()
  });
}