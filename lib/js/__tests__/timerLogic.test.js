import { describe, test, expect } from '@jest/globals';
import {
    formatTime,
    calculateActiveSegments,
    decrementTime,
    addTime,
    resetTimer,
    isTimerComplete,
    setInitialTime
} from '../timerLogic.js';

describe('Timer Logic', () => {
    describe('formatTime', () => {
        test('formats time correctly with single digits', () => {
            expect(formatTime(5, 3)).toBe('05:03');
        });

        test('formats time correctly with double digits', () => {
            expect(formatTime(12, 30)).toBe('12:30');
        });

        test('formats time correctly with zero', () => {
            expect(formatTime(0, 0)).toBe('00:00');
        });

        test('formats time correctly with zero seconds', () => {
            expect(formatTime(10, 0)).toBe('10:00');
        });

        test('formats time correctly with zero minutes', () => {
            expect(formatTime(0, 45)).toBe('00:45');
        });
    });

    describe('calculateActiveSegments', () => {
        test('returns 0 for zero time', () => {
            expect(calculateActiveSegments(0, 0, 0, 0)).toBe(0);
        });

        test('returns full segments when current equals initial', () => {
            expect(calculateActiveSegments(5, 0, 5, 0)).toBe(12);
        });

        test('returns proportional segments for half time', () => {
            expect(calculateActiveSegments(5, 0, 10, 0)).toBe(6);
        });

        test('returns proportional segments for quarter time', () => {
            expect(calculateActiveSegments(3, 0, 12, 0)).toBe(3);
        });

        test('returns 0 when initial time is 0', () => {
            expect(calculateActiveSegments(5, 0, 0, 0)).toBe(0);
        });

        test('caps at maximum segments (12)', () => {
            expect(calculateActiveSegments(15, 0, 10, 0)).toBe(12);
        });

        test('handles partial minutes correctly', () => {
            expect(calculateActiveSegments(5, 30, 10, 0)).toBe(7);
        });

        test('caps at maximum segments with custom max', () => {
            expect(calculateActiveSegments(10, 0, 10, 0, 8)).toBe(8);
        });
    });

    describe('decrementTime', () => {
        test('decrements seconds when seconds > 0', () => {
            expect(decrementTime(5, 30)).toEqual({
                minutes: 5,
                seconds: 29,
                complete: false,
                resetInitial: false
            });
        });

        test('decrements minutes when seconds = 0', () => {
            expect(decrementTime(5, 0)).toEqual({
                minutes: 4,
                seconds: 59,
                complete: false,
                resetInitial: false
            });
        });

        test('returns complete when time reaches 00:00', () => {
            expect(decrementTime(0, 0)).toEqual({
                minutes: 0,
                seconds: 0,
                complete: true,
                resetInitial: true
            });
        });

        test('handles single minute remaining', () => {
            expect(decrementTime(1, 0)).toEqual({
                minutes: 0,
                seconds: 59,
                complete: false,
                resetInitial: false
            });
        });

        test('handles single second remaining', () => {
            expect(decrementTime(0, 1)).toEqual({
                minutes: 0,
                seconds: 0,
                complete: false,
                resetInitial: false
            });
        });
    });

    describe('addTime', () => {
        test('adds minutes to current time when timer is running', () => {
            expect(addTime(5, 30, 3, 10, 0)).toEqual({
                minutes: 8,
                seconds: 30,
                initialMinutes: 13,
                initialSeconds: 0
            });
        });

        test('sets initial time when adding to zero time', () => {
            expect(addTime(0, 0, 5, 0, 0)).toEqual({
                minutes: 5,
                seconds: 0,
                initialMinutes: 5,
                initialSeconds: 0
            });
        });

        test('preserves seconds when adding minutes', () => {
            expect(addTime(10, 45, 1, 10, 45)).toEqual({
                minutes: 11,
                seconds: 45,
                initialMinutes: 11,
                initialSeconds: 45
            });
        });

        test('handles zero addition', () => {
            expect(addTime(5, 30, 0, 5, 30)).toEqual({
                minutes: 5,
                seconds: 30,
                initialMinutes: 5,
                initialSeconds: 30
            });
        });
    });

    describe('resetTimer', () => {
        test('resets timer to zero', () => {
            expect(resetTimer()).toEqual({
                minutes: 0,
                seconds: 0,
                initialMinutes: 0,
                initialSeconds: 0,
                running: false
            });
        });
    });

    describe('setInitialTime', () => {
        test('sets initial time correctly', () => {
            expect(setInitialTime(10, 30)).toEqual({
                initialMinutes: 10,
                initialSeconds: 30
            });
        });

        test('sets initial time to zero', () => {
            expect(setInitialTime(0, 0)).toEqual({
                initialMinutes: 0,
                initialSeconds: 0
            });
        });
    });

    describe('isTimerComplete', () => {
        test('returns true for 00:00', () => {
            expect(isTimerComplete(0, 0)).toBe(true);
        });

        test('returns false for time remaining', () => {
            expect(isTimerComplete(0, 1)).toBe(false);
        });

        test('returns false for minutes remaining', () => {
            expect(isTimerComplete(1, 0)).toBe(false);
        });

        test('returns false for both minutes and seconds', () => {
            expect(isTimerComplete(5, 30)).toBe(false);
        });
    });
});
