"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = read;
exports.write = write;
exports.update = update;
exports.push = push;
exports.deleteData = deleteData;
exports.query = query;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Read data from the Realtime Database
 */
async function read(index) {
    const path = this.getNodeParameter('path', index, '');
    const shallow = this.getNodeParameter('shallow', index, false);
    const query = {};
    if (shallow) {
        query.shallow = 'true';
    }
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    const response = await firebaseApi_1.realtimeDatabaseRequest.call(this, 'GET', cleanPath, undefined, query);
    return [{ json: { data: response, path: cleanPath } }];
}
/**
 * Write data to the Realtime Database (overwrites)
 */
async function write(index) {
    const path = this.getNodeParameter('path', index, '');
    const dataInput = this.getNodeParameter('data', index, '');
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    const data = (0, helpers_1.parseJson)(dataInput);
    const response = await firebaseApi_1.realtimeDatabaseRequest.call(this, 'PUT', cleanPath, data);
    return [{ json: { data: response, path: cleanPath, operation: 'write' } }];
}
/**
 * Update data in the Realtime Database (merges)
 */
async function update(index) {
    const path = this.getNodeParameter('path', index, '');
    const dataInput = this.getNodeParameter('data', index, '');
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    const data = (0, helpers_1.parseJson)(dataInput);
    const response = await firebaseApi_1.realtimeDatabaseRequest.call(this, 'PATCH', cleanPath, data);
    return [{ json: { data: response, path: cleanPath, operation: 'update' } }];
}
/**
 * Push a new child to the Realtime Database
 */
async function push(index) {
    const path = this.getNodeParameter('path', index, '');
    const dataInput = this.getNodeParameter('data', index, '');
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    const data = (0, helpers_1.parseJson)(dataInput);
    const response = await firebaseApi_1.realtimeDatabaseRequest.call(this, 'POST', cleanPath, data);
    return [{ json: { ...response, path: cleanPath, operation: 'push' } }];
}
/**
 * Delete data from the Realtime Database
 */
async function deleteData(index) {
    const path = this.getNodeParameter('path', index, '');
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    await firebaseApi_1.realtimeDatabaseRequest.call(this, 'DELETE', cleanPath);
    return [{ json: { success: true, path: cleanPath, operation: 'delete' } }];
}
/**
 * Query data from the Realtime Database
 */
async function query(index) {
    const path = this.getNodeParameter('path', index, '');
    const orderBy = this.getNodeParameter('orderBy', index, '');
    const equalTo = this.getNodeParameter('equalTo', index, '');
    const startAt = this.getNodeParameter('startAt', index, '');
    const endAt = this.getNodeParameter('endAt', index, '');
    const limitToFirst = this.getNodeParameter('limitToFirst', index, 0);
    const limitToLast = this.getNodeParameter('limitToLast', index, 0);
    const cleanPath = (0, helpers_1.sanitizePath)(path);
    const queryParams = {};
    if (orderBy) {
        // orderBy must be quoted in the query
        queryParams.orderBy = `"${orderBy}"`;
    }
    if (equalTo) {
        // Determine if value is string, number, or boolean
        const parsed = parseQueryValue(equalTo);
        queryParams.equalTo = typeof parsed === 'string' ? `"${parsed}"` : parsed;
    }
    if (startAt) {
        const parsed = parseQueryValue(startAt);
        queryParams.startAt = typeof parsed === 'string' ? `"${parsed}"` : parsed;
    }
    if (endAt) {
        const parsed = parseQueryValue(endAt);
        queryParams.endAt = typeof parsed === 'string' ? `"${parsed}"` : parsed;
    }
    if (limitToFirst > 0) {
        queryParams.limitToFirst = limitToFirst;
    }
    if (limitToLast > 0) {
        queryParams.limitToLast = limitToLast;
    }
    const response = await firebaseApi_1.realtimeDatabaseRequest.call(this, 'GET', cleanPath, undefined, queryParams);
    return [{ json: { data: response, path: cleanPath, query: queryParams } }];
}
/**
 * Parse a query value to appropriate type
 */
function parseQueryValue(value) {
    // Check for boolean
    if (value.toLowerCase() === 'true')
        return true;
    if (value.toLowerCase() === 'false')
        return false;
    // Check for number
    const num = Number(value);
    if (!isNaN(num))
        return num;
    // Return as string
    return value;
}
/**
 * Execute Realtime Database operation
 */
async function execute(operation, index) {
    switch (operation) {
        case 'read':
            return read.call(this, index);
        case 'write':
            return write.call(this, index);
        case 'update':
            return update.call(this, index);
        case 'push':
            return push.call(this, index);
        case 'delete':
            return deleteData.call(this, index);
        case 'query':
            return query.call(this, index);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
//# sourceMappingURL=index.js.map