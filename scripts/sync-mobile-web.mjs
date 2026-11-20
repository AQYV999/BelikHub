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
// Icon fonts (Ionicons.ttf etc.) are emitted under dist/assets/node_modules and referenced as
// /assets/node_modules/...; that path is git-ignored (node_modules/), so it would never reach
// Vercel and every vector icon would render as a missing-glyph box. Ship them as /assets/_nm/
// and rewrite the references inside the exported bundle.
if (fs.existsSync('mobile/dist/assets/node_modules')) {
  fs.cpSync('mobile/dist/assets/node_modules', 'assets/_nm', { recursive: true });
  const jsDir = path.join('_expo', 'static', 'js', 'web');
  for (const f of fs.readdirSync(jsDir).filter((n) => n.endsWith('.js'))) {
    const file = path.join(jsDir, f);
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('/assets/node_modules/')) {
      fs.writeFileSync(file, src.split('/assets/node_modules/').join('/assets/_nm/'));
    }
  }
}

fs.mkdirSync('app', { recursive: true });
fs.copyFileSync('mobile/dist/index.html', 'app/index.html');

console.log('✅ Mobile web app is ready for Vercel deployment at /app!');
