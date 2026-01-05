import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Create a document in Firestore
 */
export declare function createDocument(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get a document from Firestore
 */
export declare function getDocument(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * List documents from Firestore collection
 */
export declare function listDocuments(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Update a document in Firestore
 */
export declare function updateDocument(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Delete a document from Firestore
 */
export declare function deleteDocument(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Run a query on Firestore
 */
export declare function queryDocuments(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Batch write to Firestore
 */
export declare function batchWrite(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Firestore operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map