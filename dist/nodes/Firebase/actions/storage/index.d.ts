import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Upload a file to Cloud Storage
 */
export declare function upload(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Download a file from Cloud Storage
 */
export declare function download(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Delete a file from Cloud Storage
 */
export declare function deleteFile(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Get file metadata
 */
export declare function getMetadata(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Update file metadata
 */
export declare function updateMetadata(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * List files in bucket
 */
export declare function listFiles(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Storage operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map