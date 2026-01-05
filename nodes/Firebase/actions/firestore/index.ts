/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { firestoreRequest, firestoreQuery } from '../../transport/firebaseApi';
import {
  toFirestoreFields,
  fromFirestoreDocument,
  buildDocumentPath,
  parseJson,
  buildFirestoreFilter,
  buildCompositeFilter,
} from '../../utils/helpers';
import type { IFirestoreDocument } from '../../types/FirebaseTypes';

/**
 * Create a document in Firestore
 */
export async function createDocument(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const documentId = this.getNodeParameter('documentId', index, '') as string;
  const fieldsInput = this.getNodeParameter('fields', index, '{}') as string;

  const fields = parseJson(fieldsInput);
  const firestoreFields = toFirestoreFields(fields);

  const query: IDataObject = {};
  if (documentId) {
    query.documentId = documentId;
  }

  const body: IDataObject = {
    fields: firestoreFields,
  };

  const response = await firestoreRequest.call(
    this,
    'POST',
    `/${collectionId}`,
    body,
    query,
  );

  return [{ json: fromFirestoreDocument(response as unknown as IFirestoreDocument) }];
}

/**
 * Get a document from Firestore
 */
export async function getDocument(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const documentId = this.getNodeParameter('documentId', index, '') as string;

  const path = buildDocumentPath(collectionId, documentId);
  const response = await firestoreRequest.call(this, 'GET', path);

  return [{ json: fromFirestoreDocument(response as unknown as IFirestoreDocument) }];
}

/**
 * List documents from Firestore collection
 */
export async function listDocuments(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const pageSize = this.getNodeParameter('pageSize', index, 100) as number;
  const pageToken = this.getNodeParameter('pageToken', index, '') as string;

  const query: IDataObject = {
    pageSize,
  };

  if (pageToken) {
    query.pageToken = pageToken;
  }

  const response = await firestoreRequest.call(this, 'GET', `/${collectionId}`, undefined, query);

  const documents = (response.documents as IFirestoreDocument[]) || [];
  const results = documents.map((doc) => fromFirestoreDocument(doc));

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
export async function updateDocument(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const documentId = this.getNodeParameter('documentId', index, '') as string;
  const fieldsInput = this.getNodeParameter('fields', index, '{}') as string;
  const updateMask = this.getNodeParameter('updateMask', index, '') as string;

  const fields = parseJson(fieldsInput);
  const firestoreFields = toFirestoreFields(fields);

  const path = buildDocumentPath(collectionId, documentId);

  const query: IDataObject = {};
  if (updateMask) {
    // Convert comma-separated field names to update mask
    const fieldPaths = updateMask.split(',').map((f) => f.trim());
    query['updateMask.fieldPaths'] = fieldPaths;
  } else {
    // If no mask provided, update all fields in the input
    query['updateMask.fieldPaths'] = Object.keys(fields);
  }

  const body: IDataObject = {
    fields: firestoreFields,
  };

  const response = await firestoreRequest.call(this, 'PATCH', path, body, query);

  return [{ json: fromFirestoreDocument(response as unknown as IFirestoreDocument) }];
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocument(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const documentId = this.getNodeParameter('documentId', index, '') as string;

  const path = buildDocumentPath(collectionId, documentId);
  await firestoreRequest.call(this, 'DELETE', path);

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
export async function queryDocuments(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const collectionId = this.getNodeParameter('collectionId', index, '') as string;
  const filtersInput = this.getNodeParameter('filters', index, []) as IDataObject[];
  const orderByField = this.getNodeParameter('orderByField', index, '') as string;
  const orderDirection = this.getNodeParameter('orderDirection', index, 'ASCENDING') as string;
  const limit = this.getNodeParameter('limit', index, 0) as number;

  const structuredQuery: IDataObject = {};

  // Build filters
  if (filtersInput && filtersInput.length > 0) {
    const filters = filtersInput.map((filter) => {
      return buildFirestoreFilter(
        filter.field as string,
        filter.operator as string,
        filter.value,
      );
    });
    structuredQuery.where = buildCompositeFilter(filters);
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

  const response = await firestoreQuery.call(this, collectionId, structuredQuery);

  // Process results
  const results: IDataObject[] = [];
  for (const item of response) {
    if (item.document) {
      results.push(fromFirestoreDocument(item.document as unknown as IFirestoreDocument));
    }
  }

  return [{ json: { documents: results, count: results.length } }];
}

/**
 * Batch write to Firestore
 */
export async function batchWrite(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const writesInput = this.getNodeParameter('writes', index, []) as IDataObject[];

  const writes = writesInput.map((write) => {
    const operation = write.operation as string;
    const collectionId = write.collectionId as string;
    const documentId = write.documentId as string;

    if (operation === 'delete') {
      return {
        delete: `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}`,
      };
    }

    const fields = parseJson((write.fields as string) || '{}');
    const firestoreFields = toFirestoreFields(fields);

    return {
      update: {
        name: `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionId}/${documentId}`,
        fields: firestoreFields,
      },
    };
  });

  const body: IDataObject = { writes };

  const response = await firestoreRequest.call(this, 'POST', ':batchWrite', body);

  return [{ json: response }];
}

/**
 * Execute Firestore operation
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
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
