"use strict";
/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
exports.download = download;
exports.deleteFile = deleteFile;
exports.getMetadata = getMetadata;
exports.updateMetadata = updateMetadata;
exports.listFiles = listFiles;
exports.execute = execute;
const firebaseApi_1 = require("../../transport/firebaseApi");
const helpers_1 = require("../../utils/helpers");
/**
 * Upload a file to Cloud Storage
 */
async function upload(index) {
    const objectPath = this.getNodeParameter('objectPath', index, '');
    const contentType = this.getNodeParameter('contentType', index, 'application/octet-stream');
    const metadataInput = this.getNodeParameter('metadata', index, '{}');
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
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
    const metadata = (0, helpers_1.parseJson)(metadataInput);
    const bucket = credentials.storageBucket;
    // Upload the file
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o`;
    const uploadOptions = {
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
        const metadataResponse = await this.helpers.httpRequest(metadataOptions);
        return [{ json: metadataResponse }];
    }
    return [{ json: uploadResponse }];
}
/**
 * Download a file from Cloud Storage
 */
async function download(index) {
    const objectPath = this.getNodeParameter('objectPath', index, '');
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index, 'data');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
    if (!credentials.storageBucket) {
        throw new Error('Storage bucket is required for Cloud Storage operations');
    }
    const bucket = credentials.storageBucket;
    const encodedPath = encodeURIComponent(objectPath);
    // First, get metadata to determine content type
    const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const metadataOptions = {
        method: 'GET',
        url: metadataUrl,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        json: true,
    };
    const metadata = (await this.helpers.httpRequest(metadataOptions));
    // Download the file
    const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const downloadOptions = {
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
    const binaryData = await this.helpers.prepareBinaryData(Buffer.from(buffer), fileName, metadata.contentType);
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
async function deleteFile(index) {
    const objectPath = this.getNodeParameter('objectPath', index, '');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
    if (!credentials.storageBucket) {
        throw new Error('Storage bucket is required for Cloud Storage operations');
    }
    const bucket = credentials.storageBucket;
    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const options = {
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
async function getMetadata(index) {
    const objectPath = this.getNodeParameter('objectPath', index, '');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
    if (!credentials.storageBucket) {
        throw new Error('Storage bucket is required for Cloud Storage operations');
    }
    const bucket = credentials.storageBucket;
    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const options = {
        method: 'GET',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        json: true,
    };
    const response = (await this.helpers.httpRequest(options));
    return [
        {
            json: {
                ...response,
                sizeFormatted: (0, helpers_1.formatBytes)(parseInt(response.size, 10)),
            },
        },
    ];
}
/**
 * Update file metadata
 */
async function updateMetadata(index) {
    const objectPath = this.getNodeParameter('objectPath', index, '');
    const metadataInput = this.getNodeParameter('metadata', index, '{}');
    const contentType = this.getNodeParameter('contentType', index, '');
    const cacheControl = this.getNodeParameter('cacheControl', index, '');
    const contentDisposition = this.getNodeParameter('contentDisposition', index, '');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
    if (!credentials.storageBucket) {
        throw new Error('Storage bucket is required for Cloud Storage operations');
    }
    const bucket = credentials.storageBucket;
    const encodedPath = encodeURIComponent(objectPath);
    const customMetadata = (0, helpers_1.parseJson)(metadataInput);
    const body = {};
    if (contentType)
        body.contentType = contentType;
    if (cacheControl)
        body.cacheControl = cacheControl;
    if (contentDisposition)
        body.contentDisposition = contentDisposition;
    if (Object.keys(customMetadata).length > 0)
        body.metadata = customMetadata;
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedPath}`;
    const options = {
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
    return [{ json: response }];
}
/**
 * List files in bucket
 */
async function listFiles(index) {
    const prefix = this.getNodeParameter('prefix', index, '');
    const delimiter = this.getNodeParameter('delimiter', index, '');
    const maxResults = this.getNodeParameter('maxResults', index, 100);
    const pageToken = this.getNodeParameter('pageToken', index, '');
    const credentials = await firebaseApi_1.getFirebaseCredentials.call(this);
    const accessToken = await firebaseApi_1.getAccessToken.call(this, credentials);
    if (!credentials.storageBucket) {
        throw new Error('Storage bucket is required for Cloud Storage operations');
    }
    const bucket = credentials.storageBucket;
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o`;
    const qs = {
        maxResults,
    };
    if (prefix)
        qs.prefix = prefix;
    if (delimiter)
        qs.delimiter = delimiter;
    if (pageToken)
        qs.pageToken = pageToken;
    const options = {
        method: 'GET',
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        qs,
        json: true,
    };
    const response = (await this.helpers.httpRequest(options));
    const items = (response.items || []).map((item) => ({
        ...item,
        sizeFormatted: (0, helpers_1.formatBytes)(parseInt(item.size, 10)),
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
async function execute(operation, index) {
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
//# sourceMappingURL=index.js.map