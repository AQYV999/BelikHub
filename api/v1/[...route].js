// api/v1/[...route].js
// Catch-all router for BelikHub API v1 endpoints
// Consolidates all v1 routes into a single Vercel function to stay within the 12-function Hobby plan limit

import { URL } from 'node:url';
import { setCors, jsonResponse } from '../../lib/v1/http.js';
import { handleOnboarding, handleUpdateProfile } from '../../lib/v1/onboarding.js';
import { handleUpload } from '../../lib/v1/uploads.js';
import {
  handleCreateSpring,
  handleUpdateSpring,
  handleGetSpringSettings,
  handlePutSpringSettings
} from '../../lib/v1/springs-admin.js';
import {
  handleListResidents,
  handleCreateResident,
  handleUpdateResident,
  handleGenerateLinkCode,
  handleApproveLink
} from '../../lib/v1/residents.js';
import {
  handleListRetributions,
  handleGenerateBills,
  handleUpdateRetribution
} from '../../lib/v1/retributions.js';
import {
  handleListCampaigns,
  handleGetCampaign,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleCreateCampaignUpdate
} from '../../lib/v1/campaigns.js';
import {
  handleListDonations,
  handleCreateDonation,
  handleVerifyDonation
} from '../../lib/v1/donations.js';
import {
  handleListUsers,
  handleSetUserRoles
} from '../../lib/v1/admin-users.js';
import { handleGetSummary } from '../../lib/v1/summary.js';

/**
 * Extract path segments for routing:
 * First checks Vercel's query.route catch-all array,
 * then falls back to parsing URL pathname.
 * @param {object} request
 * @returns {string[]}
 */
function getRouteSegments(request) {
  if (Array.isArray(request.query?.route)) {
    return request.query.route
      .filter((s) => typeof s === 'string' && s.trim())
      .map((s) => decodeURIComponent(s.trim()));
  }

  if (typeof request.query?.route === 'string') {
    return request.query.route
      .split('/')
      .filter(Boolean)
      .map((s) => decodeURIComponent(s.trim()));
  }

  const urlObj = new URL(request.url || '/', 'http://localhost');
  const pathname = urlObj.pathname;
  const cleanPath = pathname.replace(/^\/?api\/v1\/?/, '');
  return cleanPath
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s.trim()));
}

/**
 * Ensure query params from URL are populated on request.query
 * @param {object} request
 */
function populateQueryParams(request) {
  if (!request.query || typeof request.query !== 'object') {
    request.query = {};
  }
  try {
    const urlObj = new URL(request.url || '/', 'http://localhost');
    for (const [key, val] of urlObj.searchParams.entries()) {
      if (request.query[key] === undefined) {
        request.query[key] = val;
      }
    }
  } catch {
    // continue
  }
}

/**
 * Factory for creating the v1 catch-all router with optional dependency injection
 * @param {object} [deps={}]
 * @returns {Function}
 */
