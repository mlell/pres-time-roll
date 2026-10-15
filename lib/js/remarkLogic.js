// Remark.js logic module - pure functions for remark.js presentation handling

export function isRemarkFile(file) {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.md') || fileName.endsWith('.markdown') || fileName.endsWith('.remark');
}

export function getRemarkFileName(file) {
    const name = file.name;
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex > 0) {
        return name.substring(0, lastDotIndex);
    }
    return name;
}

export function generateRemarkHTML(markdownContent, remarkSource = '') {
    const inlineRemarkSource = remarkSource ? escapeInlineScript(remarkSource) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Remark Presentation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <textarea id="source">${escapeHTML(markdownContent)}</textarea>
    ${inlineRemarkSource ? `<script>${inlineRemarkSource}</script>` : ''}
    <script>
        if (typeof remark !== 'undefined' && typeof remark.create === 'function') {
            var slideshow = remark.create();
        }

        window.addEventListener('message', function(event) {
            if (event.data === 'nextSlide') {
                if (typeof slideshow !== 'undefined') {
                    slideshow.gotoNextSlide();
                }
            } else if (event.data === 'previousSlide') {
                if (typeof slideshow !== 'undefined') {
                    slideshow.gotoPreviousSlide();
                }
            }
        });
    </script>
</body>
</html>`;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeInlineScript(str) {
    return String(str).replace(/<\/script/gi, '<\\/script');
}
