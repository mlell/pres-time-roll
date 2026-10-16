// PDF logic module - pure functions for page navigation and canvas sizing

export function getTargetPage(currentPage, delta, numPages) {
    const target = currentPage + delta;
    if (target < 1 || target > numPages) return null;
    return target;
}

export function getNavState({ hasPdf, pageNum, numPages, hasRemark }) {
    if (hasPdf) {
        return { prevDisabled: pageNum <= 1, nextDisabled: pageNum >= numPages };
    }
    if (hasRemark) {
        return { prevDisabled: false, nextDisabled: false };
    }
    return { prevDisabled: true, nextDisabled: true };
}

export function shouldRestorePDF({ hasRemark, hasSavedPDF, hasPdf }) {
    return !hasRemark && hasSavedPDF && !hasPdf;
}

export function getFitScale(pageWidth, pageHeight, containerWidth, containerHeight) {
    return Math.min(containerWidth / pageWidth, containerHeight / pageHeight);
}

export function isRenderableScale(scale) {
    return scale > 0;
}

export function getCanvasPixelSize(viewportWidth, viewportHeight, dpr) {
    return {
        width: Math.floor(viewportWidth * dpr),
        height: Math.floor(viewportHeight * dpr),
    };
}
