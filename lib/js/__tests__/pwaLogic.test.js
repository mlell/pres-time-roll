import { describe, test, expect, jest } from '@jest/globals';
import { registerServiceWorker } from '../pwaLogic.js';

describe('PWA Logic', () => {
    test('registers the service worker for secure origins', async () => {
        const register = jest.fn(() => Promise.resolve());
        const previousNavigator = globalThis.navigator;

        Object.defineProperty(globalThis, 'navigator', {
            value: {
                serviceWorker: { register },
                userAgent: 'test-agent',
            },
            configurable: true,
        });

        Object.defineProperty(window, 'location', {
            value: { protocol: 'https:' },
            configurable: true,
        });

        const result = registerServiceWorker();
        expect(result).toBe(true);
        expect(register).toHaveBeenCalledWith('./sw.js', { scope: './' });

        Object.defineProperty(globalThis, 'navigator', {
            value: previousNavigator,
            configurable: true,
        });
    });

    test('skips registration on unsupported protocols', () => {
        const register = jest.fn(() => Promise.resolve());
        const previousNavigator = globalThis.navigator;

        Object.defineProperty(globalThis, 'navigator', {
            value: {
                serviceWorker: { register },
            },
            configurable: true,
        });

        Object.defineProperty(window, 'location', {
            value: { protocol: 'file:' },
            configurable: true,
        });

        expect(registerServiceWorker()).toBe(false);
        expect(register).not.toHaveBeenCalled();

        Object.defineProperty(globalThis, 'navigator', {
            value: previousNavigator,
            configurable: true,
        });
    });
});
