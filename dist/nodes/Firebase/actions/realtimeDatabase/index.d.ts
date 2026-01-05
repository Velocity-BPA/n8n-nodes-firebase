import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
/**
 * Read data from the Realtime Database
 */
export declare function read(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Write data to the Realtime Database (overwrites)
 */
export declare function write(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Update data in the Realtime Database (merges)
 */
export declare function update(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Push a new child to the Realtime Database
 */
export declare function push(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Delete data from the Realtime Database
 */
export declare function deleteData(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Query data from the Realtime Database
 */
export declare function query(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]>;
/**
 * Execute Realtime Database operation
 */
export declare function execute(this: IExecuteFunctions, operation: string, index: number): Promise<INodeExecutionData[]>;
//# sourceMappingURL=index.d.ts.map