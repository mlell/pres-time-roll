// Student die logic module - pure functions for die state management

export function getRandomStudent(students) {
    if (students.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * students.length);
    return students[randomIndex];
}

export function parseStudentNames(text) {
    return text.split('\n')
        .map(name => name.trim())
        .filter(name => name !== '');
}

export function getDefaultStudents() {
    return ['Student 1', 'Student 2', 'Student 3', 'Student 4', 'Student 5'];
}

export function validateStudents(students) {
    return Array.isArray(students) && students.length > 0;
}

export function getFileBaseName(fileName) {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}
