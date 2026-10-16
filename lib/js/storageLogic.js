// Storage logic module - functions for localStorage operations

export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

export function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return null;
    }
}

export function clearStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
}

export function createStorageData(timerMinutes, timerSeconds, timerRunning, students, sidebarWidth, initialTimerMinutes, initialTimerSeconds, studentFileName, remarkContent, remarkFileName, pageNum) {
    return {
        timerMinutes,
        timerSeconds,
        timerRunning,
        students,
        sidebarWidth,
        initialTimerMinutes,
        initialTimerSeconds,
        studentFileName,
        remarkContent,
        remarkFileName,
        pageNum
    };
}
