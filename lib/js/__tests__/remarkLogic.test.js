import { describe, test, expect } from '@jest/globals';
import {
    isRemarkFile,
    getRemarkFileName,
    generateRemarkHTML
} from '../remarkLogic.js';

describe('Remark Logic', () => {
    describe('isRemarkFile', () => {
        test('returns true for .md files', () => {
            const file = { name: 'presentation.md' };
            expect(isRemarkFile(file)).toBe(true);
        });

        test('returns true for .markdown files', () => {
            const file = { name: 'slides.markdown' };
            expect(isRemarkFile(file)).toBe(true);
        });

        test('returns true for .remark files', () => {
            const file = { name: 'lecture.remark' };
            expect(isRemarkFile(file)).toBe(true);
        });

        test('returns true for uppercase extensions', () => {
            const file = { name: 'PRESENTATION.MD' };
            expect(isRemarkFile(file)).toBe(true);
        });

        test('returns true for mixed case extensions', () => {
            const file = { name: 'slides.MarkDown' };
            expect(isRemarkFile(file)).toBe(true);
        });

        test('returns false for .pdf files', () => {
            const file = { name: 'document.pdf' };
            expect(isRemarkFile(file)).toBe(false);
        });

        test('returns false for .txt files', () => {
            const file = { name: 'notes.txt' };
            expect(isRemarkFile(file)).toBe(false);
        });

        test('returns false for files without extension', () => {
            const file = { name: 'presentation' };
            expect(isRemarkFile(file)).toBe(false);
        });

        test('returns false for .html files', () => {
            const file = { name: 'index.html' };
            expect(isRemarkFile(file)).toBe(false);
        });
    });

    describe('getRemarkFileName', () => {
        test('strips .md extension', () => {
            const file = { name: 'presentation.md' };
            expect(getRemarkFileName(file)).toBe('presentation');
        });

        test('strips .markdown extension', () => {
            const file = { name: 'slides.markdown' };
            expect(getRemarkFileName(file)).toBe('slides');
        });

        test('strips .remark extension', () => {
            const file = { name: 'lecture.remark' };
            expect(getRemarkFileName(file)).toBe('lecture');
        });

        test('strips only the last extension', () => {
            const file = { name: 'presentation.backup.md' };
            expect(getRemarkFileName(file)).toBe('presentation.backup');
        });

        test('returns name unchanged when there is no extension', () => {
            const file = { name: 'presentation' };
            expect(getRemarkFileName(file)).toBe('presentation');
        });

        test('does not treat a leading dot as an extension', () => {
            const file = { name: '.hidden' };
            expect(getRemarkFileName(file)).toBe('.hidden');
        });

        test('handles multiple dots in filename', () => {
            const file = { name: 'lecture.part1.final.md' };
            expect(getRemarkFileName(file)).toBe('lecture.part1.final');
        });
    });

    describe('generateRemarkHTML', () => {
        test('generates valid HTML with markdown content', () => {
            const markdown = '# Title\n\nContent';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<textarea id="source">');
            expect(html).toContain('# Title');
            expect(html).toContain('Content');
            expect(html).toContain('https://remarkjs.com/downloads/remark-latest.min.js');
            expect(html).toContain('remark.create()');
            expect(html).toContain('window.addEventListener');
            expect(html).toContain("'message'");
        });

        test('escapes HTML special characters in markdown', () => {
            const markdown = '<script>alert("xss")</script>';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('&lt;script&gt;');
            expect(html).not.toContain('<textarea id="source"><script>alert');
        });

        test('escapes quotes in markdown', () => {
            const markdown = 'He said "hello"';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('&quot;hello&quot;');
        });

        test('escapes ampersands in markdown', () => {
            const markdown = 'A & B';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('A &amp; B');
        });

        test('handles empty markdown content', () => {
            const markdown = '';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('<textarea id="source"></textarea>');
        });

        test('handles multiline markdown', () => {
            const markdown = '# Slide 1\n\nPoint 1\nPoint 2\n\n---\n\n# Slide 2';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('# Slide 1');
            expect(html).toContain('Point 1');
            expect(html).toContain('---');
            expect(html).toContain('# Slide 2');
        });

        test('includes the remark.js CDN URL', () => {
            const markdown = '# Title';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('https://remarkjs.com/downloads/remark-latest.min.js');
        });

        test('generates self-contained HTML document', () => {
            const markdown = '# Title';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('<html');
            expect(html).toContain('<head>');
            expect(html).toContain('<body>');
            expect(html).toContain('</body>');
            expect(html).toContain('</html>');
        });

        test('includes message listener for navigation', () => {
            const markdown = '# Title';
            const html = generateRemarkHTML(markdown);
            expect(html).toContain('window.addEventListener');
            expect(html).toContain("'message'");
            expect(html).toContain('nextSlide');
            expect(html).toContain('previousSlide');
        });
    });
});
