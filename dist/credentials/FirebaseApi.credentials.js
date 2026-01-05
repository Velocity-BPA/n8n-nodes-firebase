"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseApi = void 0;
class FirebaseApi {
    constructor() {
        this.name = 'firebaseApi';
        this.displayName = 'Firebase API';
        this.documentationUrl = 'https://firebase.google.com/docs/admin/setup';
        this.properties = [
            {
                displayName: 'Project ID',
                name: 'projectId',
                type: 'string',
                default: '',
                required: true,
                description: 'The Firebase project ID (found in Firebase Console → Project Settings)',
                placeholder: 'my-firebase-project',
            },
            {
                displayName: 'Service Account Email',
                name: 'serviceAccountEmail',
                type: 'string',
                default: '',
                required: true,
                description: 'The service account email address',
                placeholder: 'firebase-adminsdk-xxxxx@my-project.iam.gserviceaccount.com',
            },
            {
                displayName: 'Private Key',
                name: 'privateKey',
                type: 'string',
                typeOptions: {
                    password: true,
                    rows: 5,
                },
                default: '',
                required: true,
                description: 'The private key from the service account JSON file. Include the full key with BEGIN/END markers.',
                placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
            },
            {
                displayName: 'Database URL',
                name: 'databaseUrl',
                type: 'string',
                default: '',
                description: 'The Realtime Database URL (required for Realtime Database operations). Format: https://[PROJECT_ID].firebaseio.com or https://[PROJECT_ID]-default-rtdb.firebaseio.com',
                placeholder: 'https://my-project-default-rtdb.firebaseio.com',
            },
            {
                displayName: 'Storage Bucket',
                name: 'storageBucket',
                type: 'string',
                default: '',
                description: 'The Cloud Storage bucket name (required for Storage operations). Format: [PROJECT_ID].appspot.com',
                placeholder: 'my-project.appspot.com',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {},
        };
        this.test = {
            request: {
                baseURL: 'https://oauth2.googleapis.com',
                url: '/tokeninfo',
                method: 'GET',
                qs: {
                    access_token: '={{$credentials.accessToken}}',
                },
            },
        };
    }
}
exports.FirebaseApi = FirebaseApi;
//# sourceMappingURL=FirebaseApi.credentials.js.map