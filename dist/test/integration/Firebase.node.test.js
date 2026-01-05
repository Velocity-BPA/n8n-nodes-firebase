"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Firebase_node_1 = require("../../nodes/Firebase/Firebase.node");
describe('Firebase Node Integration', () => {
    let firebaseNode;
    beforeEach(() => {
        firebaseNode = new Firebase_node_1.Firebase();
    });
    describe('Node Configuration', () => {
        it('should have correct node metadata', () => {
            expect(firebaseNode.description.displayName).toBe('Firebase');
            expect(firebaseNode.description.name).toBe('firebase');
            expect(firebaseNode.description.group).toContain('transform');
            expect(firebaseNode.description.version).toBe(1);
        });
        it('should have correct icon', () => {
            expect(firebaseNode.description.icon).toBe('file:firebase.svg');
        });
        it('should require Firebase API credentials', () => {
            expect(firebaseNode.description.credentials).toEqual([
                {
                    name: 'firebaseApi',
                    required: true,
                },
            ]);
        });
        it('should have all 7 resources', () => {
            const resourceProperty = firebaseNode.description.properties.find((p) => p.name === 'resource');
            expect(resourceProperty).toBeDefined();
            expect(resourceProperty?.options).toHaveLength(7);
            const resourceNames = (resourceProperty?.options).map((o) => o.value);
            expect(resourceNames).toContain('realtimeDatabase');
            expect(resourceNames).toContain('firestore');
            expect(resourceNames).toContain('auth');
            expect(resourceNames).toContain('messaging');
            expect(resourceNames).toContain('remoteConfig');
            expect(resourceNames).toContain('dynamicLinks');
            expect(resourceNames).toContain('storage');
        });
    });
    describe('Realtime Database Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('realtimeDatabase'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('read');
            expect(operations).toContain('write');
            expect(operations).toContain('update');
            expect(operations).toContain('push');
            expect(operations).toContain('delete');
            expect(operations).toContain('query');
        });
    });
    describe('Firestore Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('firestore'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('createDocument');
            expect(operations).toContain('getDocument');
            expect(operations).toContain('listDocuments');
            expect(operations).toContain('updateDocument');
            expect(operations).toContain('deleteDocument');
            expect(operations).toContain('query');
            expect(operations).toContain('batchWrite');
        });
    });
    describe('Authentication Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('auth'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('createUser');
            expect(operations).toContain('getUser');
            expect(operations).toContain('getUserByEmail');
            expect(operations).toContain('listUsers');
            expect(operations).toContain('updateUser');
            expect(operations).toContain('deleteUser');
            expect(operations).toContain('generatePasswordResetLink');
            expect(operations).toContain('generateEmailVerificationLink');
            expect(operations).toContain('setCustomClaims');
            expect(operations).toContain('revokeRefreshTokens');
        });
    });
    describe('Cloud Messaging Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('messaging'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('sendMessage');
            expect(operations).toContain('sendMulticast');
            expect(operations).toContain('sendToTopic');
            expect(operations).toContain('sendToCondition');
            expect(operations).toContain('subscribeToTopic');
            expect(operations).toContain('unsubscribeFromTopic');
        });
    });
    describe('Remote Config Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('remoteConfig'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('getTemplate');
            expect(operations).toContain('publishTemplate');
            expect(operations).toContain('rollback');
            expect(operations).toContain('listVersions');
            expect(operations).toContain('getConditions');
            expect(operations).toContain('getParameters');
        });
    });
    describe('Dynamic Links Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('dynamicLinks'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('createShortLink');
            expect(operations).toContain('getLinkStats');
        });
    });
    describe('Cloud Storage Resource', () => {
        it('should have all required operations', () => {
            const operationProperty = firebaseNode.description.properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('storage'));
            expect(operationProperty).toBeDefined();
            const operations = (operationProperty?.options).map((o) => o.value);
            expect(operations).toContain('upload');
            expect(operations).toContain('download');
            expect(operations).toContain('delete');
            expect(operations).toContain('getMetadata');
            expect(operations).toContain('updateMetadata');
            expect(operations).toContain('listFiles');
        });
    });
    describe('Input/Output Configuration', () => {
        it('should have correct input/output configuration', () => {
            expect(firebaseNode.description.inputs).toEqual(['main']);
            expect(firebaseNode.description.outputs).toEqual(['main']);
        });
    });
    describe('Default Values', () => {
        it('should have sensible default values for pagination', () => {
            const pageSizeProperty = firebaseNode.description.properties.find((p) => p.name === 'pageSize');
            if (pageSizeProperty && 'default' in pageSizeProperty) {
                expect(pageSizeProperty.default).toBeLessThanOrEqual(100);
            }
        });
        it('should have sensible default values for limits', () => {
            const limitProperty = firebaseNode.description.properties.find((p) => p.name === 'limit');
            if (limitProperty && 'default' in limitProperty) {
                expect(limitProperty.default).toBeLessThanOrEqual(100);
            }
        });
    });
});
//# sourceMappingURL=Firebase.node.test.js.map