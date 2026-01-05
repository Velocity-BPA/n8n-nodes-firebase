/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { realtimeDatabaseRequest } from '../../transport/firebaseApi';
import { sanitizePath, parseJson } from '../../utils/helpers';

/**
 * Read data from the Realtime Database
 */
export async function read(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;
  const shallow = this.getNodeParameter('shallow', index, false) as boolean;

  const query: IDataObject = {};
  if (shallow) {
    query.shallow = 'true';
  }

  const cleanPath = sanitizePath(path);
  const response = await realtimeDatabaseRequest.call(this, 'GET', cleanPath, undefined, query);

  return [{ json: { data: response, path: cleanPath } }];
}

/**
 * Write data to the Realtime Database (overwrites)
 */
export async function write(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '') as string;

  const cleanPath = sanitizePath(path);
  const data = parseJson(dataInput);

  const response = await realtimeDatabaseRequest.call(this, 'PUT', cleanPath, data);

  return [{ json: { data: response, path: cleanPath, operation: 'write' } }];
}

/**
 * Update data in the Realtime Database (merges)
 */
export async function update(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '') as string;

  const cleanPath = sanitizePath(path);
  const data = parseJson(dataInput);

  const response = await realtimeDatabaseRequest.call(this, 'PATCH', cleanPath, data);

  return [{ json: { data: response, path: cleanPath, operation: 'update' } }];
}

/**
 * Push a new child to the Realtime Database
 */
export async function push(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;
  const dataInput = this.getNodeParameter('data', index, '') as string;

  const cleanPath = sanitizePath(path);
  const data = parseJson(dataInput);

  const response = await realtimeDatabaseRequest.call(this, 'POST', cleanPath, data);

  return [{ json: { ...(response as IDataObject), path: cleanPath, operation: 'push' } }];
}

/**
 * Delete data from the Realtime Database
 */
export async function deleteData(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;

  const cleanPath = sanitizePath(path);
  await realtimeDatabaseRequest.call(this, 'DELETE', cleanPath);

  return [{ json: { success: true, path: cleanPath, operation: 'delete' } }];
}

/**
 * Query data from the Realtime Database
 */
export async function query(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const path = this.getNodeParameter('path', index, '') as string;
  const orderBy = this.getNodeParameter('orderBy', index, '') as string;
  const equalTo = this.getNodeParameter('equalTo', index, '') as string;
  const startAt = this.getNodeParameter('startAt', index, '') as string;
  const endAt = this.getNodeParameter('endAt', index, '') as string;
  const limitToFirst = this.getNodeParameter('limitToFirst', index, 0) as number;
  const limitToLast = this.getNodeParameter('limitToLast', index, 0) as number;

  const cleanPath = sanitizePath(path);
  const queryParams: IDataObject = {};

  if (orderBy) {
    // orderBy must be quoted in the query
    queryParams.orderBy = `"${orderBy}"`;
  }

  if (equalTo) {
    // Determine if value is string, number, or boolean
    const parsed = parseQueryValue(equalTo);
    queryParams.equalTo = typeof parsed === 'string' ? `"${parsed}"` : parsed;
  }

  if (startAt) {
    const parsed = parseQueryValue(startAt);
    queryParams.startAt = typeof parsed === 'string' ? `"${parsed}"` : parsed;
  }

  if (endAt) {
    const parsed = parseQueryValue(endAt);
    queryParams.endAt = typeof parsed === 'string' ? `"${parsed}"` : parsed;
  }

  if (limitToFirst > 0) {
    queryParams.limitToFirst = limitToFirst;
  }

  if (limitToLast > 0) {
    queryParams.limitToLast = limitToLast;
  }

  const response = await realtimeDatabaseRequest.call(this, 'GET', cleanPath, undefined, queryParams);

  return [{ json: { data: response, path: cleanPath, query: queryParams } }];
}

/**
 * Parse a query value to appropriate type
 */
function parseQueryValue(value: string): string | number | boolean {
  // Check for boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Check for number
  const num = Number(value);
  if (!isNaN(num)) return num;

  // Return as string
  return value;
}

/**
 * Execute Realtime Database operation
 */
export async function execute(
  this: IExecuteFunctions,
  operation: string,
  index: number,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'read':
      return read.call(this, index);
    case 'write':
      return write.call(this, index);
    case 'update':
      return update.call(this, index);
    case 'push':
      return push.call(this, index);
    case 'delete':
      return deleteData.call(this, index);
    case 'query':
      return query.call(this, index);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
