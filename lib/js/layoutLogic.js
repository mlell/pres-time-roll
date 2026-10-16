// Layout logic module - pure functions for sidebar sizing

export const SIDEBAR_MAX_WIDTH = 500;
export const RESIZE_GRIP_THRESHOLD_PX = 10;

export function isSidebarWidthAllowed(width) {
    return width >= 0 && width <= SIDEBAR_MAX_WIDTH;
}

export function snapSidebarWidth(width) {
    return width < RESIZE_GRIP_THRESHOLD_PX ? 0 : width;
}

export function shouldShowResizeGrip({ isTouch, sidebarWidth, presentationWidth }) {
    return isTouch || sidebarWidth < RESIZE_GRIP_THRESHOLD_PX || presentationWidth < RESIZE_GRIP_THRESHOLD_PX;
}
