// Timer logic module - pure functions for timer state management

export function formatTime(minutes, seconds) {
    if (minutes === 0 && seconds > 0) return '<1';
    return String(Math.round(minutes + seconds / 60));
}

export function calculateActiveSegments(currentMinutes, currentSeconds, initialMinutes, initialSeconds, maxSegments = 12) {
    const currentTotalSeconds = currentMinutes * 60 + currentSeconds;
    const initialTotalSeconds = initialMinutes * 60 + initialSeconds;
    
    if (initialTotalSeconds === 0) return 0;
    
    const ratio = currentTotalSeconds / initialTotalSeconds;
    const activeSegments = Math.ceil(ratio * maxSegments);
    
    return Math.min(Math.max(activeSegments, 0), maxSegments);
}

export function decrementTime(minutes, seconds) {
    if (seconds === 0) {
        if (minutes === 0) {
            return { minutes: 0, seconds: 0, complete: true, resetInitial: true };
        }
        return { minutes: minutes - 1, seconds: 59, complete: false, resetInitial: false };
    }
    return { minutes, seconds: seconds - 1, complete: false, resetInitial: false };
}

export function addTime(minutes, seconds, addMinutes, initialMinutes, initialSeconds) {
    const newMinutes = minutes + addMinutes;
    
    // If timer was at 0, update initial time too
    if (minutes === 0 && seconds === 0) {
        return {
            minutes: newMinutes,
            seconds,
            initialMinutes: newMinutes,
            initialSeconds: seconds
        };
    }
    
    // Otherwise, add to both current and initial time
    return {
        minutes: newMinutes,
        seconds,
        initialMinutes: initialMinutes + addMinutes,
        initialSeconds
    };
}

export function resetTimer() {
    return {
        minutes: 0,
        seconds: 0,
        initialMinutes: 0,
        initialSeconds: 0,
        running: false
    };
}

export function setInitialTime(minutes, seconds) {
    return {
        initialMinutes: minutes,
        initialSeconds: seconds
    };
}

export function isTimerComplete(minutes, seconds) {
    return minutes === 0 && seconds === 0;
}
