import { describe, test, expect } from '@jest/globals';
import { resolveKeyAction } from '../keyboardLogic.js';

const press = (key, overrides = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isEditableTarget: false,
    ...overrides,
});

describe('Keyboard Logic', () => {
    describe('page keys', () => {
        test.each([
            [' ', 1],
            ['Enter', 1],
            ['ArrowRight', 1],
            ['PageDown', 1],
            ['Backspace', -1],
            ['ArrowLeft', -1],
            ['PageUp', -1],
        ])('maps %p to a page delta of %p', (key, delta) => {
            expect(resolveKeyAction(press(key), false)).toEqual({ type: 'page', delta });
        });

        test('ignores unrelated keys', () => {
            expect(resolveKeyAction(press('a'), false)).toBeNull();
        });

        test('ignores prototype property names', () => {
            expect(resolveKeyAction(press('constructor'), false)).toBeNull();
        });
    });

    describe('remark shortcuts', () => {
        test.each(['c', 'C', 'p', 'P'])('opens the remark window for %p when a remark is loaded', (key) => {
            expect(resolveKeyAction(press(key), true)).toEqual({ type: 'openRemark' });
        });

        test.each(['c', 'C', 'p', 'P'])('does nothing for %p when no remark is loaded', (key) => {
            expect(resolveKeyAction(press(key), false)).toBeNull();
        });
    });

    describe('suppressed input', () => {
        test.each([
            { ctrlKey: true },
            { metaKey: true },
            { altKey: true },
        ])('ignores page keys with modifier %p', (modifier) => {
            expect(resolveKeyAction(press('ArrowRight', modifier), false)).toBeNull();
        });

        test('ignores remark shortcuts with a modifier', () => {
            expect(resolveKeyAction(press('c', { ctrlKey: true }), true)).toBeNull();
        });

        test('ignores keys typed into editable fields', () => {
            expect(resolveKeyAction(press(' ', { isEditableTarget: true }), false)).toBeNull();
        });

        test('ignores remark shortcuts typed into editable fields', () => {
            expect(resolveKeyAction(press('p', { isEditableTarget: true }), true)).toBeNull();
        });
    });
});
