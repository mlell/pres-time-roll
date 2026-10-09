import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

// Step 1: Bundle the PDF.js worker into a self-contained IIFE string.
// This avoids the file:// CORS restriction by inlining the worker into the
// main bundle and creating a Blob URL at runtime.
const workerResult = await esbuild.build({
  entryPoints: ['node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
  bundle: true,
  format: 'iife',
  write: false,
  logLevel: 'warning',
});

const workerCode = workerResult.outputFiles[0].text;

// Step 2: Write the worker source as an ES module that exports the code string.
writeFileSync(
  'lib/js/pdf.worker.inline.js',
  `export default ${JSON.stringify(workerCode)};\n`
);

// Step 3: Bundle the main app (which imports the worker string above).
await esbuild.build({
  entryPoints: ['lib/js/app.js'],
  bundle: true,
  outfile: 'lib/js/bundle.js',
  format: 'iife',
  logLevel: 'info',
});

// Step 4: Inline the stylesheet and bundle into a single self-contained HTML file.
// A replacer function is used so `$` sequences in the JS are not interpreted.
const html = readFileSync('classtimer.html', 'utf8');
const css = readFileSync('lib/css/styles.css', 'utf8');
const js = readFileSync('lib/js/bundle.js', 'utf8').replace(/<\/script/gi, '<\\/script');

const singleFile = html
  .replace('<link rel="stylesheet" href="lib/css/styles.css">', () => `<style>\n${css}</style>`)
  .replace('<script src="lib/js/bundle.js"></script>', () => `<script>\n${js}</script>`);

writeFileSync('classtimer_bundle.html', singleFile);
