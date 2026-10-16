import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { createHash } from 'crypto';

const workerResult = await esbuild.build({
    entryPoints: ['node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
    bundle: true,
    format: 'iife',
    write: false,
    logLevel: 'warning',
});

const workerCode = workerResult.outputFiles[0].text;
writeFileSync('lib/js/pdf.worker.inline.js', `export default ${JSON.stringify(workerCode)};\n`);

const remarkSource = readFileSync('lib/js/remark.min.js', 'utf8');
writeFileSync('lib/js/remark.inline.js', `export default ${JSON.stringify(remarkSource)};\n`);

await esbuild.build({
    entryPoints: ['lib/js/main.js'],
    bundle: true,
    outfile: 'lib/js/bundle.js',
    format: 'iife',
    logLevel: 'info',
});

const html = readFileSync('classtimer.html', 'utf8');
const css = readFileSync('lib/css/styles.css', 'utf8');
const js = readFileSync('lib/js/bundle.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const remarkJs = readFileSync('lib/js/remark.min.js', 'utf8').replace(/<\/script/gi, '<\\/script');

const singleFile = html
    .replace('<link rel="stylesheet" href="lib/css/styles.css">', () => `<style>\n${css}</style>`)
    .replace('<script src="lib/js/remark.min.js"></script>', () => `<script>\n${remarkJs}</script>`)
    .replace('<script src="lib/js/bundle.js"></script>', () => `<script>\n${js}</script>`);

writeFileSync('classtimer_bundle.html', singleFile);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', singleFile);

const bundleHtml = readFileSync('classtimer_bundle.html', 'utf8');
const cacheVersion = createHash('sha256').update(bundleHtml).digest('hex').slice(0, 12);
const swSource = readFileSync('pwa/sw.js', 'utf8').replace(/__CACHE_VERSION__/g, cacheVersion);
writeFileSync('dist/sw.js', swSource);

cpSync('pwa/manifest.webmanifest', 'dist/manifest.webmanifest');
mkdirSync('dist/icons', { recursive: true });
cpSync('pwa/icons', 'dist/icons', { recursive: true });
