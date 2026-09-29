// Copies the production Angular build into the API's wwwroot so one ASP.NET Core host serves
// both the SPA and the REST API (single-host deployment). Seeded media in wwwroot/media is preserved.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const project = existsSync(dist) ? readdirSync(dist)[0] : null;
if (!project) { console.error('No build found. Run "npm run build" first.'); process.exit(1); }
const src = join(dist, project, 'browser');
const dest = resolve('../backend/FanHubPlus.Api/wwwroot');
// Clean previous root bundles (chunk-*, main-*, styles-*, polyfills-*) from dest
for (const file of readdirSync(dest)) {
  if (/^(chunk-|main-|styles-|polyfills-).*\.(js|css)(\.map)?$/.test(file)) {
    rmSync(join(dest, file), { force: true });
  }
}

cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
