import { describe, test, expect } from '@jest/globals';
import { isSidebarWidthAllowed, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '../layoutLogic.js';

describe('Layout Logic', () => {
    describe('isSidebarWidthAllowed', () => {
        test('accepts widths inside the range', () => {
            expect(isSidebarWidthAllowed(300)).toBe(true);
        });

        test('accepts the minimum and maximum', () => {
            expect(isSidebarWidthAllowed(SIDEBAR_MIN_WIDTH)).toBe(true);
            expect(isSidebarWidthAllowed(SIDEBAR_MAX_WIDTH)).toBe(true);
        });

        test('rejects widths below the minimum', () => {
            expect(isSidebarWidthAllowed(SIDEBAR_MIN_WIDTH - 1)).toBe(false);
        });

        test('rejects widths above the maximum', () => {
            expect(isSidebarWidthAllowed(SIDEBAR_MAX_WIDTH + 1)).toBe(false);
        });
    });
});
