import type { IDataObject } from 'n8n-workflow';
import type { IFirestoreValue, IFirestoreDocument } from '../types/FirebaseTypes';
/**
 * Convert a JavaScript value to Firestore value format
 */
export declare function toFirestoreValue(value: unknown): IFirestoreValue;
/**
 * Convert a Firestore value to JavaScript value
 */
export declare function fromFirestoreValue(value: IFirestoreValue): unknown;
/**
 * Convert a JavaScript object to Firestore document fields
 */
export declare function toFirestoreFields(data: IDataObject): {
    [key: string]: IFirestoreValue;
};
/**
 * Convert a Firestore document to JavaScript object
 */
export declare function fromFirestoreDocument(doc: IFirestoreDocument): IDataObject;
/**
 * Parse a JSON string safely
 */
export declare function parseJson(jsonString: string): IDataObject;
/**
 * Build Firestore filter from n8n filter parameters
 */
export declare function buildFirestoreFilter(field: string, operator: string, value: unknown): IDataObject;
/**
 * Build composite filter from multiple filters
 */
export declare function buildCompositeFilter(filters: IDataObject[], operator?: 'AND' | 'OR'): IDataObject;
/**
 * Extract document ID from Firestore document path
 */
export declare function extractDocumentId(path: string): string;
/**
 * Build document path from collection and document ID
 */
export declare function buildDocumentPath(collectionId: string, documentId?: string): string;
/**
 * Format bytes to human-readable size
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate phone number format (E.164)
 * E.164 format requires + followed by country code and subscriber number
 * Minimum 7 digits (e.g., +1234567), maximum 15 digits
 */
export declare function isValidPhoneNumber(phone: string): boolean;
/**
 * Sanitize database path
 */
export declare function sanitizePath(path: string): string;
/**
 * Deep merge objects
 */
export declare function deepMerge<T extends IDataObject>(target: T, source: Partial<T>): T;
//# sourceMappingURL=helpers.d.ts.map