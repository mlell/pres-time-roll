import { describe, test, expect } from '@jest/globals';
import {
    getTargetPage,
    getNavState,
    shouldRestorePDF,
    getFitScale,
    isRenderableScale,
    getCanvasPixelSize,
} from '../pdfLogic.js';

describe('PDF Logic', () => {
    describe('getTargetPage', () => {
        test('moves forward one page', () => {
            expect(getTargetPage(2, 1, 5)).toBe(3);
        });

        test('moves back one page', () => {
            expect(getTargetPage(2, -1, 5)).toBe(1);
        });

        test('returns null before the first page', () => {
            expect(getTargetPage(1, -1, 5)).toBeNull();
        });

        test('returns null after the last page', () => {
            expect(getTargetPage(5, 1, 5)).toBeNull();
        });

        test('allows the last page', () => {
            expect(getTargetPage(4, 1, 5)).toBe(5);
        });
    });

    describe('getNavState', () => {
        test('disables previous on the first page', () => {
            expect(getNavState({ hasPdf: true, pageNum: 1, numPages: 3, hasRemark: false }))
                .toEqual({ prevDisabled: true, nextDisabled: false });
        });

        test('disables next on the last page', () => {
            expect(getNavState({ hasPdf: true, pageNum: 3, numPages: 3, hasRemark: false }))
                .toEqual({ prevDisabled: false, nextDisabled: true });
        });

        test('enables both in the middle of a PDF', () => {
            expect(getNavState({ hasPdf: true, pageNum: 2, numPages: 3, hasRemark: false }))
                .toEqual({ prevDisabled: false, nextDisabled: false });
        });

        test('enables both for a remark presentation', () => {
            expect(getNavState({ hasPdf: false, pageNum: 1, numPages: 0, hasRemark: true }))
                .toEqual({ prevDisabled: false, nextDisabled: false });
        });

        test('disables both when nothing is loaded', () => {
            expect(getNavState({ hasPdf: false, pageNum: 1, numPages: 0, hasRemark: false }))
                .toEqual({ prevDisabled: true, nextDisabled: true });
        });
    });

    describe('shouldRestorePDF', () => {
        test('restores a saved PDF when nothing else is loaded', () => {
            expect(shouldRestorePDF({ hasRemark: false, hasSavedPDF: true, hasPdf: false })).toBe(true);
        });

        test('does not restore when there is no saved PDF', () => {
            expect(shouldRestorePDF({ hasRemark: false, hasSavedPDF: false, hasPdf: false })).toBe(false);
        });

        test('does not restore over a remark presentation', () => {
            expect(shouldRestorePDF({ hasRemark: true, hasSavedPDF: true, hasPdf: false })).toBe(false);
        });

        test('does not restore over a PDF that is already open', () => {
            expect(shouldRestorePDF({ hasRemark: false, hasSavedPDF: true, hasPdf: true })).toBe(false);
        });
    });

    describe('getFitScale', () => {
        test('fits a page to the limiting dimension', () => {
            expect(getFitScale(600, 800, 300, 800)).toBe(0.5);
        });

        test('scales up a small page', () => {
            expect(getFitScale(100, 100, 400, 200)).toBe(2);
        });

        test('returns zero for a hidden container', () => {
            expect(getFitScale(600, 800, 0, 0)).toBe(0);
        });
    });

    describe('isRenderableScale', () => {
        test('accepts a positive scale', () => {
            expect(isRenderableScale(0.5)).toBe(true);
        });

        test('rejects zero', () => {
            expect(isRenderableScale(0)).toBe(false);
        });

        test('rejects NaN', () => {
            expect(isRenderableScale(NaN)).toBe(false);
        });
    });

    describe('getCanvasPixelSize', () => {
        test('scales the viewport by device pixel ratio', () => {
            expect(getCanvasPixelSize(300, 400, 2)).toEqual({ width: 600, height: 800 });
        });

        test('floors fractional pixel sizes', () => {
            expect(getCanvasPixelSize(300.7, 400.2, 1.5)).toEqual({ width: 451, height: 600 });
        });
    });
});
