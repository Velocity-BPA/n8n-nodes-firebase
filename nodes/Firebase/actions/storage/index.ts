/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { getFirebaseCredentials, getAccessToken } from '../../transport/firebaseApi';
import { parseJson, formatBytes } from '../../utils/helpers';
import type { IHttpRequestOptions } from 'n8n-workflow';

/**
 * Upload a file to Cloud Storage
 */
export async function upload(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const objectPath = this.getNodeParameter('objectPath', index, '') as string;
  const contentType = this.getNodeParameter('contentType', index, 'application/octet-stream') as string;
  const metadataInput = this.getNodeParameter('metadata', index, '{}') as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const items = this.getInputData();
  const item = items[index];

  if (!item.binary || !item.binary[binaryPropertyName]) {
    throw new Error(`No binary data found in property "${binaryPropertyName}"`);
  }

  const binaryData = item.binary[binaryPropertyName];
  const buffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);

  const metadata = parseJson(metadataInput);
  const bucket = credentials.storageBucket;

  // Upload the file
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;

  const uploadOptions: IHttpRequestOptions = {
    method: 'POST',
    url: uploadUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType || binaryData.mimeType,
    },
    qs: {
      uploadType: 'media',
      name: objectPath,
    },
    body: buffer,
    json: true,
  };

  const uploadResponse = await this.helpers.httpRequest(uploadOptions);

  // If metadata provided, update it
  if (metadata && Object.keys(metadata).length > 0) {
    const encodedPath = encodeURIComponent(objectPath);
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

    const metadataResponse = await this.helpers.httpRequest(metadataOptions);
    return [{ json: metadataResponse as IDataObject }];
  }

  return [{ json: uploadResponse as IDataObject }];
}

/**
 * Download a file from Cloud Storage
 */
export async function download(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const objectPath = this.getNodeParameter('objectPath', index, '') as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const bucket = credentials.storageBucket;
  const encodedPath = encodeURIComponent(objectPath);

  // First, get metadata to determine content type
  const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
  const metadataOptions: IHttpRequestOptions = {
    method: 'GET',
    url: metadataUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: true,
  };

  const metadata = (await this.helpers.httpRequest(metadataOptions)) as IDataObject;

  // Download the file
  const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
  const downloadOptions: IHttpRequestOptions = {
    method: 'GET',
    url: downloadUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    qs: {
      alt: 'media',
    },
    encoding: 'arraybuffer',
    json: false,
  };

  const buffer = await this.helpers.httpRequest(downloadOptions);

  // Prepare binary data
  const fileName = objectPath.split('/').pop() || 'file';
  const binaryData = await this.helpers.prepareBinaryData(
    Buffer.from(buffer as ArrayBuffer),
    fileName,
    metadata.contentType as string,
  );

  return [
    {
      json: {
        name: metadata.name,
        bucket: metadata.bucket,
        contentType: metadata.contentType,
        size: metadata.size,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
      },
      binary: {
        [binaryPropertyName]: binaryData,
      },
    },
  ];
}

/**
 * Delete a file from Cloud Storage
 */
export async function deleteFile(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const objectPath = this.getNodeParameter('objectPath', index, '') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const bucket = credentials.storageBucket;
  const encodedPath = encodeURIComponent(objectPath);

  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;

  const options: IHttpRequestOptions = {
    method: 'DELETE',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  await this.helpers.httpRequest(options);

  return [
    {
      json: {
        success: true,
        objectPath,
        operation: 'delete',
      },
    },
  ];
}

/**
 * Get file metadata
 */
export async function getMetadata(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const objectPath = this.getNodeParameter('objectPath', index, '') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const bucket = credentials.storageBucket;
  const encodedPath = encodeURIComponent(objectPath);

  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;

  const options: IHttpRequestOptions = {
    method: 'GET',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: true,
  };

  const response = (await this.helpers.httpRequest(options)) as IDataObject;

  return [
    {
      json: {
        ...response,
        sizeFormatted: formatBytes(parseInt(response.size as string, 10)),
      },
    },
  ];
}

/**
 * Update file metadata
 */
export async function updateMetadata(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const objectPath = this.getNodeParameter('objectPath', index, '') as string;
  const metadataInput = this.getNodeParameter('metadata', index, '{}') as string;
  const contentType = this.getNodeParameter('contentType', index, '') as string;
  const cacheControl = this.getNodeParameter('cacheControl', index, '') as string;
  const contentDisposition = this.getNodeParameter('contentDisposition', index, '') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const bucket = credentials.storageBucket;
  const encodedPath = encodeURIComponent(objectPath);
  const customMetadata = parseJson(metadataInput);

  const body: IDataObject = {};

  if (contentType) body.contentType = contentType;
  if (cacheControl) body.cacheControl = cacheControl;
  if (contentDisposition) body.contentDisposition = contentDisposition;
  if (Object.keys(customMetadata).length > 0) body.metadata = customMetadata;

  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;

  const options: IHttpRequestOptions = {
    method: 'PATCH',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
    json: true,
  };

  const response = await this.helpers.httpRequest(options);

  return [{ json: response as IDataObject }];
}

/**
 * List files in bucket
 */
export async function listFiles(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const prefix = this.getNodeParameter('prefix', index, '') as string;
  const delimiter = this.getNodeParameter('delimiter', index, '') as string;
  const maxResults = this.getNodeParameter('maxResults', index, 100) as number;
  const pageToken = this.getNodeParameter('pageToken', index, '') as string;

  const credentials = await getFirebaseCredentials.call(this);
  const accessToken = await getAccessToken.call(this, credentials);

  if (!credentials.storageBucket) {
    throw new Error('Storage bucket is required for Cloud Storage operations');
  }

  const bucket = credentials.storageBucket;
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o`;

  const qs: IDataObject = {
    maxResults,
  };

  if (prefix) qs.prefix = prefix;
  if (delimiter) qs.delimiter = delimiter;
  if (pageToken) qs.pageToken = pageToken;

  const options: IHttpRequestOptions = {
    method: 'GET',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    qs,
    json: true,
  };

  const response = (await this.helpers.httpRequest(options)) as IDataObject;

  const items = ((response.items as IDataObject[]) || []).map((item) => ({
    ...item,
    sizeFormatted: formatBytes(parseInt(item.size as string, 10)),
  }));

  return [
    {
      json: {
        items,
        prefixes: response.prefixes || [],
        nextPageToken: response.nextPageToken || null,
      },
    },
  ];
}

/**
 * Execute Storage operation
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'upload':
      return upload.call(this, index);
    case 'download':
      return download.call(this, index);
    case 'delete':
      return deleteFile.call(this, index);
    case 'getMetadata':
      return getMetadata.call(this, index);
    case 'updateMetadata':
      return updateMetadata.call(this, index);
    case 'listFiles':
      return listFiles.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
