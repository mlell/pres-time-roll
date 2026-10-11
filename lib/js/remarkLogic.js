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

export function generateRemarkHTML(markdownContent) {
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
    <script src="https://remarkjs.com/downloads/remark-latest.min.js"></script>
    <script>
        var slideshow = remark.create();

        // Listen for navigation messages from parent window
        window.addEventListener('message', function(event) {
            if (event.data === 'nextSlide') {
                slideshow.gotoNextSlide();
            } else if (event.data === 'previousSlide') {
                slideshow.gotoPreviousSlide();
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
