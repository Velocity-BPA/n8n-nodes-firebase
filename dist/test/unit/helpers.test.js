"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../nodes/Firebase/utils/helpers");
describe('Helper Functions', () => {
    describe('toFirestoreValue', () => {
        it('should convert string values', () => {
            const result = (0, helpers_1.toFirestoreValue)('hello');
            expect(result).toEqual({ stringValue: 'hello' });
        });
        it('should convert integer values', () => {
            const result = (0, helpers_1.toFirestoreValue)(42);
            expect(result).toEqual({ integerValue: '42' });
        });
        it('should convert float values', () => {
            const result = (0, helpers_1.toFirestoreValue)(3.14);
            expect(result).toEqual({ doubleValue: 3.14 });
        });
        it('should convert boolean values', () => {
            expect((0, helpers_1.toFirestoreValue)(true)).toEqual({ booleanValue: true });
            expect((0, helpers_1.toFirestoreValue)(false)).toEqual({ booleanValue: false });
        });
        it('should convert null values', () => {
            const result = (0, helpers_1.toFirestoreValue)(null);
            expect(result).toEqual({ nullValue: null });
        });
        it('should convert array values', () => {
            const result = (0, helpers_1.toFirestoreValue)([1, 'two', true]);
            expect(result).toEqual({
                arrayValue: {
                    values: [
                        { integerValue: '1' },
                        { stringValue: 'two' },
                        { booleanValue: true },
                    ],
                },
            });
        });
        it('should convert object values', () => {
            const result = (0, helpers_1.toFirestoreValue)({ name: 'test', age: 25 });
            expect(result).toEqual({
                mapValue: {
                    fields: {
                        name: { stringValue: 'test' },
                        age: { integerValue: '25' },
                    },
                },
            });
        });
        it('should convert Date objects to timestamp', () => {
            const date = new Date('2024-01-15T10:30:00.000Z');
            const result = (0, helpers_1.toFirestoreValue)(date);
            expect(result).toEqual({ timestampValue: '2024-01-15T10:30:00.000Z' });
        });
    });
    describe('fromFirestoreValue', () => {
        it('should convert string values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({ stringValue: 'hello' });
            expect(result).toBe('hello');
        });
        it('should convert integer values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({ integerValue: '42' });
            expect(result).toBe(42);
        });
        it('should convert double values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({ doubleValue: 3.14 });
            expect(result).toBe(3.14);
        });
        it('should convert boolean values', () => {
            expect((0, helpers_1.fromFirestoreValue)({ booleanValue: true })).toBe(true);
            expect((0, helpers_1.fromFirestoreValue)({ booleanValue: false })).toBe(false);
        });
        it('should convert null values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({ nullValue: null });
            expect(result).toBeNull();
        });
        it('should convert array values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({
                arrayValue: {
                    values: [
                        { integerValue: '1' },
                        { stringValue: 'two' },
                        { booleanValue: true },
                    ],
                },
            });
            expect(result).toEqual([1, 'two', true]);
        });
        it('should convert map values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({
                mapValue: {
                    fields: {
                        name: { stringValue: 'test' },
                        age: { integerValue: '25' },
                    },
                },
            });
            expect(result).toEqual({ name: 'test', age: 25 });
        });
        it('should convert timestamp values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({
                timestampValue: '2024-01-15T10:30:00.000Z',
            });
            expect(result).toEqual(new Date('2024-01-15T10:30:00.000Z'));
        });
        it('should convert geoPoint values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({
                geoPointValue: { latitude: 37.7749, longitude: -122.4194 },
            });
            expect(result).toEqual({ latitude: 37.7749, longitude: -122.4194 });
        });
        it('should convert reference values', () => {
            const result = (0, helpers_1.fromFirestoreValue)({
                referenceValue: 'projects/my-project/databases/(default)/documents/users/123',
            });
            expect(result).toBe('projects/my-project/databases/(default)/documents/users/123');
        });
    });
    describe('parseJson', () => {
        it('should parse valid JSON string', () => {
            const result = (0, helpers_1.parseJson)('{"key": "value"}');
            expect(result).toEqual({ key: 'value' });
        });
        it('should handle nested JSON', () => {
            const json = '{"user": {"name": "John", "age": 30}}';
            const result = (0, helpers_1.parseJson)(json);
            expect(result).toEqual({ user: { name: 'John', age: 30 } });
        });
        it('should throw error for invalid JSON', () => {
            expect(() => (0, helpers_1.parseJson)('invalid')).toThrow();
        });
    });
    describe('sanitizePath', () => {
        it('should remove leading slashes', () => {
            expect((0, helpers_1.sanitizePath)('/users/123')).toBe('users/123');
        });
        it('should remove trailing slashes', () => {
            expect((0, helpers_1.sanitizePath)('users/123/')).toBe('users/123');
        });
        it('should remove both leading and trailing slashes', () => {
            expect((0, helpers_1.sanitizePath)('/users/123/')).toBe('users/123');
        });
        it('should handle paths without slashes', () => {
            expect((0, helpers_1.sanitizePath)('users')).toBe('users');
        });
        it('should handle empty strings', () => {
            expect((0, helpers_1.sanitizePath)('')).toBe('');
        });
        it('should preserve internal slashes', () => {
            expect((0, helpers_1.sanitizePath)('/users/123/posts/456/')).toBe('users/123/posts/456');
        });
    });
    describe('isValidEmail', () => {
        it('should validate correct email addresses', () => {
            expect((0, helpers_1.isValidEmail)('test@example.com')).toBe(true);
            expect((0, helpers_1.isValidEmail)('user.name@domain.co.uk')).toBe(true);
            expect((0, helpers_1.isValidEmail)('user+tag@example.org')).toBe(true);
        });
        it('should reject invalid email addresses', () => {
            expect((0, helpers_1.isValidEmail)('invalid')).toBe(false);
            expect((0, helpers_1.isValidEmail)('invalid@')).toBe(false);
            expect((0, helpers_1.isValidEmail)('@example.com')).toBe(false);
            expect((0, helpers_1.isValidEmail)('test@.com')).toBe(false);
        });
    });
    describe('isValidPhoneNumber', () => {
        it('should validate E.164 format phone numbers', () => {
            expect((0, helpers_1.isValidPhoneNumber)('+14155551234')).toBe(true);
            expect((0, helpers_1.isValidPhoneNumber)('+442071234567')).toBe(true);
            expect((0, helpers_1.isValidPhoneNumber)('+8613812345678')).toBe(true);
        });
        it('should reject invalid phone numbers', () => {
            expect((0, helpers_1.isValidPhoneNumber)('4155551234')).toBe(false);
            expect((0, helpers_1.isValidPhoneNumber)('+1234')).toBe(false);
            expect((0, helpers_1.isValidPhoneNumber)('invalid')).toBe(false);
        });
    });
    describe('fromFirestoreDocument', () => {
        it('should convert a Firestore document', () => {
            const doc = {
                name: 'projects/test/databases/(default)/documents/users/123',
                fields: {
                    name: { stringValue: 'John' },
                    age: { integerValue: '30' },
                },
                createTime: '2024-01-15T10:00:00Z',
                updateTime: '2024-01-15T11:00:00Z',
            };
            const result = (0, helpers_1.fromFirestoreDocument)(doc);
            expect(result._id).toBe('123');
            expect(result._path).toBe('projects/test/databases/(default)/documents/users/123');
            expect(result.name).toBe('John');
            expect(result.age).toBe(30);
            expect(result._createTime).toBe('2024-01-15T10:00:00Z');
            expect(result._updateTime).toBe('2024-01-15T11:00:00Z');
        });
        it('should handle documents without fields', () => {
            const doc = {
                name: 'projects/test/databases/(default)/documents/users/456',
            };
            const result = (0, helpers_1.fromFirestoreDocument)(doc);
            expect(result._id).toBe('456');
            expect(result._path).toBe('projects/test/databases/(default)/documents/users/456');
        });
    });
    describe('buildFirestoreFilter', () => {
        it('should build equality filter', () => {
            const result = (0, helpers_1.buildFirestoreFilter)('status', '==', 'active');
            expect(result).toEqual({
                fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'active' },
                },
            });
        });
        it('should build less than filter', () => {
            const result = (0, helpers_1.buildFirestoreFilter)('age', '<', 30);
            expect(result).toEqual({
                fieldFilter: {
                    field: { fieldPath: 'age' },
                    op: 'LESS_THAN',
                    value: { integerValue: '30' },
                },
            });
        });
        it('should build array-contains filter', () => {
            const result = (0, helpers_1.buildFirestoreFilter)('tags', 'array-contains', 'featured');
            expect(result).toEqual({
                fieldFilter: {
                    field: { fieldPath: 'tags' },
                    op: 'ARRAY_CONTAINS',
                    value: { stringValue: 'featured' },
                },
            });
        });
    });
    describe('buildCompositeFilter', () => {
        it('should return single filter unchanged', () => {
            const filter = {
                fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'active' },
                },
            };
            const result = (0, helpers_1.buildCompositeFilter)([filter]);
            expect(result).toEqual(filter);
        });
        it('should build composite AND filter for multiple filters', () => {
            const filter1 = (0, helpers_1.buildFirestoreFilter)('status', '==', 'active');
            const filter2 = (0, helpers_1.buildFirestoreFilter)('age', '>=', 18);
            const result = (0, helpers_1.buildCompositeFilter)([filter1, filter2]);
            expect(result).toEqual({
                compositeFilter: {
                    op: 'AND',
                    filters: [filter1, filter2],
                },
            });
        });
        it('should support OR operator', () => {
            const filter1 = (0, helpers_1.buildFirestoreFilter)('status', '==', 'active');
            const filter2 = (0, helpers_1.buildFirestoreFilter)('status', '==', 'pending');
            const result = (0, helpers_1.buildCompositeFilter)([filter1, filter2], 'OR');
            expect(result).toEqual({
                compositeFilter: {
                    op: 'OR',
                    filters: [filter1, filter2],
                },
            });
        });
    });
});
//# sourceMappingURL=helpers.test.js.map