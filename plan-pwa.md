Aim: Make this app an offline-capable PWA

For this, drop the staging feature. Do not deploy a test version
at GitHubPages, URL /staging)

Dropping staging simplifies things. Before I write the plan, I'll check two details: whether the main page uses the global `remark`, and where staging is documented.

I checked the model's list against the repo. Several items don't fit how this app is actually deployed, so the plan below differs from the list.

## What the list gets wrong

- **Only one file is deployed.** `pages.yml` copies `classtimer_bundle.html` to `index.html`. `lib/css/styles.css`, `bundle.js` and `remark.min.js` never reach the site, so precaching them would fail at install. The app shell is just `./`, the manifest and the icons.
- **Hardcoded `/pres-time-roll/` paths aren't needed.** Using relative URLs everywhere (`./`, `sw.js`, `manifest.webmanifest`) works from any subpath.
- **The main page never uses the `remark` global.** The only use is in the generated blob page. The `<script src="lib/js/remark.min.js">` in `classtimer.html` is dead weight that gets inlined into every bundle.
- **Version stamping belongs in `build.js`.** A content hash needs no extra workflow step.
- **Inlining remark needs care for tests.** `build.js` writes `pdf.worker.inline.js`, which is gitignored. CI runs `npm test` before the build, so `remarkLogic.js` must not import a generated file. Pass the source in as a parameter instead.

## Plan

### 1. PWA source files in a new `pwa/` directory
- `pwa/manifest.webmanifest`:
  - Set `name`, `short_name`, `display: "standalone"`, `background_color` and `theme_color`.
  - Use `"start_url": "./"` and `"scope": "./"`.
  - Icon `src` values are relative, for example `icons/icon-192.png`.
- `pwa/icons/`: 192, 512 and maskable-512 PNGs.
  - As icon, generate an SVG and use the timer design: A round circle in the sidebar background color, with 12 lighter timer segments. In the 
  middle of the circle a "play" symbol
- `pwa/sw.js`:
  - It contains the placeholder `__CACHE_VERSION__`.
  - **install:** precache `./`, `index.html`, `manifest.webmanifest` and the icons, then call `skipWaiting()`.
  - **activate:** delete caches whose name isn't the current one, then call `clients.claim()`.
  - **fetch:** handle same-origin GET requests only. Use network-first for navigations with a cache fallback, and cache-first for everything else. Network-first means a deploy shows up on the next online load instead of waiting for the SW to swap.

### 2. `classtimer.html`
- Add `<link rel="manifest" href="manifest.webmanifest">` and `<meta name="theme-color" content="...">`.
- Remove `<script src="lib/js/remark.min.js">`, and remove the matching `.replace(...)` and `remarkJs` read in `build.js`.

### 3. Registration (`lib/js/app.js`)
- Register only when `'serviceWorker' in navigator` and the protocol is `http:` or `https:`. This skips `file://`, so the release bundle is unaffected.
- Swallow registration errors. A dev server serving `classtimer.html` has no `sw.js`.
- Optional: put this in a small injectable helper (`lib/js/pwaLogic.js`) so it can be tested.

### 4. Offline remark presentation
- Change `generateRemarkHTML(markdownContent, remarkSource)` to inline `remarkSource` in a `<script>` tag. Escape `</script` in it, as `build.js` already does.
- In `build.js`, add a step that writes the gitignored `lib/js/remark.inline.js` as `export default "<string>"`. Add it to `.gitignore`.
- In `app.js`, import that string and pass it in.
- The blob page isn't controlled by the SW, so inlining is the only option that works offline.
- Optional: `assets/examples/sample-presentation.md` loads `remarkjs.com/logo.png`. That image will be broken offline.

### 5. `build.js` emits a deployable `dist/`
- `dist/index.html` is the bundle, so `classtimer_bundle.html` stays as the release asset.
- `dist/sw.js` is `pwa/sw.js` with `__CACHE_VERSION__` replaced by a short SHA-256 of the bundle HTML.
- `dist/manifest.webmanifest` and `dist/icons/` are copied from `pwa/`.
- Add `dist` to `.gitignore`.

### 6. Pages workflow (simplified, since staging is gone)
- Single checkout. The `test` job runs `npm ci && npm test`. The `deploy` job runs `npm ci && npm run bundle` and uploads `dist/`.
- Remove the `stable`/`staging` checkouts, the `git tag -l ... | head` logic and the "Assemble site" step.
- **Decision for you:** what should trigger the deploy? I'd keep `v*` tags only (so the site matches releases) and add `workflow_dispatch`. Deploying on `main` pushes is the other option. Either way, the `release.yml` bundle job is unchanged.

### 7. Docs
- Update the README folder structure for `pwa/`.
- Add a short "Install / offline use" note: it needs HTTPS or localhost, and the first online visit populates the cache.

### 8. Optional: update prompt
- Drop `skipWaiting()` and use `registration.onupdatefound` to show a "Reload for new version" banner that posts a `SKIP_WAITING` message to the worker.

### Manual verification
- Serve `dist/` with `npx serve dist`, or use the Pages URL.
- In DevTools, check Application → Manifest, then tick Offline and reload.
- Load an `.md` file offline and check that the `C` new-window view renders.
- Run Lighthouse's installability audit.

## Unit test hints (brief, happy path)
- **`remarkLogic.test.js`:**
  - Update the two tests that expect the CDN URL.
  - Add one test: `generateRemarkHTML('# T', 'window.remark={create(){}};')` contains that source in a `<script>`, contains `remark.create()`, and does not contain `remarkjs.com`.
- **`pwaLogic.test.js`** (only if you extract the helper): with a fake `navigator = { serviceWorker: { register: jest.fn(() => Promise.resolve()) } }` and `protocol: 'https:'`, `registerServiceWorker(...)` calls `register('sw.js')`.
- The SW itself and `build.js` are covered by the manual checks above, not Jest.

Want me to implement this? I'd need two answers first: the deploy trigger from step 6, and whether you have icon artwork or want me to generate simple placeholder PNGs.
