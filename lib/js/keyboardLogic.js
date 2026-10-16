// Keyboard logic module - pure functions that map key presses to presenter actions

export const PAGE_KEY_DELTAS = {
    ' ': 1,
    'Enter': 1,
    'ArrowRight': 1,
    'PageDown': 1,
    'Backspace': -1,
    'ArrowLeft': -1,
    'PageUp': -1,
};

export function resolveKeyAction({ key, ctrlKey, metaKey, altKey, isEditableTarget }, hasRemark) {
    if (ctrlKey || metaKey || altKey) return null;
    if (isEditableTarget) return null;

    if (key === 'c' || key === 'C' || key === 'p' || key === 'P') {
        return hasRemark ? { type: 'openRemark' } : null;
    }

    if (!Object.hasOwn(PAGE_KEY_DELTAS, key)) return null;
    return { type: 'page', delta: PAGE_KEY_DELTAS[key] };
}
