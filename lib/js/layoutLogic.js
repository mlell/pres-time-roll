// Layout logic module - pure functions for sidebar sizing

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 500;

export function isSidebarWidthAllowed(width) {
    return width >= SIDEBAR_MIN_WIDTH && width <= SIDEBAR_MAX_WIDTH;
}
