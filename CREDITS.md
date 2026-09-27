# Credits and licenses

Fan Hub Plus is a student project for fan information and discovery. Franchise, studio and artist names belong to their respective owners and are used only to describe them. No copyrighted posters, trailers, music or character artwork are bundled with the project.

## 3D models

| Asset | Author / source | License | Used in |
|---|---|---|---|
| RobotExpressive (`robot.glb`) | Tomas Laulhe (Quaternius), modifications by Don McCurdy, via the three.js examples | CC0 1.0 | Home cinematic scenes |
| Soldier (`soldier.glb`) | Mixamo character distributed with the three.js examples | Mixamo terms (free to use in projects) | Home cinematic scenes |
| Xbot (`xbot.glb`) | Mixamo character distributed with the three.js examples | Mixamo terms | Home cinematic scenes |
| Michelle (`michelle.glb`) | Mixamo character distributed with the three.js examples | Mixamo terms | Home cinematic scenes |
| Realm props (katana, controller, film reel, microphone, manga, mask, portal, energy core...) | Built procedurally in code for this project | Project original | Home, realm heroes, auth pages, 404 |
| Preloader fighter | Original SVG silhouette drawn for this project | Project original | Intro preloader |

Model textures were downscaled with `tools/shrink_glb.py` to keep downloads small.

## Fonts

| Font | Source | License |
|---|---|---|
| Orbitron | Google Fonts (Matt McInerney) | SIL Open Font License 1.1 |
| Rajdhani | Google Fonts (Indian Type Foundry) | SIL Open Font License 1.1 |
| Inter | Google Fonts (Rasmus Andersson) | SIL Open Font License 1.1 |
| Helvetiker (3D text) | three.js examples typeface | MIT (three.js) |

Fonts are self-hosted in `frontend/public/fonts`.

## Images, audio and video

| Asset | Source |
|---|---|
| Realm, content, character, article, merchandise, event and upcoming-release artwork (`wwwroot/media/images`) | Generated for this project with `tools/gen_images.py` (procedural Python / Pillow artwork) |
| Soundtrack and podcast audio (`wwwroot/media/audio`) | Synthesized for this project with `tools/gen_media.py` |
| Realm teasers and feature explainer videos (`wwwroot/media/video`) | Rendered for this project with `tools/gen_media.py` |
| Sintel, Big Buck Bunny, Tears of Steel (YouTube embeds, not bundled) | Blender Foundation open movies, CC BY 3.0 - (c) Blender Foundation, blender.org |
| Globe dots (`public/data/globe-dots.json`) | Derived from Natural Earth country outlines via the johan/world.geo.json dataset (public domain / Natural Earth terms) |
| Map tiles | (c) OpenStreetMap contributors, (c) CARTO - attribution shown on every map |

## Frontend libraries

| Library | License |
|---|---|
| Angular 20 (core, common, router, forms, platform-browser, compiler) | MIT |
| RxJS | Apache 2.0 |
| Three.js (r182) | MIT |
| GSAP 3 + ScrollTrigger | GreenSock standard license (free) |
| Lenis | MIT |
| Leaflet | BSD-2-Clause |
| Draco decoder (`public/draco`, used by the three.js GLTF loader) | Apache 2.0 (Google) |
| Bootstrap 5 (grid and utilities) | MIT |
| TypeScript | Apache 2.0 |

## Backend libraries

| Library | License |
|---|---|
| ASP.NET Core 8, Entity Framework Core 8 (SqlServer, Design, Tools), JwtBearer, ASP.NET Core Identity password hasher | MIT |
| Swashbuckle.AspNetCore | MIT |
| AutoMapper | MIT |
| FluentValidation | Apache 2.0 |
| MailKit | MIT |
| Serilog.AspNetCore | Apache 2.0 |

## Tools used to generate project assets

Python 3, NumPy, Pillow, FFmpeg (media rendering).

## AI tools used (SRS acknowledgement)

| Tool | How it was used |
|---|---|
| Claude (Anthropic) | Coding assistant for scaffolding, code generation, debugging and review of the Angular client, ASP.NET Core API, SQL scripts and asset-generation scripts |

Team members should add any other AI tools they used (for example Copilot, Canva AI, Figma AI) before submission. The SRS requires the project report to be written by the team.
