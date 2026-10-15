import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { savePDF, loadPDF, clearPDF } from '../pdfStorage.js';

// Minimal in-memory IndexedDB mock covering what pdfStorage.js uses:
// open (+ onupgradeneeded), transaction, objectStore put/get/delete, close.
function createIndexedDBMock() {
    const stores = {};
    const state = {
        failOpen: false,
        failTransaction: false,
        openCount: 0,
        closeCount: 0,
        stores
    };

    const later = (fn) => setTimeout(fn, 0);

    function makeObjectStore(data, tx) {
        const run = (fn) => {
            const request = { result: undefined };
            fn(request);
            tx._pending++;
            later(() => {
                tx._pending--;
                if (tx._pending === 0) tx._finish();
            });
            return request;
        };
        return {
            put: (value, key) => run((request) => {
                if (state.failTransaction) return;
                // Structured clone semantics: store a snapshot of the data.
                data.set(key, structuredClone(value));
                request.result = key;
            }),
            get: (key) => run((request) => {
                request.result = data.has(key) ? structuredClone(data.get(key)) : undefined;
            }),
            delete: (key) => run(() => {
                if (state.failTransaction) return;
                data.delete(key);
            })
        };
    }

    const db = {
        createObjectStore(name) {
            stores[name] = new Map();
        },
        transaction(storeName) {
            const tx = {
                _pending: 0,
                _finish() {
                    if (state.failTransaction) {
                        tx.error = new Error('QuotaExceededError');
                        tx.onabort && tx.onabort();
                    } else {
                        tx.oncomplete && tx.oncomplete();
                    }
                },
                objectStore: () => makeObjectStore(stores[storeName], tx)
            };
            return tx;
        },
        close() {
            state.closeCount++;
        }
    };

    state.indexedDB = {
        open() {
            state.openCount++;
            const request = { result: db };
            later(() => {
                if (state.failOpen) {
                    request.error = new Error('open failed');
                    request.onerror && request.onerror();
                    return;
                }
                if (!stores.files) {
                    request.onupgradeneeded && request.onupgradeneeded();
                }
                request.onsuccess && request.onsuccess();
            });
            return request;
        }
    };

    return state;
}

describe('PDF Storage', () => {
    let mock;
    let consoleErrorSpy;

    beforeEach(() => {
        mock = createIndexedDBMock();
        global.indexedDB = mock.indexedDB;
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        delete global.indexedDB;
        consoleErrorSpy.mockRestore();
    });

    const makeBuffer = (...bytes) => new Uint8Array(bytes).buffer;

    describe('loadPDF', () => {
        test('returns null when nothing has been saved', async () => {
            expect(await loadPDF()).toBeNull();
        });
    });

    describe('savePDF', () => {
        test('returns true and persists data and name', async () => {
            const result = await savePDF(makeBuffer(1, 2, 3), 'slides.pdf');
            expect(result).toBe(true);

            const saved = await loadPDF();
            expect(saved.name).toBe('slides.pdf');
            expect(Array.from(new Uint8Array(saved.data))).toEqual([1, 2, 3]);
        });

        test('replaces a previously saved PDF', async () => {
            await savePDF(makeBuffer(1), 'old.pdf');
            await savePDF(makeBuffer(9, 8), 'new.pdf');

            const saved = await loadPDF();
            expect(saved.name).toBe('new.pdf');
            expect(Array.from(new Uint8Array(saved.data))).toEqual([9, 8]);
        });

        test('closes the database connection after saving', async () => {
            await savePDF(makeBuffer(1), 'a.pdf');
            expect(mock.closeCount).toBe(mock.openCount);
        });

        test('returns false when the transaction fails (e.g. quota exceeded)', async () => {
            mock.failTransaction = true;
            const result = await savePDF(makeBuffer(1), 'big.pdf');
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mock.closeCount).toBe(mock.openCount);
        });

        test('returns false when the database cannot be opened', async () => {
            mock.failOpen = true;
            expect(await savePDF(makeBuffer(1), 'a.pdf')).toBe(false);
        });

        test('returns false when IndexedDB is unavailable', async () => {
            delete global.indexedDB;
            expect(await savePDF(makeBuffer(1), 'a.pdf')).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('loadPDF failures', () => {
        test('returns null when the database cannot be opened', async () => {
            mock.failOpen = true;
            expect(await loadPDF()).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('returns null when IndexedDB is unavailable', async () => {
            delete global.indexedDB;
            expect(await loadPDF()).toBeNull();
        });
    });

    describe('clearPDF', () => {
        test('removes a saved PDF', async () => {
            await savePDF(makeBuffer(1, 2), 'slides.pdf');
            expect(await clearPDF()).toBe(true);
            expect(await loadPDF()).toBeNull();
        });

        test('succeeds when nothing is saved', async () => {
            expect(await clearPDF()).toBe(true);
        });

        test('returns false when the database cannot be opened', async () => {
            mock.failOpen = true;
            expect(await clearPDF()).toBe(false);
        });

        test('returns false when IndexedDB is unavailable', async () => {
            delete global.indexedDB;
            expect(await clearPDF()).toBe(false);
        });
    });
});
