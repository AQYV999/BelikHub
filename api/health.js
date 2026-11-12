// api/health.js
// Health check endpoint
// GET /api/health

export default function handler(request, response) {
  const configured = Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  return response.status(200).json({
    ok: true,
    configured,
    service: 'belikhub-api',
    database: 'firestore',
    timestamp: new Date().toISOString()
  });
}