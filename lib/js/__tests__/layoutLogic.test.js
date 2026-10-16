import { describe, test, expect } from '@jest/globals';
import { isSidebarWidthAllowed, shouldShowResizeGrip, snapSidebarWidth, SIDEBAR_MAX_WIDTH } from '../layoutLogic.js';

describe('Layout Logic', () => {
    describe('isSidebarWidthAllowed', () => {
        test('accepts widths inside the range', () => {
            expect(isSidebarWidthAllowed(300)).toBe(true);
        });

        test('accepts zero and the maximum', () => {
            expect(isSidebarWidthAllowed(0)).toBe(true);
            expect(isSidebarWidthAllowed(SIDEBAR_MAX_WIDTH)).toBe(true);
        });

        test('rejects negative widths', () => {
            expect(isSidebarWidthAllowed(-1)).toBe(false);
        });

        test('rejects widths above the maximum', () => {
            expect(isSidebarWidthAllowed(SIDEBAR_MAX_WIDTH + 1)).toBe(false);
        });
    });

    describe('snapSidebarWidth', () => {
        test('keeps widths of 10px and above', () => {
            expect(snapSidebarWidth(10)).toBe(10);
            expect(snapSidebarWidth(300)).toBe(300);
        });

        test('collapses widths below 10px to 0', () => {
            expect(snapSidebarWidth(9.5)).toBe(0);
            expect(snapSidebarWidth(0)).toBe(0);
        });

        test('collapses negative widths to 0', () => {
            expect(snapSidebarWidth(-40)).toBe(0);
        });
    });

    describe('shouldShowResizeGrip', () => {
        test('hides the grip on non-touch devices when both panes are wide enough', () => {
            expect(shouldShowResizeGrip({ isTouch: false, sidebarWidth: 300, presentationWidth: 500 })).toBe(false);
        });

        test('shows the grip on touch devices', () => {
            expect(shouldShowResizeGrip({ isTouch: true, sidebarWidth: 300, presentationWidth: 500 })).toBe(true);
        });

        test('shows the grip when the presentation is narrower than 10px', () => {
            expect(shouldShowResizeGrip({ isTouch: false, sidebarWidth: 300, presentationWidth: 9 })).toBe(true);
        });

        test('shows the grip when the sidebar is narrower than 10px', () => {
            expect(shouldShowResizeGrip({ isTouch: false, sidebarWidth: 0, presentationWidth: 500 })).toBe(true);
        });

        test('treats exactly 10px as wide enough', () => {
            expect(shouldShowResizeGrip({ isTouch: false, sidebarWidth: 10, presentationWidth: 10 })).toBe(false);
        });
    });
});
