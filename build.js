import * as esbuild from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import sharp from 'sharp';

const rootDir = process.cwd();

// Step 1: Bundle the PDF.js worker into a self-contained IIFE string.
const workerResult = await esbuild.build({
  entryPoints: ['node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  bundle: true,
  format: 'iife',
  write: false,
  logLevel: 'warning',
});

const workerCode = workerResult.outputFiles[0].text;

// Step 2: Write the worker source as an ES module that exports the code string.
writeFileSync('lib/js/pdf.worker.inline.js', `export default ${JSON.stringify(workerCode)};\n`);

// Step 3: Generate an embedded remark runtime string so the app works offline.
const remarkSource = readFileSync('lib/js/remark.min.js', 'utf8');
writeFileSync('lib/js/remark.inline.js', `export default ${JSON.stringify(remarkSource)};\n`);

// Step 4: Bundle the main app (which imports worker and remark strings above).
await esbuild.build({
  entryPoints: ['lib/js/app.js'],
  bundle: true,
  outfile: 'lib/js/bundle.js',
  format: 'iife',
  logLevel: 'info',
});

// Step 5: Inline the stylesheet and bundle into a single self-contained HTML file.
const html = readFileSync('classtimer.html', 'utf8');
const css = readFileSync('lib/css/styles.css', 'utf8');
const js = readFileSync('lib/js/bundle.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const singleFile = html
  .replace('<link rel="stylesheet" href="lib/css/styles.css">', () => `<style>\n${css}</style>`)
  .replace('<script src="lib/js/bundle.js"></script>', () => `<script>\n${js}</script>`);

writeFileSync('classtimer_bundle.html', singleFile);

// Step 6: Prepare dist/ bundle for a PWA deploy.
mkdirSync('dist/icons', { recursive: true });
const bundleHash = createHash('sha256').update(singleFile).digest('hex').slice(0, 12);
const cacheVersion = `v${bundleHash}`;

const swSource = readFileSync('pwa/sw.js', 'utf8').replace(/__CACHE_VERSION__/g, cacheVersion);
writeFileSync('dist/sw.js', swSource);

// Copy manifest and render PNG icon sizes.
copyFileSync('pwa/manifest.webmanifest', 'dist/manifest.webmanifest');
const svg = readFileSync('pwa/icons/icon.svg');
await sharp(svg).resize(192, 192).png().toFile('dist/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('dist/icons/icon-512.png');
await sharp(svg).resize(512, 512).png().toFile('dist/icons/maskable-icon-512.png');

writeFileSync('dist/index.html', singleFile);

// Also keep a copy of the bundle in the root for release artifacts.
copyFileSync('classtimer_bundle.html', 'dist/classtimer_bundle.html');

console.log(`Build complete. Cache version: ${cacheVersion}`);
