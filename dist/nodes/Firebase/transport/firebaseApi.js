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
exports.getFirebaseCredentials = getFirebaseCredentials;
exports.getAccessToken = getAccessToken;
exports.realtimeDatabaseRequest = realtimeDatabaseRequest;
exports.firestoreRequest = firestoreRequest;
exports.firestoreQuery = firestoreQuery;
exports.authRequest = authRequest;
exports.messagingRequest = messagingRequest;
exports.topicManagementRequest = topicManagementRequest;
exports.remoteConfigRequest = remoteConfigRequest;
exports.dynamicLinksRequest = dynamicLinksRequest;
exports.storageRequest = storageRequest;
exports.storageUpload = storageUpload;
exports.storageDownload = storageDownload;
const n8n_workflow_1 = require("n8n-workflow");
const jwt = __importStar(require("jsonwebtoken"));
const tokenCache = new Map();
/**
 * Get Firebase credentials from the node
 */
async function getFirebaseCredentials() {
    const credentials = await this.getCredentials('firebaseApi');
    return {
        projectId: credentials.projectId,
        serviceAccountEmail: credentials.serviceAccountEmail,
        privateKey: credentials.privateKey.replace(/\\n/g, '\n'),
        databaseUrl: credentials.databaseUrl,
        storageBucket: credentials.storageBucket,
    };
}
/**
 * Generate OAuth 2.0 access token using service account JWT
 */
async function getAccessToken(credentials, scopes = [
    'https://www.googleapis.com/auth/firebase.database',
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase.messaging',
    'https://www.googleapis.com/auth/firebase.remoteconfig',
    'https://www.googleapis.com/auth/devstorage.full_control',
]) {
    const cacheKey = `${credentials.serviceAccountEmail}:${scopes.join(',')}`;
    const now = Math.floor(Date.now() / 1000);
    // Check cache for valid token
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > now + 60) {
        return cached.token;
    }
    // Generate JWT
    const payload = {
        iss: credentials.serviceAccountEmail,
        sub: credentials.serviceAccountEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: scopes.join(' '),
    };
    const signedJwt = jwt.sign(payload, credentials.privateKey, { algorithm: 'RS256' });
    // Exchange JWT for access token
    const options = {
        method: 'POST',
        url: 'https://oauth2.googleapis.com/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
    };
    try {
        const response = (await this.helpers.httpRequest(options));
        // Cache the token
        tokenCache.set(cacheKey, {
            token: response.access_token,
            expiresAt: now + response.expires_in,
        });
        return response.access_token;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: 'Failed to obtain access token. Please check your service account credentials.',
        });
    }
}
/**
 * Make a request to the Firebase Realtime Database
 */
async function realtimeDatabaseRequest(method, path, body, query) {
    const credentials = await getFirebaseCredentials.call(this);
    if (!credentials.databaseUrl) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
            message: 'Database URL is required for Realtime Database operations',
        });
    }
    const accessToken = await getAccessToken.call(this, credentials);
    // Clean the path - remove leading/trailing slashes
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const url = `${credentials.databaseUrl}/${cleanPath}.json`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        qs: query,
        json: true,
    };
    if (body && Object.keys(body).length > 0) {
        options.body = body;
    }
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Cloud Firestore
 */
async function firestoreRequest(method, endpoint, body, query) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents`;
    const url = `${baseUrl}${endpoint}`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        qs: query,
        json: true,
    };
    if (body && Object.keys(body).length > 0) {
        options.body = body;
    }
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Run a Firestore query
 */
async function firestoreQuery(collectionId, structuredQuery) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents:runQuery`;
    const body = {
        structuredQuery: {
            from: [{ collectionId }],
            ...structuredQuery,
        },
    };
    const options = {
        method: 'POST',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body,
        json: true,
    };
    try {
        const response = (await this.helpers.httpRequest(options));
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Firebase Authentication (Identity Toolkit)
 */
async function authRequest(method, endpoint, body, query) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${credentials.projectId}${endpoint}`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        qs: query,
        json: true,
    };
    if (body && Object.keys(body).length > 0) {
        options.body = body;
    }
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Firebase Cloud Messaging
 */
async function messagingRequest(body) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://fcm.googleapis.com/v1/projects/${credentials.projectId}/messages:send`;
    const options = {
        method: 'POST',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body,
        json: true,
    };
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Manage topic subscriptions (subscribe/unsubscribe)
 */
async function topicManagementRequest(endpoint, topic, tokens) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://iid.googleapis.com/iid/v1${endpoint}`;
    const options = {
        method: 'POST',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            access_token_auth: 'true',
        },
        body: {
            to: `/topics/${topic}`,
            registration_tokens: tokens,
        },
        json: true,
    };
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Firebase Remote Config
 */
async function remoteConfigRequest(method, endpoint = '', body, query, headers) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://firebaseremoteconfig.googleapis.com/v1/projects/${credentials.projectId}/remoteConfig${endpoint}`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...headers,
        },
        qs: query,
        json: true,
        returnFullResponse: true,
    };
    if (body && Object.keys(body).length > 0) {
        options.body = body;
    }
    try {
        const response = await this.helpers.httpRequest(options);
        // Handle full response to get etag from headers
        if (response.headers && response.body) {
            return {
                ...response.body,
                etag: response.headers.etag,
            };
        }
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Firebase Dynamic Links
 */
async function dynamicLinksRequest(method, endpoint, body, query) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const url = `https://firebasedynamiclinks.googleapis.com/v1${endpoint}`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        qs: query,
        json: true,
    };
    if (body && Object.keys(body).length > 0) {
        options.body = body;
    }
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Make a request to Cloud Storage
 */
async function storageRequest(method, endpoint, body, query, headers, returnBinary = false) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const bucket = credentials.storageBucket;
    if (!bucket) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
            message: 'Storage bucket is required for Cloud Storage operations',
        });
    }
    const url = `https://storage.googleapis.com${endpoint}`;
    const options = {
        method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...headers,
        },
        qs: query,
    };
    if (body) {
        options.body = body;
    }
    if (returnBinary) {
        options.encoding = 'arraybuffer';
        options.json = false;
    }
    else {
        options.json = true;
    }
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Upload a file to Cloud Storage
 */
async function storageUpload(objectPath, data, contentType, metadata) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const bucket = credentials.storageBucket;
    if (!bucket) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
            message: 'Storage bucket is required for Cloud Storage operations',
        });
    }
    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;
    const options = {
        method: 'POST',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': contentType,
        },
        qs: {
            uploadType: 'media',
            name: objectPath,
        },
        body: data,
        json: true,
    };
    try {
        const response = (await this.helpers.httpRequest(options));
        // If metadata provided, update it
        if (metadata && Object.keys(metadata).length > 0) {
            const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
            const metadataOptions = {
                method: 'PATCH',
                url: metadataUrl,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: { metadata },
                json: true,
            };
            return await this.helpers.httpRequest(metadataOptions);
        }
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
/**
 * Download a file from Cloud Storage
 */
async function storageDownload(objectPath) {
    const credentials = await getFirebaseCredentials.call(this);
    const accessToken = await getAccessToken.call(this, credentials);
    const bucket = credentials.storageBucket;
    if (!bucket) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
            message: 'Storage bucket is required for Cloud Storage operations',
        });
    }
    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const options = {
        method: 'GET',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        qs: {
            alt: 'media',
        },
        encoding: 'arraybuffer',
        json: false,
    };
    try {
        return await this.helpers.httpRequest(options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
//# sourceMappingURL=firebaseApi.js.map