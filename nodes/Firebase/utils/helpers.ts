/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';
import type { IFirestoreValue, IFirestoreDocument } from '../types/FirebaseTypes';

/**
 * Convert a JavaScript value to Firestore value format
 */
export function toFirestoreValue(value: unknown): IFirestoreValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((v) => toFirestoreValue(v)),
      },
    };
  }

  if (typeof value === 'object') {
    const obj = value as IDataObject;

    // Check for GeoPoint
    if ('latitude' in obj && 'longitude' in obj && Object.keys(obj).length === 2) {
      return {
        geoPointValue: {
          latitude: obj.latitude as number,
          longitude: obj.longitude as number,
        },
      };
    }

    // Regular object/map
    const fields: { [key: string]: IFirestoreValue } = {};
    for (const [key, val] of Object.entries(obj)) {
      fields[key] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }

  // Default to string for unknown types
  return { stringValue: String(value) };
}

/**
 * Convert a Firestore value to JavaScript value
 */
export function fromFirestoreValue(value: IFirestoreValue): unknown {
  if ('nullValue' in value) {
    return null;
  }

  if ('stringValue' in value) {
    return value.stringValue;
  }

  if ('integerValue' in value) {
    return parseInt(value.integerValue as string, 10);
  }

  if ('doubleValue' in value) {
    return value.doubleValue;
  }

  if ('booleanValue' in value) {
    return value.booleanValue;
  }

  if ('timestampValue' in value) {
    return new Date(value.timestampValue as string);
  }

  if ('geoPointValue' in value && value.geoPointValue) {
    return {
      latitude: value.geoPointValue.latitude,
      longitude: value.geoPointValue.longitude,
    };
  }

  if ('arrayValue' in value && value.arrayValue) {
    return (value.arrayValue.values || []).map((v) => fromFirestoreValue(v));
  }

  if ('mapValue' in value && value.mapValue) {
    const result: IDataObject = {};
    const fields = value.mapValue.fields || {};
    for (const [key, val] of Object.entries(fields)) {
      result[key] = fromFirestoreValue(val) as IDataObject[keyof IDataObject];
    }
    return result;
  }

  if ('referenceValue' in value) {
    return value.referenceValue;
  }

  if ('bytesValue' in value) {
    return value.bytesValue;
  }

  return null;
}

/**
 * Convert a JavaScript object to Firestore document fields
 */
export function toFirestoreFields(data: IDataObject): { [key: string]: IFirestoreValue } {
  const fields: { [key: string]: IFirestoreValue } = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

/**
 * Convert a Firestore document to JavaScript object
 */
export function fromFirestoreDocument(doc: IFirestoreDocument): IDataObject {
  const result: IDataObject = {};

  if (doc.name) {
    // Extract document ID from the full path
    const parts = doc.name.split('/');
    result._id = parts[parts.length - 1];
    result._path = doc.name;
  }

  if (doc.createTime) {
    result._createTime = doc.createTime;
  }

  if (doc.updateTime) {
    result._updateTime = doc.updateTime;
  }

  if (doc.fields) {
    for (const [key, value] of Object.entries(doc.fields)) {
      result[key] = fromFirestoreValue(value) as IDataObject[keyof IDataObject];
    }
  }

  return result;
}

/**
 * Parse a JSON string safely
 */
export function parseJson(jsonString: string): IDataObject {
  try {
    return JSON.parse(jsonString) as IDataObject;
  } catch {
    throw new Error(`Invalid JSON: ${jsonString}`);
  }
}

/**
 * Build Firestore filter from n8n filter parameters
 */
export function buildFirestoreFilter(
  field: string,
  operator: string,
  value: unknown,
): IDataObject {
  const operatorMap: { [key: string]: string } = {
    '==': 'EQUAL',
    '!=': 'NOT_EQUAL',
    '<': 'LESS_THAN',
    '<=': 'LESS_THAN_OR_EQUAL',
    '>': 'GREATER_THAN',
    '>=': 'GREATER_THAN_OR_EQUAL',
    'array-contains': 'ARRAY_CONTAINS',
    'array-contains-any': 'ARRAY_CONTAINS_ANY',
    in: 'IN',
    'not-in': 'NOT_IN',
  };

  const firestoreOp = operatorMap[operator];
  if (!firestoreOp) {
    throw new Error(`Unknown operator: ${operator}`);
  }

  return {
    fieldFilter: {
      field: { fieldPath: field },
      op: firestoreOp,
      value: toFirestoreValue(value),
    },
  };
}

/**
 * Build composite filter from multiple filters
 */
export function buildCompositeFilter(
  filters: IDataObject[],
  operator: 'AND' | 'OR' = 'AND',
): IDataObject {
  if (filters.length === 1) {
    return filters[0];
  }

  return {
    compositeFilter: {
      op: operator,
      filters,
    },
  };
}

/**
 * Extract document ID from Firestore document path
 */
export function extractDocumentId(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

/**
 * Build document path from collection and document ID
 */
export function buildDocumentPath(collectionId: string, documentId?: string): string {
  if (documentId) {
    return `/${collectionId}/${documentId}`;
  }
  return `/${collectionId}`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (E.164)
 * E.164 format requires + followed by country code and subscriber number
 * Minimum 7 digits (e.g., +1234567), maximum 15 digits
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize database path
 */
export function sanitizePath(path: string): string {
  // Remove leading/trailing slashes and whitespace
  let sanitized = path.trim().replace(/^\/+|\/+$/g, '');

  // Replace multiple consecutive slashes with single slash
  sanitized = sanitized.replace(/\/+/g, '/');

  // Validate path characters
  if (!/^[\w\-/]+$/.test(sanitized) && sanitized !== '') {
    throw new Error('Invalid path: Path can only contain alphanumeric characters, underscores, hyphens, and forward slashes');
  }

  return sanitized;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends IDataObject>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key as keyof T];
    const targetValue = target[key as keyof T];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key as keyof T] = deepMerge(
        targetValue as IDataObject,
        sourceValue as IDataObject,
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key as keyof T] = sourceValue as T[keyof T];
    }
  }

  return result;
}
