/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import * as realtimeDatabase from './actions/realtimeDatabase';
import * as firestore from './actions/firestore';
import * as auth from './actions/auth';
import * as messaging from './actions/messaging';
import * as remoteConfig from './actions/remoteConfig';
import * as dynamicLinks from './actions/dynamicLinks';
import * as storage from './actions/storage';

// Emit licensing notice once per node load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

let licensingNoticeEmitted = false;

function emitLicensingNotice(): void {
  if (!licensingNoticeEmitted) {
    // eslint-disable-next-line no-console
    console.warn(LICENSING_NOTICE);
    licensingNoticeEmitted = true;
  }
}

export class Firebase implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Firebase',
    name: 'firebase',
    icon: 'file:firebase.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Interact with Firebase services including Realtime Database, Firestore, Auth, FCM, Remote Config, Dynamic Links, and Storage',
    defaults: {
      name: 'Firebase',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'firebaseApi',
        required: true,
      },
    ],
    properties: [
      // Resource Selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Authentication',
            value: 'auth',
            description: 'Manage Firebase users',
          },
          {
            name: 'Cloud Firestore',
            value: 'firestore',
            description: 'Interact with Cloud Firestore documents',
          },
          {
            name: 'Cloud Messaging',
            value: 'messaging',
            description: 'Send push notifications via FCM',
          },
          {
            name: 'Cloud Storage',
            value: 'storage',
            description: 'Manage files in Cloud Storage',
          },
          {
            name: 'Dynamic Links',
            value: 'dynamicLinks',
            description: 'Create and manage Dynamic Links',
          },
          {
            name: 'Realtime Database',
            value: 'realtimeDatabase',
            description: 'Interact with Realtime Database',
          },
          {
            name: 'Remote Config',
            value: 'remoteConfig',
            description: 'Manage Remote Config templates',
          },
        ],
        default: 'realtimeDatabase',
      },

      // ===== REALTIME DATABASE OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
          },
        },
        options: [
          { name: 'Delete', value: 'delete', description: 'Delete data at path', action: 'Delete data at path' },
          { name: 'Push', value: 'push', description: 'Push new child data', action: 'Push new child data' },
          { name: 'Query', value: 'query', description: 'Query data with filters', action: 'Query data with filters' },
          { name: 'Read', value: 'read', description: 'Read data from path', action: 'Read data from path' },
          { name: 'Update', value: 'update', description: 'Update data at path (merge)', action: 'Update data at path' },
          { name: 'Write', value: 'write', description: 'Write data to path (overwrite)', action: 'Write data to path' },
        ],
        default: 'read',
      },

      // ===== FIRESTORE OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['firestore'],
          },
        },
        options: [
          { name: 'Batch Write', value: 'batchWrite', description: 'Perform batch operations', action: 'Perform batch operations' },
          { name: 'Create Document', value: 'createDocument', description: 'Create a new document', action: 'Create a new document' },
          { name: 'Delete Document', value: 'deleteDocument', description: 'Delete a document', action: 'Delete a document' },
          { name: 'Get Document', value: 'getDocument', description: 'Get a document by ID', action: 'Get a document by ID' },
          { name: 'List Documents', value: 'listDocuments', description: 'List documents in collection', action: 'List documents in collection' },
          { name: 'Query', value: 'query', description: 'Query documents with filters', action: 'Query documents with filters' },
          { name: 'Update Document', value: 'updateDocument', description: 'Update a document', action: 'Update a document' },
        ],
        default: 'getDocument',
      },

      // ===== AUTH OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['auth'],
          },
        },
        options: [
          { name: 'Create User', value: 'createUser', description: 'Create a new user', action: 'Create a new user' },
          { name: 'Delete User', value: 'deleteUser', description: 'Delete a user', action: 'Delete a user' },
          { name: 'Generate Email Verification Link', value: 'generateEmailVerificationLink', description: 'Generate email verification link', action: 'Generate email verification link' },
          { name: 'Generate Password Reset Link', value: 'generatePasswordResetLink', description: 'Generate password reset link', action: 'Generate password reset link' },
          { name: 'Get User', value: 'getUser', description: 'Get user by UID', action: 'Get user by UID' },
          { name: 'Get User by Email', value: 'getUserByEmail', description: 'Get user by email', action: 'Get user by email' },
          { name: 'List Users', value: 'listUsers', description: 'List all users', action: 'List all users' },
          { name: 'Revoke Refresh Tokens', value: 'revokeRefreshTokens', description: 'Revoke refresh tokens', action: 'Revoke refresh tokens' },
          { name: 'Set Custom Claims', value: 'setCustomClaims', description: 'Set custom claims', action: 'Set custom claims' },
          { name: 'Update User', value: 'updateUser', description: 'Update a user', action: 'Update a user' },
        ],
        default: 'getUser',
      },

      // ===== MESSAGING OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['messaging'],
          },
        },
        options: [
          { name: 'Send Message', value: 'sendMessage', description: 'Send to single device', action: 'Send to single device' },
          { name: 'Send Multicast', value: 'sendMulticast', description: 'Send to multiple devices', action: 'Send to multiple devices' },
          { name: 'Send to Condition', value: 'sendToCondition', description: 'Send to topic condition', action: 'Send to topic condition' },
          { name: 'Send to Topic', value: 'sendToTopic', description: 'Send to topic', action: 'Send to topic' },
          { name: 'Subscribe to Topic', value: 'subscribeToTopic', description: 'Subscribe tokens to topic', action: 'Subscribe tokens to topic' },
          { name: 'Unsubscribe from Topic', value: 'unsubscribeFromTopic', description: 'Unsubscribe from topic', action: 'Unsubscribe from topic' },
        ],
        default: 'sendMessage',
      },

      // ===== REMOTE CONFIG OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['remoteConfig'],
          },
        },
        options: [
          { name: 'Get Conditions', value: 'getConditions', description: 'Get conditions from template', action: 'Get conditions from template' },
          { name: 'Get Parameters', value: 'getParameters', description: 'Get parameters from template', action: 'Get parameters from template' },
          { name: 'Get Template', value: 'getTemplate', description: 'Get current template', action: 'Get current template' },
          { name: 'List Versions', value: 'listVersions', description: 'List template versions', action: 'List template versions' },
          { name: 'Publish Template', value: 'publishTemplate', description: 'Publish new template', action: 'Publish new template' },
          { name: 'Rollback', value: 'rollback', description: 'Rollback to version', action: 'Rollback to version' },
        ],
        default: 'getTemplate',
      },

      // ===== DYNAMIC LINKS OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
          },
        },
        options: [
          { name: 'Create Short Link', value: 'createShortLink', description: 'Create a short dynamic link', action: 'Create a short dynamic link' },
          { name: 'Get Link Stats', value: 'getLinkStats', description: 'Get link statistics', action: 'Get link statistics' },
        ],
        default: 'createShortLink',
      },

      // ===== STORAGE OPERATIONS =====
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['storage'],
          },
        },
        options: [
          { name: 'Delete', value: 'delete', description: 'Delete a file', action: 'Delete a file' },
          { name: 'Download', value: 'download', description: 'Download a file', action: 'Download a file' },
          { name: 'Get Metadata', value: 'getMetadata', description: 'Get file metadata', action: 'Get file metadata' },
          { name: 'List Files', value: 'listFiles', description: 'List files in bucket', action: 'List files in bucket' },
          { name: 'Update Metadata', value: 'updateMetadata', description: 'Update file metadata', action: 'Update file metadata' },
          { name: 'Upload', value: 'upload', description: 'Upload a file', action: 'Upload a file' },
        ],
        default: 'listFiles',
      },

      // ===== REALTIME DATABASE FIELDS =====
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
          },
        },
        placeholder: 'users/user123',
        description: 'Database path to the data',
      },
      {
        displayName: 'Data (JSON)',
        name: 'data',
        type: 'string',
        default: '{}',
        required: true,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['write', 'update', 'push'],
          },
        },
        description: 'Data to write as JSON',
      },
      {
        displayName: 'Shallow',
        name: 'shallow',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['read'],
          },
        },
        description: 'Whether to return only keys (not values)',
      },
      {
        displayName: 'Order By',
        name: 'orderBy',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        placeholder: '$key, $value, or child_key',
        description: 'Order results by key, value, or child',
      },
      {
        displayName: 'Equal To',
        name: 'equalTo',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        description: 'Filter to items equal to this value',
      },
      {
        displayName: 'Start At',
        name: 'startAt',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        description: 'Start at this value (for pagination)',
      },
      {
        displayName: 'End At',
        name: 'endAt',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        description: 'End at this value (for pagination)',
      },
      {
        displayName: 'Limit to First',
        name: 'limitToFirst',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        description: 'Limit to first N results (0 for no limit)',
      },
      {
        displayName: 'Limit to Last',
        name: 'limitToLast',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            resource: ['realtimeDatabase'],
            operation: ['query'],
          },
        },
        description: 'Limit to last N results (0 for no limit)',
      },

      // ===== FIRESTORE FIELDS =====
      {
        displayName: 'Collection ID',
        name: 'collectionId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['firestore'],
          },
        },
        placeholder: 'users',
        description: 'The collection name',
      },
      {
        displayName: 'Document ID',
        name: 'documentId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['createDocument', 'getDocument', 'updateDocument', 'deleteDocument'],
          },
        },
        description: 'The document ID. Leave empty to auto-generate for createDocument.',
      },
      {
        displayName: 'Fields (JSON)',
        name: 'fields',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['createDocument', 'updateDocument'],
          },
        },
        description: 'Document fields as JSON object',
      },
      {
        displayName: 'Update Mask',
        name: 'updateMask',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['updateDocument'],
          },
        },
        placeholder: 'field1,field2',
        description: 'Comma-separated list of fields to update. Leave empty to update all provided fields.',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        default: 100,
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['listDocuments'],
          },
        },
        description: 'Number of documents per page',
      },
      {
        displayName: 'Page Token',
        name: 'pageToken',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['listDocuments'],
          },
        },
        description: 'Token for pagination',
      },
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['query'],
          },
        },
        options: [
          {
            name: 'filterValues',
            displayName: 'Filter',
            values: [
              {
                displayName: 'Field',
                name: 'field',
                type: 'string',
                default: '',
                description: 'Field name to filter on',
              },
              {
                displayName: 'Operator',
                name: 'operator',
                type: 'options',
                options: [
                  { name: '==', value: '==' },
                  { name: '!=', value: '!=' },
                  { name: '<', value: '<' },
                  { name: '<=', value: '<=' },
                  { name: '>', value: '>' },
                  { name: '>=', value: '>=' },
                  { name: 'array-contains', value: 'array-contains' },
                  { name: 'array-contains-any', value: 'array-contains-any' },
                  { name: 'in', value: 'in' },
                  { name: 'not-in', value: 'not-in' },
                ],
                default: '==',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'Value to compare',
              },
            ],
          },
        ],
        description: 'Query filters',
      },
      {
        displayName: 'Order By Field',
        name: 'orderByField',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['query'],
          },
        },
        description: 'Field to order by',
      },
      {
        displayName: 'Order Direction',
        name: 'orderDirection',
        type: 'options',
        options: [
          { name: 'Ascending', value: 'ASCENDING' },
          { name: 'Descending', value: 'DESCENDING' },
        ],
        default: 'ASCENDING',
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['query'],
          },
        },
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 0,
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['query'],
          },
        },
        description: 'Maximum number of results (0 for no limit)',
      },
      {
        displayName: 'Writes',
        name: 'writes',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            resource: ['firestore'],
            operation: ['batchWrite'],
          },
        },
        options: [
          {
            name: 'writeValues',
            displayName: 'Write',
            values: [
              {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                options: [
                  { name: 'Create/Update', value: 'update' },
                  { name: 'Delete', value: 'delete' },
                ],
                default: 'update',
              },
              {
                displayName: 'Collection ID',
                name: 'collectionId',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Document ID',
                name: 'documentId',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Fields (JSON)',
                name: 'fields',
                type: 'string',
                default: '{}',
                displayOptions: {
                  show: {
                    operation: ['update'],
                  },
                },
              },
            ],
          },
        ],
      },

      // ===== AUTH FIELDS =====
      {
        displayName: 'User ID (UID)',
        name: 'uid',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['getUser', 'updateUser', 'deleteUser', 'setCustomClaims', 'revokeRefreshTokens'],
          },
        },
        description: 'The user\'s unique ID',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser', 'getUserByEmail', 'generatePasswordResetLink', 'generateEmailVerificationLink'],
          },
        },
        description: 'User email address',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
        description: 'User password (min 6 characters)',
      },
      {
        displayName: 'Display Name',
        name: 'displayName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
      },
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
        placeholder: '+1234567890',
        description: 'Phone number in E.164 format',
      },
      {
        displayName: 'Photo URL',
        name: 'photoUrl',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
      },
      {
        displayName: 'Disabled',
        name: 'disabled',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
        description: 'Whether the user account is disabled',
      },
      {
        displayName: 'Email Verified',
        name: 'emailVerified',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['createUser', 'updateUser'],
          },
        },
      },
      {
        displayName: 'Custom Claims (JSON)',
        name: 'customClaims',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['setCustomClaims'],
          },
        },
        description: 'Custom claims as JSON object',
      },
      {
        displayName: 'Max Results',
        name: 'maxResults',
        type: 'number',
        default: 100,
        displayOptions: {
          show: {
            resource: ['auth'],
            operation: ['listUsers'],
          },
        },
        description: 'Maximum number of users to return',
      },

      // ===== MESSAGING FIELDS =====
      {
        displayName: 'Device Token',
        name: 'token',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage'],
          },
        },
        description: 'FCM registration token',
      },
      {
        displayName: 'Device Tokens',
        name: 'tokens',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMulticast', 'subscribeToTopic', 'unsubscribeFromTopic'],
          },
        },
        placeholder: 'token1,token2,token3',
        description: 'Comma-separated FCM registration tokens',
      },
      {
        displayName: 'Topic',
        name: 'topic',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendToTopic', 'subscribeToTopic', 'unsubscribeFromTopic'],
          },
        },
        placeholder: 'news',
        description: 'Topic name (without /topics/ prefix)',
      },
      {
        displayName: 'Condition',
        name: 'condition',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendToCondition'],
          },
        },
        placeholder: "'TopicA' in topics && 'TopicB' in topics",
        description: 'Topic condition expression',
      },
      {
        displayName: 'Notification Title',
        name: 'notificationTitle',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage', 'sendMulticast', 'sendToTopic', 'sendToCondition'],
          },
        },
      },
      {
        displayName: 'Notification Body',
        name: 'notificationBody',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage', 'sendMulticast', 'sendToTopic', 'sendToCondition'],
          },
        },
      },
      {
        displayName: 'Notification Image',
        name: 'notificationImage',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage', 'sendMulticast', 'sendToTopic', 'sendToCondition'],
          },
        },
        description: 'URL to notification image',
      },
      {
        displayName: 'Data Payload (JSON)',
        name: 'data',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage', 'sendMulticast', 'sendToTopic', 'sendToCondition'],
          },
        },
        description: 'Custom data payload as JSON',
      },
      {
        displayName: 'Android Config (JSON)',
        name: 'androidConfig',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage'],
          },
        },
        description: 'Android-specific configuration',
      },
      {
        displayName: 'APNS Config (JSON)',
        name: 'apnsConfig',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage'],
          },
        },
        description: 'iOS-specific configuration',
      },
      {
        displayName: 'Web Push Config (JSON)',
        name: 'webpushConfig',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['messaging'],
            operation: ['sendMessage'],
          },
        },
        description: 'Web push configuration',
      },

      // ===== REMOTE CONFIG FIELDS =====
      {
        displayName: 'Parameters (JSON)',
        name: 'parameters',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['remoteConfig'],
            operation: ['publishTemplate'],
          },
        },
        description: 'Remote Config parameters as JSON',
      },
      {
        displayName: 'Conditions (JSON)',
        name: 'conditions',
        type: 'string',
        default: '[]',
        displayOptions: {
          show: {
            resource: ['remoteConfig'],
            operation: ['publishTemplate'],
          },
        },
        description: 'Remote Config conditions as JSON array',
      },
      {
        displayName: 'Validate Only',
        name: 'validateOnly',
        type: 'boolean',
        default: false,
        displayOptions: {
          show: {
            resource: ['remoteConfig'],
            operation: ['publishTemplate'],
          },
        },
        description: 'Whether to validate without publishing',
      },
      {
        displayName: 'Version Number',
        name: 'versionNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['remoteConfig'],
            operation: ['rollback'],
          },
        },
        description: 'Version number to rollback to',
      },

      // ===== DYNAMIC LINKS FIELDS =====
      {
        displayName: 'Domain URI Prefix',
        name: 'domainUriPrefix',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
        placeholder: 'https://example.page.link',
        description: 'Your Dynamic Links domain',
      },
      {
        displayName: 'Link',
        name: 'link',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
        description: 'The deep link URL',
      },
      {
        displayName: 'Suffix Option',
        name: 'suffixOption',
        type: 'options',
        options: [
          { name: 'Unguessable', value: 'UNGUESSABLE' },
          { name: 'Short', value: 'SHORT' },
        ],
        default: 'UNGUESSABLE',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Android Package Name',
        name: 'androidPackageName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Android Fallback Link',
        name: 'androidFallbackLink',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Android Min Version',
        name: 'androidMinVersion',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'iOS Bundle ID',
        name: 'iosBundleId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'iOS Fallback Link',
        name: 'iosFallbackLink',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'iOS App Store ID',
        name: 'iosAppStoreId',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Social Title',
        name: 'socialTitle',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Social Description',
        name: 'socialDescription',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Social Image Link',
        name: 'socialImageLink',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'UTM Source',
        name: 'utmSource',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'UTM Medium',
        name: 'utmMedium',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'UTM Campaign',
        name: 'utmCampaign',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['createShortLink'],
          },
        },
      },
      {
        displayName: 'Short Link',
        name: 'shortLink',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['getLinkStats'],
          },
        },
        description: 'The short dynamic link to get stats for',
      },
      {
        displayName: 'Duration Days',
        name: 'durationDays',
        type: 'number',
        default: 7,
        displayOptions: {
          show: {
            resource: ['dynamicLinks'],
            operation: ['getLinkStats'],
          },
        },
        description: 'Number of days to get stats for',
      },

      // ===== STORAGE FIELDS =====
      {
        displayName: 'Object Path',
        name: 'objectPath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['upload', 'download', 'delete', 'getMetadata', 'updateMetadata'],
          },
        },
        placeholder: 'folder/file.txt',
        description: 'Path to the file in storage',
      },
      {
        displayName: 'Binary Property',
        name: 'binaryPropertyName',
        type: 'string',
        default: 'data',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['upload', 'download'],
          },
        },
        description: 'Name of the binary property',
      },
      {
        displayName: 'Content Type',
        name: 'contentType',
        type: 'string',
        default: 'application/octet-stream',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['upload', 'updateMetadata'],
          },
        },
        description: 'MIME type of the file',
      },
      {
        displayName: 'Metadata (JSON)',
        name: 'metadata',
        type: 'string',
        default: '{}',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['upload', 'updateMetadata'],
          },
        },
        description: 'Custom metadata as JSON',
      },
      {
        displayName: 'Cache Control',
        name: 'cacheControl',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['updateMetadata'],
          },
        },
        placeholder: 'public, max-age=3600',
      },
      {
        displayName: 'Content Disposition',
        name: 'contentDisposition',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['updateMetadata'],
          },
        },
      },
      {
        displayName: 'Prefix',
        name: 'prefix',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['listFiles'],
          },
        },
        description: 'Filter to objects with this prefix',
      },
      {
        displayName: 'Delimiter',
        name: 'delimiter',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['listFiles'],
          },
        },
        placeholder: '/',
        description: 'Delimiter for folder-like listing',
      },
      {
        displayName: 'Max Results',
        name: 'maxResults',
        type: 'number',
        default: 100,
        displayOptions: {
          show: {
            resource: ['storage'],
            operation: ['listFiles'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    emitLicensingNotice();

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[];

        switch (resource) {
          case 'realtimeDatabase':
            result = await realtimeDatabase.execute.call(this, operation, i);
            break;
          case 'firestore':
            result = await firestore.execute.call(this, operation, i);
            break;
          case 'auth':
            result = await auth.execute.call(this, operation, i);
            break;
          case 'messaging':
            result = await messaging.execute.call(this, operation, i);
            break;
          case 'remoteConfig':
            result = await remoteConfig.execute.call(this, operation, i);
            break;
          case 'dynamicLinks':
            result = await dynamicLinks.execute.call(this, operation, i);
            break;
          case 'storage':
            result = await storage.execute.call(this, operation, i);
            break;
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
