/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import * as jwt from 'jsonwebtoken';
import type { IFirebaseCredentials, ITokenResponse, IJwtPayload } from '../types/FirebaseTypes';

// Token cache to avoid regenerating tokens on every request
interface ITokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, ITokenCache>();

/**
 * Get Firebase credentials from the node
 */
export async function getFirebaseCredentials(
  this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<IFirebaseCredentials> {
  const credentials = await this.getCredentials('firebaseApi');
  return {
    projectId: credentials.projectId as string,
    serviceAccountEmail: credentials.serviceAccountEmail as string,
    privateKey: (credentials.privateKey as string).replace(/\\n/g, '\n'),
    databaseUrl: credentials.databaseUrl as string | undefined,
    storageBucket: credentials.storageBucket as string | undefined,
  };
}

/**
 * Generate OAuth 2.0 access token using service account JWT
 */
export async function getAccessToken(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  credentials: IFirebaseCredentials,
  scopes: string[] = [
    'https://www.googleapis.com/auth/firebase.database',
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase.messaging',
    'https://www.googleapis.com/auth/firebase.remoteconfig',
    'https://www.googleapis.com/auth/devstorage.full_control',
  ],
): Promise<string> {
  const cacheKey = `${credentials.serviceAccountEmail}:${scopes.join(',')}`;
  const now = Math.floor(Date.now() / 1000);

  // Check cache for valid token
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > now + 60) {
    return cached.token;
  }

  // Generate JWT
  const payload: IJwtPayload = {
    iss: credentials.serviceAccountEmail,
    sub: credentials.serviceAccountEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: scopes.join(' '),
  };

  const signedJwt = jwt.sign(payload, credentials.privateKey, { algorithm: 'RS256' });

  // Exchange JWT for access token
  const options: IHttpRequestOptions = {
    method: 'POST',
    url: 'https://oauth2.googleapis.com/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  };

  try {
    const response = (await this.helpers.httpRequest(options)) as ITokenResponse;

    // Cache the token
    tokenCache.set(cacheKey, {
      token: response.access_token,
      expiresAt: now + response.expires_in,
    });

    return response.access_token;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
      message: 'Failed to obtain access token. Please check your service account credentials.',
    });
  }
}

/**
 * Make a request to the Firebase Realtime Database
 */
export async function realtimeDatabaseRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  path: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<IDataObject | IDataObject[] | string | number | boolean | null> {
  const credentials = await getFirebaseCredentials.call(this);

  if (!credentials.databaseUrl) {
    throw new NodeApiError(this.getNode(), {
      message: 'Database URL is required for Realtime Database operations',
    } as JsonObject);
  }

  const accessToken = await getAccessToken.call(this, credentials);

  // Clean the path - remove leading/trailing slashes
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const url = `${credentials.databaseUrl}/${cleanPath}.json`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    qs: query as IDataObject,
    json: true,
  };

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Cloud Firestore
 */
export async function firestoreRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents`;
  const url = `${baseUrl}${endpoint}`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    qs: query as IDataObject,
    json: true,
  };

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Run a Firestore query
 */
export async function firestoreQuery(
  this: IExecuteFunctions,
  collectionId: string,
  structuredQuery: IDataObject,
): Promise<IDataObject[]> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      ...structuredQuery,
    },
  };

  const options: IHttpRequestOptions = {
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
    const response = (await this.helpers.httpRequest(options)) as IDataObject[];
    return response;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Firebase Authentication (Identity Toolkit)
 */
export async function authRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://identitytoolkit.googleapis.com/v1/projects/${credentials.projectId}${endpoint}`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    qs: query as IDataObject,
    json: true,
  };

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Firebase Cloud Messaging
 */
export async function messagingRequest(
  this: IExecuteFunctions,
  body: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://fcm.googleapis.com/v1/projects/${credentials.projectId}/messages:send`;

  const options: IHttpRequestOptions = {
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
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Manage topic subscriptions (subscribe/unsubscribe)
 */
export async function topicManagementRequest(
  this: IExecuteFunctions,
  endpoint: string,
  topic: string,
  tokens: string[],
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://iid.googleapis.com/iid/v1${endpoint}`;

  const options: IHttpRequestOptions = {
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
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Firebase Remote Config
 */
export async function remoteConfigRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string = '',
  body?: IDataObject,
  query?: IDataObject,
  headers?: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://firebaseremoteconfig.googleapis.com/v1/projects/${credentials.projectId}/remoteConfig${endpoint}`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    },
    qs: query as IDataObject,
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
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Firebase Dynamic Links
 */
export async function dynamicLinksRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  query?: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const url = `https://firebasedynamiclinks.googleapis.com/v1${endpoint}`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    qs: query as IDataObject,
    json: true,
  };

  if (body && Object.keys(body).length > 0) {
    options.body = body;
  }

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Make a request to Cloud Storage
 */
export async function storageRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: Buffer | IDataObject,
  query?: IDataObject,
  headers?: IDataObject,
  returnBinary: boolean = false,
): Promise<IDataObject | Buffer> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const bucket = credentials.storageBucket;
  if (!bucket) {
    throw new NodeApiError(this.getNode(), {
      message: 'Storage bucket is required for Cloud Storage operations',
    } as JsonObject);
  }

  const url = `https://storage.googleapis.com${endpoint}`;

  const options: IHttpRequestOptions = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(headers as Record<string, string>),
    },
    qs: query as IDataObject,
  };

  if (body) {
    options.body = body;
  }

  if (returnBinary) {
    options.encoding = 'arraybuffer';
    options.json = false;
  } else {
    options.json = true;
  }

  try {
    return await this.helpers.httpRequest(options);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Upload a file to Cloud Storage
 */
export async function storageUpload(
  this: IExecuteFunctions,
  objectPath: string,
  data: Buffer,
  contentType: string,
  metadata?: IDataObject,
): Promise<IDataObject> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const bucket = credentials.storageBucket;
  if (!bucket) {
    throw new NodeApiError(this.getNode(), {
      message: 'Storage bucket is required for Cloud Storage operations',
    } as JsonObject);
  }

  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;

  const options: IHttpRequestOptions = {
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
    const response = (await this.helpers.httpRequest(options)) as IDataObject;

    // If metadata provided, update it
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
      const metadataOptions: IHttpRequestOptions = {
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
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}

/**
 * Download a file from Cloud Storage
 */
export async function storageDownload(
  this: IExecuteFunctions,
  objectPath: string,
): Promise<Buffer> {
  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  const bucket = credentials.storageBucket;
  if (!bucket) {
    throw new NodeApiError(this.getNode(), {
      message: 'Storage bucket is required for Cloud Storage operations',
    } as JsonObject);
  }

  const encodedPath = encodeURIComponent(objectPath);
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;

  const options: IHttpRequestOptions = {
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
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
  }
}
