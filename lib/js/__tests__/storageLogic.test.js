import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    createStorageData
} from '../storageLogic.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = String(value);
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

describe('Storage Logic', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('saveToStorage', () => {
        test('saves data to localStorage', () => {
            const data = { key: 'value' };
            const result = saveToStorage('testKey', data);
            expect(result).toBe(true);
            expect(localStorage.getItem('testKey')).toBe(JSON.stringify(data));
        });

        test('saves complex data to localStorage', () => {
            const data = {
                timerMinutes: 5,
                timerSeconds: 30,
                students: ['Alice', 'Bob']
            };
            const result = saveToStorage('classtimer', data);
            expect(result).toBe(true);
            const loaded = JSON.parse(localStorage.getItem('classtimer'));
            expect(loaded).toEqual(data);
        });

        test('returns true on successful save', () => {
            const result = saveToStorage('test', { data: 'test' });
            expect(result).toBe(true);
        });
    });

    describe('loadFromStorage', () => {
        test('loads data from localStorage', () => {
            const data = { key: 'value' };
            localStorage.setItem('testKey', JSON.stringify(data));
            const result = loadFromStorage('testKey');
            expect(result).toEqual(data);
        });

        test('returns null for non-existent key', () => {
            const result = loadFromStorage('nonExistentKey');
            expect(result).toBeNull();
        });

        test('returns null for empty localStorage', () => {
            const result = loadFromStorage('anyKey');
            expect(result).toBeNull();
        });

        test('parses JSON correctly', () => {
            const data = { number: 42, string: 'test', array: [1, 2, 3] };
            localStorage.setItem('test', JSON.stringify(data));
            const result = loadFromStorage('test');
            expect(result).toEqual(data);
        });
    });

    describe('clearStorage', () => {
        test('removes data from localStorage', () => {
            localStorage.setItem('testKey', 'testValue');
            const result = clearStorage('testKey');
            expect(result).toBe(true);
            expect(localStorage.getItem('testKey')).toBeNull();
        });

        test('returns true when clearing non-existent key', () => {
            const result = clearStorage('nonExistentKey');
            expect(result).toBe(true);
        });

        test('returns true on successful clear', () => {
            localStorage.setItem('test', 'value');
            const result = clearStorage('test');
            expect(result).toBe(true);
        });
    });

    describe('createStorageData', () => {
        test('creates storage data object with all fields', () => {
            const data = createStorageData(5, 30, true, ['Alice', 'Bob'], '300px', 10, 0);
            expect(data).toEqual({
                timerMinutes: 5,
                timerSeconds: 30,
                timerRunning: true,
                students: ['Alice', 'Bob'],
                sidebarWidth: '300px',
                initialTimerMinutes: 10,
                initialTimerSeconds: 0
            });
        });

        test('handles zero values', () => {
            const data = createStorageData(0, 0, false, [], '200px', 0, 0);
            expect(data).toEqual({
                timerMinutes: 0,
                timerSeconds: 0,
                timerRunning: false,
                students: [],
                sidebarWidth: '200px',
                initialTimerMinutes: 0,
                initialTimerSeconds: 0
            });
        });

        test('handles null sidebar width', () => {
            const data = createStorageData(10, 45, false, ['Student'], null, 10, 45);
            expect(data).toEqual({
                timerMinutes: 10,
                timerSeconds: 45,
                timerRunning: false,
                students: ['Student'],
                sidebarWidth: null,
                initialTimerMinutes: 10,
                initialTimerSeconds: 45
            });
        });

        test('handles empty string sidebar width', () => {
            const data = createStorageData(1, 0, true, ['A', 'B'], '', 1, 0);
            expect(data).toEqual({
                timerMinutes: 1,
                timerSeconds: 0,
                timerRunning: true,
                students: ['A', 'B'],
                sidebarWidth: '',
                initialTimerMinutes: 1,
                initialTimerSeconds: 0
            });
        });
    });

    describe('Integration: save and load', () => {
        test('round-trip data preservation', () => {
            const originalData = {
                timerMinutes: 7,
                timerSeconds: 15,
                timerRunning: true,
                students: ['Alice', 'Bob', 'Charlie'],
                sidebarWidth: '350px',
                initialTimerMinutes: 10,
                initialTimerSeconds: 0
            };
            
            saveToStorage('classtimer', originalData);
            const loadedData = loadFromStorage('classtimer');
            
            expect(loadedData).toEqual(originalData);
        });

        test('multiple keys do not interfere', () => {
            const data1 = { key: 'value1' };
            const data2 = { key: 'value2' };
            
            saveToStorage('key1', data1);
            saveToStorage('key2', data2);
            
            expect(loadFromStorage('key1')).toEqual(data1);
            expect(loadFromStorage('key2')).toEqual(data2);
        });
    });
});
