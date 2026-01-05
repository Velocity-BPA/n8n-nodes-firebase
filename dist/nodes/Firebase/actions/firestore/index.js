"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocument = createDocument;
exports.getDocument = getDocument;
exports.listDocuments = listDocuments;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
exports.queryDocuments = queryDocuments;
exports.batchWrite = batchWrite;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Create a document in Firestore
 */
async function createDocument(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const documentId = this.getNodeParameter('documentId', index, '');
    const fieldsInput = this.getNodeParameter('fields', index, '{}');
    const fields = (0, helpers_1.parseJson)(fieldsInput);
    const firestoreFields = (0, helpers_1.toFirestoreFields)(fields);
    const query = {};
    if (documentId) {
        query.documentId = documentId;
    }
    const body = {
        fields: firestoreFields,
    };
    const response = await firebaseApi_1.firestoreRequest.call(this, 'POST', `/${collectionId}`, body, query);
    return [{ json: (0, helpers_1.fromFirestoreDocument)(response) }];
}
/**
 * Get a document from Firestore
 */
async function getDocument(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const documentId = this.getNodeParameter('documentId', index, '');
    const path = (0, helpers_1.buildDocumentPath)(collectionId, documentId);
    const response = await firebaseApi_1.firestoreRequest.call(this, 'GET', path);
    return [{ json: (0, helpers_1.fromFirestoreDocument)(response) }];
}
/**
 * List documents from Firestore collection
 */
async function listDocuments(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const pageSize = this.getNodeParameter('pageSize', index, 100);
    const pageToken = this.getNodeParameter('pageToken', index, '');
    const query = {
        pageSize,
    };
    if (pageToken) {
        query.pageToken = pageToken;
    }
    const response = await firebaseApi_1.firestoreRequest.call(this, 'GET', `/${collectionId}`, undefined, query);
    const documents = response.documents || [];
    const results = documents.map((doc) => (0, helpers_1.fromFirestoreDocument)(doc));
    return [
        {
            json: {
                documents: results,
                nextPageToken: response.nextPageToken || null,
            },
        },
    ];
}
/**
 * Update a document in Firestore
 */
async function updateDocument(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const documentId = this.getNodeParameter('documentId', index, '');
    const fieldsInput = this.getNodeParameter('fields', index, '{}');
    const updateMask = this.getNodeParameter('updateMask', index, '');
    const fields = (0, helpers_1.parseJson)(fieldsInput);
    const firestoreFields = (0, helpers_1.toFirestoreFields)(fields);
    const path = (0, helpers_1.buildDocumentPath)(collectionId, documentId);
    const query = {};
    if (updateMask) {
        // Convert comma-separated field names to update mask
        const fieldPaths = updateMask.split(',').map((f) => f.trim());
        query['updateMask.fieldPaths'] = fieldPaths;
    }
    else {
        // If no mask provided, update all fields in the input
        query['updateMask.fieldPaths'] = Object.keys(fields);
    }
    const body = {
        fields: firestoreFields,
    };
    const response = await firebaseApi_1.firestoreRequest.call(this, 'PATCH', path, body, query);
    return [{ json: (0, helpers_1.fromFirestoreDocument)(response) }];
}
/**
 * Delete a document from Firestore
 */
async function deleteDocument(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const documentId = this.getNodeParameter('documentId', index, '');
    const path = (0, helpers_1.buildDocumentPath)(collectionId, documentId);
    await firebaseApi_1.firestoreRequest.call(this, 'DELETE', path);
    return [
        {
            json: {
                success: true,
                collectionId,
                documentId,
                operation: 'delete',
            },
        },
    ];
}
/**
 * Run a query on Firestore
 */
async function queryDocuments(index) {
    const collectionId = this.getNodeParameter('collectionId', index, '');
    const filtersInput = this.getNodeParameter('filters', index, []);
    const orderByField = this.getNodeParameter('orderByField', index, '');
    const orderDirection = this.getNodeParameter('orderDirection', index, 'ASCENDING');
    const limit = this.getNodeParameter('limit', index, 0);
    const structuredQuery = {};
    // Build filters
    if (filtersInput && filtersInput.length > 0) {
        const filters = filtersInput.map((filter) => {
            return (0, helpers_1.buildFirestoreFilter)(filter.field, filter.operator, filter.value);
        });
        structuredQuery.where = (0, helpers_1.buildCompositeFilter)(filters);
    }
    // Build order by
    if (orderByField) {
        structuredQuery.orderBy = [
            {
                field: { fieldPath: orderByField },
                direction: orderDirection,
            },
        ];
    }
    // Build limit
    if (limit > 0) {
        structuredQuery.limit = limit;
    }
    const response = await firebaseApi_1.firestoreQuery.call(this, collectionId, structuredQuery);
    // Process results
    const results = [];
    for (const item of response) {
        if (item.document) {
            results.push((0, helpers_1.fromFirestoreDocument)(item.document));
        }
    }
    return [{ json: { documents: results, count: results.length } }];
}
/**
 * Batch write to Firestore
 */
async function batchWrite(index) {
    const writesInput = this.getNodeParameter('writes', index, []);
    const writes = writesInput.map((write) => {
        const operation = write.operation;
        const collectionId = write.collectionId;
        const documentId = write.documentId;
        if (operation === 'delete') {
            return {
                delete: `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}`,
            };
        }
        const fields = (0, helpers_1.parseJson)(write.fields || '{}');
        const firestoreFields = (0, helpers_1.toFirestoreFields)(fields);
        return {
            update: {
                name: `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}`,
                fields: firestoreFields,
            },
        };
    });
    const body = { writes };
    const response = await firebaseApi_1.firestoreRequest.call(this, 'POST', ':batchWrite', body);
    return [{ json: response }];
}
/**
 * Execute Firestore operation
 */
async function execute(operation, index) {
    switch (operation) {
        case 'createDocument':
            return createDocument.call(this, index);
        case 'getDocument':
            return getDocument.call(this, index);
        case 'listDocuments':
            return listDocuments.call(this, index);
        case 'updateDocument':
            return updateDocument.call(this, index);
        case 'deleteDocument':
            return deleteDocument.call(this, index);
        case 'query':
            return queryDocuments.call(this, index);
        case 'batchWrite':
            return batchWrite.call(this, index);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
//# sourceMappingURL=index.js.map