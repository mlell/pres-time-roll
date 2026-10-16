# ClassTimer

A classroom timer and presentation viewer with offline-capable PWA support.

## Project layout

- `pwa/` — web manifest, service worker, and app icons
- `lib/js/` — app logic, timer logic, remark rendering helpers, and tests
- `lib/css/` — styling for the main layout and timer UI
- `dist/` — generated deployable build output with the bundled app shell

## Build

```bash
npm install
npm run build
```

The build step generates `classtimer_bundle.html` and the deployable `dist/` folder.

## Tests and coverage

```bash
npm test              # run the test suite
npm run test:coverage # run tests and print a coverage report
```

The coverage report is printed to the terminal and written to `coverage/` (open `coverage/lcov-report/index.html` for a browsable view). Coverage covers `lib/js/*.js`, excluding the generated `bundle.js`, inlined worker/remark files, and minified vendor code.

## Offline installation

The app is installed as a PWA when served via HTTPS or localhost. After the first online visit, the service worker caches the app shell and supports offline use for the main UI.

## Running locally

```bash
npx serve dist
```

Then open the local URL and use the browser devtools to verify the manifest, service worker, and offline behavior.
