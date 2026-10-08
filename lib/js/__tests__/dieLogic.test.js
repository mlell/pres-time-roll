import { describe, test, expect } from '@jest/globals';
import {
    getRandomStudent,
    parseStudentNames,
    getDefaultStudents,
    validateStudents,
    getFileBaseName
} from '../dieLogic.js';

describe('Die Logic', () => {
    describe('getFileBaseName', () => {
        test('strips the extension', () => {
            expect(getFileBaseName('class3b.txt')).toBe('class3b');
        });

        test('strips only the last extension', () => {
            expect(getFileBaseName('period.2.names.txt')).toBe('period.2.names');
        });

        test('returns the name unchanged when there is no extension', () => {
            expect(getFileBaseName('students')).toBe('students');
        });

        test('does not treat a leading dot as an extension', () => {
            expect(getFileBaseName('.hidden')).toBe('.hidden');
        });
    });
    describe('getRandomStudent', () => {
        test('returns a student from the list', () => {
            const students = ['Alice', 'Bob', 'Charlie'];
            const result = getRandomStudent(students);
            expect(students).toContain(result);
        });

        test('returns null for empty array', () => {
            expect(getRandomStudent([])).toBeNull();
        });

        test('returns the only student for single-element array', () => {
            const students = ['Alice'];
            expect(getRandomStudent(students)).toBe('Alice');
        });

        test('returns a student from larger list', () => {
            const students = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
            const result = getRandomStudent(students);
            expect(students).toContain(result);
        });
    });

    describe('parseStudentNames', () => {
        test('parses names separated by newlines', () => {
            const text = 'Alice\nBob\nCharlie';
            expect(parseStudentNames(text)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        test('trims whitespace from names', () => {
            const text = '  Alice  \n  Bob  \n  Charlie  ';
            expect(parseStudentNames(text)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        test('filters out empty lines', () => {
            const text = 'Alice\n\nBob\n\n\nCharlie';
            expect(parseStudentNames(text)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        test('handles single name', () => {
            const text = 'Alice';
            expect(parseStudentNames(text)).toEqual(['Alice']);
        });

        test('handles empty string', () => {
            expect(parseStudentNames('')).toEqual([]);
        });

        test('handles only whitespace', () => {
            expect(parseStudentNames('  \n  \n  ')).toEqual([]);
        });

        test('handles names with extra spaces', () => {
            const text = 'Alice Smith\nBob Johnson\nCharlie Brown';
            expect(parseStudentNames(text)).toEqual(['Alice Smith', 'Bob Johnson', 'Charlie Brown']);
        });
    });

    describe('getDefaultStudents', () => {
        test('returns array of 5 default students', () => {
            const result = getDefaultStudents();
            expect(result).toHaveLength(5);
        });

        test('returns student names in correct format', () => {
            const result = getDefaultStudents();
            expect(result[0]).toBe('Student 1');
            expect(result[4]).toBe('Student 5');
        });

        test('returns consistent results', () => {
            const result1 = getDefaultStudents();
            const result2 = getDefaultStudents();
            expect(result1).toEqual(result2);
        });
    });

    describe('validateStudents', () => {
        test('returns true for valid non-empty array', () => {
            expect(validateStudents(['Alice', 'Bob'])).toBe(true);
        });

        test('returns false for empty array', () => {
            expect(validateStudents([])).toBe(false);
        });

        test('returns false for non-array', () => {
            expect(validateStudents('not an array')).toBe(false);
        });

        test('returns false for null', () => {
            expect(validateStudents(null)).toBe(false);
        });

        test('returns false for undefined', () => {
            expect(validateStudents(undefined)).toBe(false);
        });

        test('returns true for single-element array', () => {
            expect(validateStudents(['Alice'])).toBe(true);
        });

        test('returns false for array with empty strings', () => {
            expect(validateStudents([''])).toBe(true); // Still valid array
        });
    });
});
