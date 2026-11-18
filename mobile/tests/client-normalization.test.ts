// mobile/tests/client-normalization.test.ts
// Unit tests verifying createApiClient normalizes responses with success: true
// even when backend server endpoints return legacy payloads without success flag

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/api/client';

describe('createApiClient response normalization', () => {
  it('normalizes createReport response with success: true when server returns legacy payload without success flag', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (_url: any, _options: any) => {
        // Legacy payload from POST /api/reports without success property
        const legacyPayload = {
          id: 'rep-legacy-123',
          reportType: 'Survei Mata Air',
          location: 'Sumber Bismo',
          status: 'pending',
          points: 100,
          createdAt: '2026-11-18T10:00:00.000Z'
        };
        return new Response(JSON.stringify(legacyPayload), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }) as any;

      const client = createApiClient(async () => 'fake-token', 'https://belikhub.test');
      const res = await client.createReport({
        reportType: 'Survei Mata Air',
        location: 'Sumber Bismo',
        notes: 'Uji normalisasi legacy payload'
      });

      assert.equal(res.success, true, 'createReport response must have success: true normalized');
      assert.equal(res.id, 'rep-legacy-123');
      assert.equal(res.points, 100);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes updateReportStatus response with success: true when server returns legacy payload without success flag', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (_url: any, _options: any) => {
        // Legacy payload from PATCH /api/admin/reports/:id/status without success property
        const legacyPayload = {
          id: 'rep-legacy-456',
          status: 'approved',
          pointsAwarded: 100
        };
        return new Response(JSON.stringify(legacyPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }) as any;

      const client = createApiClient(async () => 'fake-admin-token', 'https://belikhub.test');
      const res = await client.updateReportStatus('rep-legacy-456', 'approved');

      assert.equal(res.success, true, 'updateReportStatus response must have success: true normalized');
      assert.equal(res.status, 'approved');
      assert.equal((res as any).pointsAwarded, 100);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
