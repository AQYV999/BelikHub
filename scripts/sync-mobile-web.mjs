// scripts/sync-mobile-web.mjs
// Builds the Expo web app (mobile/app.json sets experiments.baseUrl = "/app")
// and copies the whole export to the repo's /app folder, which Vercel serves at /app.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('📦 Exporting mobile web bundle...');
execSync('npx expo export --platform web', {
  cwd: path.resolve('mobile'),
  stdio: 'inherit'
});

console.log('🔄 Syncing to root /app for Vercel deployment...');
fs.rmSync('app', { recursive: true, force: true });
fs.mkdirSync('app', { recursive: true });
fs.cpSync('mobile/dist', 'app', { recursive: true });
fs.rmSync('_expo', { recursive: true, force: true });

console.log('✅ Mobile web app is ready for Vercel deployment at /app!');
