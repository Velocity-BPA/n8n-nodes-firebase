import type { IDataObject, IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions } from 'n8n-workflow';
import type { IFirebaseCredentials } from '../types/FirebaseTypes';
/**
 * Get Firebase credentials from the node
 */
export declare function getFirebaseCredentials(this: IExecuteFunctions | ILoadOptionsFunctions): Promise<IFirebaseCredentials>;
/**
 * Generate OAuth 2.0 access token using service account JWT
 */
export declare function getAccessToken(this: IExecuteFunctions | ILoadOptionsFunctions, credentials: IFirebaseCredentials, scopes?: string[]): Promise<string>;
/**
 * Make a request to the Firebase Realtime Database
 */
export declare function realtimeDatabaseRequest(this: IExecuteFunctions, method: IHttpRequestMethods, path: string, body?: IDataObject, query?: IDataObject): Promise<IDataObject | IDataObject[] | string | number | boolean | null>;
/**
 * Make a request to Cloud Firestore
 */
export declare function firestoreRequest(this: IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject, query?: IDataObject): Promise<IDataObject>;
/**
 * Run a Firestore query
 */
export declare function firestoreQuery(this: IExecuteFunctions, collectionId: string, structuredQuery: IDataObject): Promise<IDataObject[]>;
/**
 * Make a request to Firebase Authentication (Identity Toolkit)
 */
export declare function authRequest(this: IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject, query?: IDataObject): Promise<IDataObject>;
/**
 * Make a request to Firebase Cloud Messaging
 */
export declare function messagingRequest(this: IExecuteFunctions, body: IDataObject): Promise<IDataObject>;
/**
 * Manage topic subscriptions (subscribe/unsubscribe)
 */
export declare function topicManagementRequest(this: IExecuteFunctions, endpoint: string, topic: string, tokens: string[]): Promise<IDataObject>;
/**
 * Make a request to Firebase Remote Config
 */
export declare function remoteConfigRequest(this: IExecuteFunctions, method: IHttpRequestMethods, endpoint?: string, body?: IDataObject, query?: IDataObject, headers?: IDataObject): Promise<IDataObject>;
/**
 * Make a request to Firebase Dynamic Links
 */
export declare function dynamicLinksRequest(this: IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body?: IDataObject, query?: IDataObject): Promise<IDataObject>;
/**
 * Make a request to Cloud Storage
 */
export declare function storageRequest(this: IExecuteFunctions, method: IHttpRequestMethods, endpoint: string, body?: Buffer | IDataObject, query?: IDataObject, headers?: IDataObject, returnBinary?: boolean): Promise<IDataObject | Buffer>;
/**
 * Upload a file to Cloud Storage
 */
export declare function storageUpload(this: IExecuteFunctions, objectPath: string, data: Buffer, contentType: string, metadata?: IDataObject): Promise<IDataObject>;
/**
 * Download a file from Cloud Storage
 */
export declare function storageDownload(this: IExecuteFunctions, objectPath: string): Promise<Buffer>;
//# sourceMappingURL=firebaseApi.d.ts.map