export function createV1Router(deps = {}) {
  return async function router(request, response) {
    setCors(response, 'GET, POST, PATCH, PUT, DELETE, OPTIONS');

    if (request.method === 'OPTIONS') {
      return response.status(200).end();
    }

    populateQueryParams(request);
    const segments = getRouteSegments(request);
    const method = (request.method || 'GET').toUpperCase();

    // 1. /api/v1/onboarding
    if (segments.length === 1 && segments[0] === 'onboarding') {
      if (method === 'POST') {
        return await handleOnboarding(request, response, deps);
      }
      return jsonResponse(response, 405, { error: 'Method not allowed' });
    }

    // 2. /api/v1/profile
    if (segments.length === 1 && segments[0] === 'profile') {
      if (method === 'PATCH') {
        return await handleUpdateProfile(request, response, deps);
      }
      return jsonResponse(response, 405, { error: 'Method not allowed' });
    }

    // 3. /api/v1/uploads
    if (segments.length === 1 && segments[0] === 'uploads') {
      if (method === 'POST') {
        return await handleUpload(request, response, deps);
      }
      return jsonResponse(response, 405, { error: 'Method not allowed' });
    }

    // 4. /api/v1/springs...
    if (segments[0] === 'springs') {
      // /api/v1/springs/:id/settings
      if (segments.length === 3 && segments[2] === 'settings') {
        const springId = segments[1];
        request.query.id = springId;
        request.query.springId = springId;
        if (method === 'GET') {
          return await handleGetSpringSettings(request, response, springId, deps);
        }
        if (method === 'PUT') {
          return await handlePutSpringSettings(request, response, springId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/springs/:id
      if (segments.length === 2) {
        const springId = segments[1];
        request.query.id = springId;
        request.query.springId = springId;
        if (method === 'PATCH') {
          return await handleUpdateSpring(request, response, springId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/springs
      if (segments.length === 1) {
        if (method === 'POST') {
          return await handleCreateSpring(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 5. /api/v1/residents...
    if (segments[0] === 'residents') {
      // /api/v1/residents/approve-link
      if (segments.length === 2 && segments[1] === 'approve-link') {
        if (method === 'POST') {
          return await handleApproveLink(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/residents/:id/link-code
      if (segments.length === 3 && segments[2] === 'link-code') {
        const residentId = segments[1];
        request.query.id = residentId;
        request.query.residentId = residentId;
        if (method === 'POST') {
          return await handleGenerateLinkCode(request, response, residentId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/residents/:id
      if (segments.length === 2) {
        const residentId = segments[1];
        request.query.id = residentId;
        request.query.residentId = residentId;
        if (method === 'PATCH') {
          return await handleUpdateResident(request, response, residentId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/residents
      if (segments.length === 1) {
        if (method === 'GET') {
          return await handleListResidents(request, response, deps);
        }
        if (method === 'POST') {
          return await handleCreateResident(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 6. /api/v1/retributions...
    if (segments[0] === 'retributions') {
      // /api/v1/retributions/generate
      if (segments.length === 2 && segments[1] === 'generate') {
        if (method === 'POST') {
          return await handleGenerateBills(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/retributions/:id
      if (segments.length === 2) {
        const billId = segments[1];
        request.query.id = billId;
        request.query.billId = billId;
        if (method === 'PATCH') {
          return await handleUpdateRetribution(request, response, billId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/retributions
      if (segments.length === 1) {
        if (method === 'GET') {
          return await handleListRetributions(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 7. /api/v1/campaigns...
    if (segments[0] === 'campaigns') {
      // /api/v1/campaigns/:id/updates
      if (segments.length === 3 && segments[2] === 'updates') {
        const campaignId = segments[1];
        request.query.id = campaignId;
        request.query.campaignId = campaignId;
        if (method === 'POST') {
          return await handleCreateCampaignUpdate(request, response, campaignId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/campaigns/:id
      if (segments.length === 2) {
        const campaignId = segments[1];
        request.query.id = campaignId;
        request.query.campaignId = campaignId;
        if (method === 'GET') {
          return await handleGetCampaign(request, response, campaignId, deps);
        }
        if (method === 'PATCH') {
          return await handleUpdateCampaign(request, response, campaignId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/campaigns
      if (segments.length === 1) {
        if (method === 'GET') {
          return await handleListCampaigns(request, response, deps);
        }
        if (method === 'POST') {
          return await handleCreateCampaign(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 8. /api/v1/donations...
    if (segments[0] === 'donations') {
      // /api/v1/donations/:id
      if (segments.length === 2) {
        const donationId = segments[1];
        request.query.id = donationId;
        request.query.donationId = donationId;
        if (method === 'PATCH') {
          return await handleVerifyDonation(request, response, donationId, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/donations
      if (segments.length === 1) {
        if (method === 'GET') {
          return await handleListDonations(request, response, deps);
        }
        if (method === 'POST') {
          return await handleCreateDonation(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 9. /api/v1/admin/users...
    if (segments[0] === 'admin' && segments[1] === 'users') {
      // /api/v1/admin/users/:uid/roles
      if (segments.length === 4 && segments[3] === 'roles') {
        const uid = segments[2];
        request.query.uid = uid;
        request.query.id = uid;
        if (method === 'PATCH') {
          return await handleSetUserRoles(request, response, uid, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }

      // /api/v1/admin/users
      if (segments.length === 2) {
        if (method === 'GET') {
          return await handleListUsers(request, response, deps);
        }
        return jsonResponse(response, 405, { error: 'Method not allowed' });
      }
    }

    // 10. /api/v1/summary
    if (segments.length === 1 && segments[0] === 'summary') {
      if (method === 'GET') {
        return await handleGetSummary(request, response, deps);
      }
      return jsonResponse(response, 405, { error: 'Method not allowed' });
    }

    // Route not found
    return jsonResponse(response, 404, {
      error: `Route not found: ${method} /api/v1/${segments.join('/')}`
    });
  };
}

const defaultHandler = createV1Router();
export default defaultHandler;
