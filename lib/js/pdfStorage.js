// PDF persistence module - stores the last loaded PDF in IndexedDB.
// localStorage is limited to ~5 MB of strings, which is too small for many PDFs.

const DB_NAME = 'classtimer';
const STORE_NAME = 'files';
const PDF_KEY = 'pdf';

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB is not available'));
            return;
        }
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withStore(mode, operation) {
    const db = await openDB();
    try {
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, mode);
            const request = operation(tx.objectStore(STORE_NAME));
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

// data: ArrayBuffer. Returns true on success, false on failure (e.g. quota exceeded).
export async function savePDF(data, name) {
    try {
        await withStore('readwrite', (store) => store.put({ data, name }, PDF_KEY));
        return true;
    } catch (error) {
        console.error('Error saving PDF:', error);
        return false;
    }
}

// Returns { data: ArrayBuffer, name: string } or null.
export async function loadPDF() {
    try {
        const record = await withStore('readonly', (store) => store.get(PDF_KEY));
        return record || null;
    } catch (error) {
        console.error('Error loading PDF:', error);
        return null;
    }
}

export async function clearPDF() {
    try {
        await withStore('readwrite', (store) => store.delete(PDF_KEY));
        return true;
    } catch (error) {
        console.error('Error clearing PDF:', error);
        return false;
    }
}
