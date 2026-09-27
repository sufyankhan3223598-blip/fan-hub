// Copies the production Angular build into the API's wwwroot so one ASP.NET Core host serves
// both the SPA and the REST API (single-host deployment). Seeded media in wwwroot/media is preserved.
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const project = existsSync(dist) ? readdirSync(dist)[0] : null;
if (!project) { console.error('No build found. Run "npm run build" first.'); process.exit(1); }
const src = join(dist, project, 'browser');
const dest = resolve('../backend/FanHubPlus.Api/wwwroot');
cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}`);
