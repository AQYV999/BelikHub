// lib/v1/uploads.js
// Server-proxied upload handler and signed read URL resolution for Firebase Storage
// Storage rules remain `allow read, write: if false;` — all uploads proxied via Admin SDK

import crypto from 'crypto';
import { requireAuth as defaultRequireAuth, extractRoles, json } from '../auth.js';
import { setCors, parseJsonBody } from './http.js';
import { getAdminStorage as defaultGetAdminStorage } from '../firebase-admin.js';

export const VALID_UPLOAD_PURPOSES = [
  'retribution_proof',
  'donation_proof',
  'revitalization_photo',
  'report_photo',
  'qris_image'
];

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

/**
 * Resolve a 1-hour signed read URL for a storage object path.
 * Returns null if objectPath is empty, invalid, or bucket is not configured.
 * @param {string | null | undefined} objectPath
 * @param {object} [deps={}]
 * @returns {Promise<string | null>}
 */
export async function resolveSignedReadUrl(objectPath, deps = {}) {
  if (!objectPath || typeof objectPath !== 'string') {
    return null;
  }
  const trimmedPath = objectPath.trim();
  if (!trimmedPath || trimmedPath.includes('..')) {
    return null;
  }

  const env = deps.env || process.env;
  const bucketName = env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName || typeof bucketName !== 'string' || !bucketName.trim()) {
    return null;
  }

  try {
    const getStorage = deps.getAdminStorage || defaultGetAdminStorage;
    const storage = getStorage();
    const bucket = storage.bucket(bucketName.trim());
    const file = bucket.file(trimmedPath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });
    return signedUrl || null;
  } catch (error) {
    console.error('resolveSignedReadUrl error:', error);
    return null;
  }
}

/**
 * Handle server-proxied image upload
 * @param {object} request
 * @param {object} response
 * @param {object} [deps={}]
 */
export async function handleUpload(request, response, deps = {}) {
  setCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  // Explicit FIREBASE_STORAGE_BUCKET check — fail with 503 if missing or empty
  const env = deps.env || process.env;
  const bucketName = env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName || typeof bucketName !== 'string' || !bucketName.trim()) {
    return json(response, 503, {
      error: 'Storage service unavailable: FIREBASE_STORAGE_BUCKET is not configured'
    });
  }

  // Parse request body
  const body = parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return json(response, 400, { error: 'Invalid or missing JSON body' });
  }

  const { purpose, contentType, dataBase64 } = body;

  // Validate purpose
  if (!purpose || typeof purpose !== 'string' || !VALID_UPLOAD_PURPOSES.includes(purpose)) {
    return json(response, 400, {
      error: `Invalid or missing purpose. Allowed: ${VALID_UPLOAD_PURPOSES.join(', ')}`
    });
  }

  // Validate contentType
  if (!contentType || typeof contentType !== 'string' || !ALLOWED_IMAGE_MIMES.includes(contentType)) {
    return json(response, 400, {
      error: `Invalid or missing contentType. Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`
    });
  }

  // Validate dataBase64
  if (!dataBase64 || typeof dataBase64 !== 'string') {
    return json(response, 400, { error: 'dataBase64 is required and must be a string' });
  }

  let cleanBase64 = dataBase64;
  const prefixMatch = /^data:[^;]+;base64,/;
  if (prefixMatch.test(cleanBase64)) {
    cleanBase64 = cleanBase64.replace(prefixMatch, '');
  }
  cleanBase64 = cleanBase64.trim();
  if (!cleanBase64) {
    return json(response, 400, { error: 'dataBase64 payload cannot be empty' });
  }

  let buffer;
  try {
    buffer = Buffer.from(cleanBase64, 'base64');
  } catch {
    return json(response, 400, { error: 'Invalid base64 payload' });
  }

  if (!buffer || buffer.length === 0) {
    return json(response, 400, { error: 'Empty file payload' });
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return json(response, 413, {
      error: `Payload exceeds 2 MB limit (received ${buffer.length} bytes, max ${MAX_UPLOAD_BYTES} bytes)`
    });
  }

  // Validate auth
  const requireAuthFn = deps.requireAuth || defaultRequireAuth;
  const auth = await requireAuthFn(request, response, deps);
  if (!auth.success) {
    return json(response, auth.status || 401, { error: auth.error || 'Unauthorized' });
  }

  // Role permissions:
  // - qris_image requires admin
  // - revitalization_photo requires pengelola | admin
  // - other purposes open to any authenticated user
  const roles = extractRoles(auth.user);
  if (purpose === 'qris_image') {
    if (!roles.includes('admin')) {
      return json(response, 403, { error: 'Forbidden: qris_image upload requires admin role' });
    }
  } else if (purpose === 'revitalization_photo') {
    if (!roles.includes('pengelola') && !roles.includes('admin')) {
      return json(response, 403, {
        error: 'Forbidden: revitalization_photo upload requires pengelola or admin role'
      });
    }
  }

  // Save to uploads/{purpose}/{uid}/{timestamp}-{uuid}.{ext}
  const ext = MIME_EXTENSIONS[contentType] || 'bin';
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const objectPath = `uploads/${purpose}/${auth.user.uid}/${timestamp}-${uuid}.${ext}`;

  try {
    const getStorage = deps.getAdminStorage || defaultGetAdminStorage;
    const storage = getStorage();
    const bucket = storage.bucket(bucketName.trim());
    const file = bucket.file(objectPath);

    await file.save(buffer, {
      contentType,
      metadata: {
        purpose,
        uploadedBy: auth.user.uid,
        uploadedAt: new Date().toISOString()
      }
    });

    const readUrl = await resolveSignedReadUrl(objectPath, deps);

    return json(response, 201, { objectPath, readUrl });
  } catch (error) {
    console.error('handleUpload error:', error);
    return json(response, 500, { error: 'Failed to upload image' });
  }
}
