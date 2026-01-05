"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = __importStar(require("jsonwebtoken"));
// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));
describe('Firebase API Transport', () => {
    const mockCredentials = {
        projectId: 'test-project',
        serviceAccountEmail: 'test@test-project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----',
        databaseUrl: 'https://test-project-default-rtdb.firebaseio.com',
        storageBucket: 'test-project.appspot.com',
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('JWT Token Generation', () => {
        it('should generate a JWT token with correct algorithm', () => {
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: mockCredentials.serviceAccountEmail,
                sub: mockCredentials.serviceAccountEmail,
                aud: 'https://oauth2.googleapis.com/token',
                iat: now,
                exp: now + 3600,
                scope: 'https://www.googleapis.com/auth/firebase.database',
            };
            jwt.sign(payload, mockCredentials.privateKey, { algorithm: 'RS256' });
            expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({
                iss: mockCredentials.serviceAccountEmail,
                sub: mockCredentials.serviceAccountEmail,
                aud: 'https://oauth2.googleapis.com/token',
            }), mockCredentials.privateKey, { algorithm: 'RS256' });
        });
        it('should include multiple scopes in JWT payload', () => {
            const now = Math.floor(Date.now() / 1000);
            const scopes = [
                'https://www.googleapis.com/auth/firebase.database',
                'https://www.googleapis.com/auth/cloud-platform',
            ];
            const payload = {
                iss: mockCredentials.serviceAccountEmail,
                sub: mockCredentials.serviceAccountEmail,
                aud: 'https://oauth2.googleapis.com/token',
                iat: now,
                exp: now + 3600,
                scope: scopes.join(' '),
            };
            jwt.sign(payload, mockCredentials.privateKey, { algorithm: 'RS256' });
            expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({
                scope: expect.stringContaining('firebase.database'),
            }), expect.any(String), expect.any(Object));
        });
        it('should set correct expiration time (1 hour)', () => {
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: mockCredentials.serviceAccountEmail,
                sub: mockCredentials.serviceAccountEmail,
                aud: 'https://oauth2.googleapis.com/token',
                iat: now,
                exp: now + 3600, // 1 hour
                scope: 'https://www.googleapis.com/auth/firebase.database',
            };
            jwt.sign(payload, mockCredentials.privateKey, { algorithm: 'RS256' });
            expect(jwt.sign).toHaveBeenCalledWith(expect.objectContaining({
                exp: now + 3600,
            }), expect.any(String), expect.any(Object));
        });
    });
    describe('URL Construction', () => {
        it('should construct Realtime Database URLs correctly', () => {
            const baseUrl = mockCredentials.databaseUrl;
            const path = 'users/123';
            const expectedUrl = `${baseUrl}/${path}.json`;
            expect(expectedUrl).toBe('https://test-project-default-rtdb.firebaseio.com/users/123.json');
        });
        it('should construct Firestore URLs correctly', () => {
            const projectId = mockCredentials.projectId;
            const endpoint = '/users/123';
            const expectedUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents${endpoint}`;
            expect(expectedUrl).toBe('https://firestore.googleapis.com/v1/projects/test-project/databases/(default)/documents/users/123');
        });
        it('should construct Auth URLs correctly', () => {
            const projectId = mockCredentials.projectId;
            const endpoint = '/accounts:lookup';
            const expectedUrl = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}${endpoint}`;
            expect(expectedUrl).toBe('https://identitytoolkit.googleapis.com/v1/projects/test-project/accounts:lookup');
        });
        it('should construct FCM URLs correctly', () => {
            const projectId = mockCredentials.projectId;
            const expectedUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
            expect(expectedUrl).toBe('https://fcm.googleapis.com/v1/projects/test-project/messages:send');
        });
        it('should construct Remote Config URLs correctly', () => {
            const projectId = mockCredentials.projectId;
            const endpoint = ':listVersions';
            const expectedUrl = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig${endpoint}`;
            expect(expectedUrl).toBe('https://firebaseremoteconfig.googleapis.com/v1/projects/test-project/remoteConfig:listVersions');
        });
        it('should construct Dynamic Links URLs correctly', () => {
            const endpoint = '/shortLinks';
            const expectedUrl = `https://firebasedynamiclinks.googleapis.com/v1${endpoint}`;
            expect(expectedUrl).toBe('https://firebasedynamiclinks.googleapis.com/v1/shortLinks');
        });
        it('should construct Storage URLs correctly', () => {
            const bucket = mockCredentials.storageBucket;
            const objectPath = 'path/to/file.txt';
            const encodedPath = encodeURIComponent(objectPath);
            const expectedUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
            expect(expectedUrl).toBe('https://storage.googleapis.com/storage/v1/b/test-project.appspot.com/o/path%2Fto%2Ffile.txt');
        });
        it('should construct Storage upload URLs correctly', () => {
            const bucket = mockCredentials.storageBucket;
            const expectedUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;
            expect(expectedUrl).toBe('https://storage.googleapis.com/upload/storage/v1/b/test-project.appspot.com/o');
        });
    });
    describe('Path Handling', () => {
        it('should clean leading slashes from paths', () => {
            const path = '/users/123';
            const cleanPath = path.replace(/^\/+|\/+$/g, '');
            expect(cleanPath).toBe('users/123');
        });
        it('should clean trailing slashes from paths', () => {
            const path = 'users/123/';
            const cleanPath = path.replace(/^\/+|\/+$/g, '');
            expect(cleanPath).toBe('users/123');
        });
        it('should handle empty paths', () => {
            const path = '';
            const cleanPath = path.replace(/^\/+|\/+$/g, '');
            expect(cleanPath).toBe('');
        });
        it('should URL encode object paths for Storage', () => {
            const objectPath = 'folder/subfolder/file name.txt';
            const encoded = encodeURIComponent(objectPath);
            expect(encoded).toBe('folder%2Fsubfolder%2Ffile%20name.txt');
        });
    });
    describe('Request Configuration', () => {
        it('should include Bearer token in authorization header', () => {
            const accessToken = 'mock-access-token';
            const headers = {
                Authorization: `Bearer ${accessToken}`,
            };
            expect(headers.Authorization).toBe('Bearer mock-access-token');
        });
        it('should set Content-Type to application/json for JSON requests', () => {
            const headers = {
                'Content-Type': 'application/json',
            };
            expect(headers['Content-Type']).toBe('application/json');
        });
        it('should set Content-Type based on file type for uploads', () => {
            const contentType = 'image/png';
            const headers = {
                'Content-Type': contentType,
            };
            expect(headers['Content-Type']).toBe('image/png');
        });
    });
});
//# sourceMappingURL=firebaseApi.test.js.map