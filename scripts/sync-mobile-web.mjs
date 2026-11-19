// scripts/sync-mobile-web.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('📦 Exporting mobile web bundle...');
execSync('npx expo export --platform web', {
  cwd: path.resolve('mobile'),
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_ENABLE_DEMO_MODE: 'true' }
});

console.log('🔄 Syncing to root /app and /_expo for Vercel deployment...');
fs.cpSync('mobile/dist/_expo', '_expo', { recursive: true });
fs.mkdirSync('app', { recursive: true });
fs.copyFileSync('mobile/dist/index.html', 'app/index.html');

console.log('✅ Mobile web app is ready for Vercel deployment at /app!');
