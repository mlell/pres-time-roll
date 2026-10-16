import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerCode from './pdf.worker.inline.js';
import remarkSource from './remark.inline.js';
import { createApp } from './app.js';

// Create a Blob URL from the inlined worker code.
// This avoids file:// CORS restrictions that block loading external worker scripts.
const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

createApp({ document, window, pdfjs: pdfjsLib, remarkSource }).init();
