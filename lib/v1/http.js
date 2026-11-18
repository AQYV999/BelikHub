// lib/v1/http.js
// Shared HTTP helpers for API routes: CORS, parsing, validation, formatting

const GRID_DEG = 0.045; // ~5 km grid for coordinate fuzzing

/**
 * Set standard CORS headers on the response
 * @param {object} response
 * @param {string} [methods='GET, POST, OPTIONS']
 */
export function setCors(response, methods = 'GET, POST, OPTIONS') {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', methods);
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Safely parse JSON body from request
 * @param {object} request
 * @returns {object | null}
 */
export function parseJsonBody(request) {
  if (!request || request.body === undefined || request.body === null) {
    return null;
  }

  if (typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === 'string') {
    try {
      const parsed = JSON.parse(request.body.trim());
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }

  if (Buffer.isBuffer(request.body)) {
    try {
      const parsed = JSON.parse(request.body.toString('utf8'));
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Format any date/timestamp value into ISO 8601 string or null
 * @param {any} value
 * @returns {string | null}
 */
export function formatIso(value) {
  if (!value) return null;

  if (typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
    } catch {
      return null;
    }
  }

  if (value instanceof Date) {
    return !isNaN(value.getTime()) ? value.toISOString() : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  return null;
}

/**
 * Validate retribution bill period format (YYYY-MM with month 01-12)
 * @param {string} period
 * @returns {boolean}
 */
export function isValidPeriod(period) {
  if (typeof period !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period.trim());
}

/**
 * Snap coordinate to ~5 km grid for public privacy
 * @param {number} v
 * @returns {number | null}
 */
export function snapCoord(v) {
  if (typeof v !== 'number' || isNaN(v)) return null;
  const snapped = Math.round(v / GRID_DEG) * GRID_DEG;
  return Number(snapped.toFixed(4));
}

/**
 * Send JSON response helper
 * @param {object} response
 * @param {number} status
 * @param {object} data
 */
export function jsonResponse(response, status, data) {
  response.status(status).json(data);
}
